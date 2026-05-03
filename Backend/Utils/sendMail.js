const nodemailer = require("nodemailer");
const dns = require("dns");
const https = require("https");
require("../Config/loadEnv");

const transporters = new Map();

dns.setDefaultResultOrder?.("ipv4first");

const getMailConfig = ({ requirePassword = true } = {}) => {
    const user = process.env.EMAIL?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

    if (!user || (requirePassword && !pass)) {
        throw new Error("Email service is not configured. Please set EMAIL and EMAIL_PASS.");
    }

    return { user, pass };
};

const isTruthy = (value) => ["true", "1", "yes"].includes(String(value || "").toLowerCase());

const getSender = () => ({
    email: process.env.EMAIL_FROM?.trim() || process.env.EMAIL?.trim(),
    name: process.env.EMAIL_FROM_NAME?.trim() || "Bus Concession"
});

const getEmailProviderStatus = () => ({
    brevo: Boolean(process.env.BREVO_API_KEY?.trim()),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    smtp: Boolean(process.env.EMAIL?.trim() && process.env.EMAIL_PASS?.trim())
});

const requestJson = ({ hostname, path, headers, body }) => new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = https.request(
        {
            hostname,
            path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
                ...headers
            },
            timeout: 30000
        },
        (response) => {
            let responseBody = "";

            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                responseBody += chunk;
            });
            response.on("end", () => {
                if (response.statusCode >= 200 && response.statusCode < 300) {
                    resolve();
                    return;
                }

                const error = new Error(`Email API failed with status ${response.statusCode}`);
                error.statusCode = response.statusCode;
                error.responseBody = responseBody;
                reject(error);
            });
        }
    );

    request.on("timeout", () => {
        request.destroy(Object.assign(new Error("Email API request timed out"), { code: "ETIMEDOUT" }));
    });
    request.on("error", reject);
    request.write(payload);
    request.end();
});

const sendBrevoMail = async ({ to, subject, text }) => {
    const apiKey = process.env.BREVO_API_KEY?.trim();

    if (!apiKey) {
        return false;
    }

    const sender = getSender();

    await requestJson({
        hostname: "api.brevo.com",
        path: "/v3/smtp/email",
        headers: {
            "api-key": apiKey
        },
        body: {
            sender,
            to: [{ email: to }],
            subject,
            textContent: text
        }
    });

    return true;
};

const getApiErrorMessage = (error) => {
    const detail = String(error?.responseBody || "").slice(0, 500);

    if (detail) {
        console.error("Email API provider rejected request:", {
            statusCode: error.statusCode,
            detail
        });
    }

    if (error?.statusCode === 401 || error?.statusCode === 403) {
        return "Email API provider rejected the request. Please check the API key and verify the sender email/domain.";
    }

    return "Email API provider failed. Please check the API key, sender email, and provider account logs.";
};

const sendResendMail = async ({ to, subject, text }) => {
    const apiKey = process.env.RESEND_API_KEY?.trim();

    if (!apiKey) {
        return false;
    }

    const sender = getSender();

    await requestJson({
        hostname: "api.resend.com",
        path: "/emails",
        headers: {
            Authorization: `Bearer ${apiKey}`
        },
        body: {
            from: `${sender.name} <${sender.email}>`,
            to,
            subject,
            text
        }
    });

    return true;
};

const getTransportOptions = () => {
    const { user, pass } = getMailConfig();
    const configuredHost = process.env.SMTP_HOST?.trim();
    const configuredPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : null;
    const configuredSecure = process.env.SMTP_SECURE ? isTruthy(process.env.SMTP_SECURE) : null;
    const baseOptions = {
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        family: 4,
        lookup: (hostname, options, callback) => {
            dns.lookup(hostname, { ...options, family: 4 }, callback);
        },
        auth: {
            user,
            pass
        }
    };

    const candidates = [];
    const addCandidate = ({ host, port, secure }) => {
        const key = `${host}:${port}:${secure}`;

        if (candidates.some((candidate) => candidate.key === key)) {
            return;
        }

        candidates.push({
            key,
            options: {
                ...baseOptions,
                host,
                port,
                secure,
                requireTLS: !secure
            }
        });
    };

    addCandidate({
        host: configuredHost || "smtp.gmail.com",
        port: configuredPort || 587,
        secure: configuredSecure ?? false
    });

    if (!configuredHost || configuredHost === "smtp.gmail.com") {
        addCandidate({ host: "smtp.gmail.com", port: 465, secure: true });
        addCandidate({ host: "smtp.gmail.com", port: 587, secure: false });
    }

    return candidates;
};

const getTransporter = (candidate) => {
    if (!transporters.has(candidate.key)) {
        transporters.set(candidate.key, nodemailer.createTransport(candidate.options));
    }

    return transporters.get(candidate.key);
};

const isNetworkError = (error) => (
    ["ENETUNREACH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNRESET", "ECONNREFUSED"].includes(error.code)
);

const toFriendlyMailError = (error, { apiConfigured = false } = {}) => {
    if (error?.code === "EAUTH") {
        return new Error("Email authentication failed. Please check EMAIL and EMAIL_PASS app password.");
    }

    if (isNetworkError(error)) {
        if (!apiConfigured) {
            return new Error(
                "Live server cannot reach SMTP. Add BREVO_API_KEY or RESEND_API_KEY in the backend environment, redeploy, and try again."
            );
        }

        return new Error(
            "Email service is unreachable from this network. Please check internet/SMTP access and try again."
        );
    }

    return error;
};

const sendTextMail = async ({ to, subject, text }) => {
    getMailConfig({ requirePassword: false });
    const providerStatus = getEmailProviderStatus();
    let apiError;
    let smtpError;

    try {
        if (await sendBrevoMail({ to, subject, text })) {
            return;
        }

        if (await sendResendMail({ to, subject, text })) {
            return;
        }
    } catch (error) {
        apiError = error;
    }

    if (!providerStatus.smtp) {
        if (apiError) {
            throw new Error("Email API provider failed. Please check the API key and verified sender email.");
        }

        throw new Error("Email service is not configured. Please set BREVO_API_KEY or RESEND_API_KEY for the live backend.");
    }

    const { user } = getMailConfig();
    const candidates = getTransportOptions();

    for (const candidate of candidates) {
        try {
            await getTransporter(candidate).sendMail({
                from: user,
                to,
                subject,
                text
            });

            return;
        } catch (error) {
            smtpError = error;
            transporters.delete(candidate.key);

            if (!isNetworkError(error)) {
                break;
            }
        }
    }

    if (apiError) {
        throw new Error(`${getApiErrorMessage(apiError)} SMTP is also unavailable from this live server.`);
    }

    throw toFriendlyMailError(smtpError, {
        apiConfigured: providerStatus.brevo || providerStatus.resend
    });
};

const sendOTP = async (to, otp) => {
    await sendTextMail({
        to,
        subject: "Bus Concession OTP",
        text: `Your OTP is: ${otp}`
    });
};

module.exports = sendOTP;
module.exports.sendTextMail = sendTextMail;
module.exports.getEmailProviderStatus = getEmailProviderStatus;
