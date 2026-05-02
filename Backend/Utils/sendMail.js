const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

const sendTextMail = async ({ to, subject, text }) => {
    await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject,
        text
    });
};

const sendOTP = async (to, otp) => {
    await sendTextMail({
        to,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}`
    });
};

module.exports = sendOTP;
module.exports.sendTextMail = sendTextMail;
