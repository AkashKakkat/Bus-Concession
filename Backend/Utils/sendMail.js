const nodemailer = require("nodemailer");
const dns = require("dns");
require("../Config/loadEnv");

const transporters = new Map();

dns.setDefaultResultOrder?.("ipv4first");

const getMailConfig = () => {
    const user = process.env.EMAIL?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

    if (!user || !pass) {
        throw new Error("Email service is not configured. Please set EMAIL and EMAIL_PASS.");
    }

    return { user, pass };
};

const isTruthy = (value) => ["true", "1", "yes"].includes(String(value || "").toLowerCase());

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

const toFriendlyMailError = (error) => {
    if (error?.code === "EAUTH") {
        return new Error("Email authentication failed. Please check EMAIL and EMAIL_PASS app password.");
    }

    if (isNetworkError(error)) {
        return new Error(
            "Email service is unreachable from this network. Please check internet/SMTP access and try again."
        );
    }

    return error;
};

const sendTextMail = async ({ to, subject, text }) => {
    const { user } = getMailConfig();
    const candidates = getTransportOptions();
    let lastError;

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
            lastError = error;
            transporters.delete(candidate.key);

            if (!isNetworkError(error)) {
                break;
            }
        }
    }

    throw toFriendlyMailError(lastError);
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
