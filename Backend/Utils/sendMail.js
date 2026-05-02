const nodemailer = require("nodemailer");
require("../Config/loadEnv");

let transporter;

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
            service: "gmail",
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
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

    await getTransporter().sendMail({
        from: user,
        to,
        subject,
        text
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
