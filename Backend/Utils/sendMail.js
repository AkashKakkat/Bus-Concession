const { google } = require("googleapis");
require("../Config/loadEnv");

let gmailClient;

const getMailConfig = () => {
    const user = process.env.EMAIL?.trim();
    const clientId = process.env.GMAIL_CLIENT_ID?.trim();
    const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

    if (!user || !clientId || !clientSecret || !refreshToken) {
        throw new Error(
            "Email service is not configured. Please set EMAIL, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN."
        );
    }

    return { user, clientId, clientSecret, refreshToken };
};

const encodeBase64Url = (value) => (
    Buffer.from(value)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
);

const cleanHeader = (value) => String(value || "").replace(/[\r\n]/g, " ").trim();

const createRawMessage = ({ from, to, subject, text }) => {
    const message = [
        `From: ${cleanHeader(from)}`,
        `To: ${cleanHeader(to)}`,
        `Subject: ${cleanHeader(subject)}`,
        "MIME-Version: 1.0",
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        text
    ].join("\r\n");

    return encodeBase64Url(message);
};

const getGmailClient = () => {
    if (gmailClient) {
        return gmailClient;
    }

    const { clientId, clientSecret, refreshToken } = getMailConfig();
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    gmailClient = google.gmail({ version: "v1", auth });
    return gmailClient;
};

const toFriendlyMailError = (error) => {
    const reason = error?.errors?.[0]?.reason;

    if ([401, 403].includes(error?.code) || ["authError", "forbidden"].includes(reason)) {
        return new Error(
            "Email authentication failed. Please check Gmail API OAuth credentials and refresh token."
        );
    }

    if (["ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"].includes(error?.code)) {
        return new Error(
            "Email service is unreachable from this network. Please check internet/Google API access and try again."
        );
    }

    return error;
};

const sendTextMail = async ({ to, subject, text }) => {
    const { user } = getMailConfig();
    const gmail = getGmailClient();

    try {
        await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: createRawMessage({
                    from: user,
                    to,
                    subject,
                    text
                })
            }
        });
    } catch (error) {
        throw toFriendlyMailError(error);
    }
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
