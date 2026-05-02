const nodemailer = require("nodemailer");
const dns = require("dns");
require("../Config/loadEnv");

let transporter;

dns.setDefaultResultOrder?.("ipv4first");

const getMailConfig = () => {
    const user = process.env.EMAIL?.trim();
    const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

    if (!user || !pass) {
        throw new Error("Email service is not configured. Please set EMAIL and EMAIL_PASS.");
    }

    return { user, pass };
};

const getTransporter = () => {
    if (!transporter) {
        const { user, pass } = getMailConfig();

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || "false") === "true",
            requireTLS: true,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            family: 4,
            lookup: (hostname, options, callback) => {
                dns.lookup(hostname, { ...options, family: 4 }, callback);
            },
            auth: {
                user,
                pass
            }
        });
    }

    return transporter;
};

const sendTextMail = async ({ to, subject, text }) => {
    const { user } = getMailConfig();

    try {
        await getTransporter().sendMail({
            from: user,
            to,
            subject,
            text
        });
    } catch (error) {
        if (["ENETUNREACH", "ECONNECTION", "ETIMEDOUT", "ESOCKET"].includes(error.code)) {
            throw new Error(
                "Email service is unreachable from this network. Please check internet/SMTP access and try again."
            );
        }

        throw error;
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
