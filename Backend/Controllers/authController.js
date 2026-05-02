const studentModel = require("../Models/studentModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOTP = require("..//Utils/sendMail");
const { sendTextMail } = require("..//Utils/sendMail");
const fs = require("fs");

let otpStore = {};
let verifiedEmails = new Set();
let passwordResetStore = {};

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const passwordRegex = /^.{6,}$/;

const validatePassword = (password) => passwordRegex.test(password);

const removeUploadedFile = (file) => {
    if (file?.path) {
        fs.promises.unlink(file.path).catch(() => {});
    }
};


const studentSignUp = async (req, res) => {
    try {
        const { student_id, name, email, password, college } = req.body;
        const normalizedEmail = normalizeEmail(email);

        
        if (!student_id || !name || !normalizedEmail || !password || !college) {
            removeUploadedFile(req.file);
            return res.status(400).send({
                message: "All fields are required..!!"
            });
        }

        if (!req.file) {
            return res.status(400).send({
                message: "College ID card is required for student verification"
            });
        }

        if (!verifiedEmails.has(normalizedEmail)) {
            removeUploadedFile(req.file);
            return res.status(403).send({
                message: "Please verify OTP first"
            });
        }

        // email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            removeUploadedFile(req.file);
            return res.status(400).send({
                message: "Invalid email format..!!"
            });
        }

        // password validation
        if (!validatePassword(password)) {
            removeUploadedFile(req.file);
            return res.status(400).send({
                message: "Password must be atleast 6 characters..!!"
            })
        }

        if (!/^\d{6,10}$/.test(String(student_id))) {
            removeUploadedFile(req.file);
            return res.status(400).send({
                message: "Student ID must be 6 to 10 digits"
            });
        }

        // checking the already existing student_id and email
        const student = await studentModel.findOne({ $or: [{ student_id: student_id }, { email: normalizedEmail }] })

        if (student) {
            removeUploadedFile(req.file);
            if (String(student.student_id) === String(student_id)) {
                return res.status(409).send({
                    message: "Student ID is already exist..!!"
                })
            }
            if (student.email === normalizedEmail) {
                return res.status(409).send({
                    message: "Email is already exist..!!"
                })
            }
        }

        // bcrypting password
        const usrObj = {
            student_id,
            name,
            email: normalizedEmail,
            password,
            college,
            role: "student",
            verificationStatus: "pending",
            collegeIdCard: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                uploadedAt: new Date()
            }
        }

        usrObj.password = await bcrypt.hash(password, 10);
        const createStudent = await studentModel.create(usrObj);
        if (!createStudent) {
            removeUploadedFile(req.file);
            return res.status(500).send({
                message: "Error creating student..!!"
            })
        }

        verifiedEmails.delete(normalizedEmail);

        return res.status(201).send({
            message: "Registration submitted successfully. Please wait for admin approval before logging in.",
            data: {
                id: createStudent._id,
                email: createStudent.email,
                verificationStatus: createStudent.verificationStatus
            }
        })
    } catch (err) {
        removeUploadedFile(req.file);
        return res.status(500).send({
            message: err.message || "Internal Server Error..!!"
        })
    }

}




const studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).send({
                message: "All fields are required..!!"
            });
        }

        const student = await studentModel.findOne({ email: normalizedEmail });
        if (!student) {
            return res.status(404).send({
                message: "User not found..!!"
            });
        }

        if (student.role !== "student") {
            return res.status(403).send({
                message: "Access denied (Student only)"
            });
        }

        if (student.verificationStatus && student.verificationStatus !== "approved") {
            return res.status(403).send({
                message:
                    student.verificationStatus === "rejected"
                        ? "Your student registration was not approved. Please contact the admin."
                        : "Your registration is pending admin approval."
            });
        }

        const isMatched = await bcrypt.compare(password, student.password);
        if (!isMatched) {
            return res.status(401).send({
                message: "Incorrect password..!!"
            });
        }

        //  CREATE TOKEN
        const token = jwt.sign(
            {
                id: student._id,
                email: student.email,
                role: student.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).send({
            message: "Login successful",
            token: token,
            role: student.role
        });

    } catch (err) {
        return res.status(500).send({
            message: err.message || "Internal server error..!!"
        });
    }
};

const forgotPasswordController = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);

        if (!normalizedEmail) {
            return res.status(400).send({
                message: "Email is required"
            });
        }

        const student = await studentModel.findOne({ email: normalizedEmail });

        if (!student) {
            return res.status(404).send({
                message: "Student account not found"
            });
        }

        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();

        passwordResetStore[normalizedEmail] = {
            otp: resetOtp,
            expiresAt: Date.now() + 10 * 60 * 1000
        };

        await sendTextMail({
            to: normalizedEmail,
            subject: "Bus Concession Password Reset",
            text: `Use this OTP to reset your password: ${resetOtp}. It expires in 10 minutes.`
        });

        return res.status(200).send({
            message: "Password reset OTP sent successfully"
        });
    } catch (err) {
        return res.status(500).send({
            message: err.message || "Failed to send password reset OTP"
        });
    }
};

const resetPasswordController = async (req, res) => {
    try {
        const normalizedEmail = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();
        const newPassword = req.body.newPassword || "";

        if (!normalizedEmail || !otp || !newPassword) {
            return res.status(400).send({
                message: "Email, OTP, and new password are required"
            });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).send({
                message: "Password must be atleast 6 characters..!!"
            });
        }

        const record = passwordResetStore[normalizedEmail];

        if (!record) {
            return res.status(400).send({
                message: "No password reset request found"
            });
        }

        if (Date.now() > record.expiresAt) {
            delete passwordResetStore[normalizedEmail];

            return res.status(400).send({
                message: "Reset OTP expired"
            });
        }

        if (record.otp !== otp) {
            return res.status(400).send({
                message: "Invalid reset OTP"
            });
        }

        const student = await studentModel.findOne({ email: normalizedEmail });

        if (!student) {
            return res.status(404).send({
                message: "Student account not found"
            });
        }

        student.password = await bcrypt.hash(newPassword, 10);
        await student.save();

        delete passwordResetStore[normalizedEmail];

        return res.status(200).send({
            message: "Password reset successfully"
        });
    } catch (err) {
        return res.status(500).send({
            message: err.message || "Failed to reset password"
        });
    }
};

const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).send({
                message: "Current password and new password are required"
            });
        }

        if (!validatePassword(newPassword)) {
            return res.status(400).send({
                message: "Password must be atleast 6 characters..!!"
            });
        }

        const student = await studentModel.findById(req.student.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        const isMatched = await bcrypt.compare(currentPassword, student.password);

        if (!isMatched) {
            return res.status(401).send({
                message: "Current password is incorrect"
            });
        }

        student.password = await bcrypt.hash(newPassword, 10);
        await student.save();

        return res.status(200).send({
            message: "Password changed successfully"
        });
    } catch (err) {
        return res.status(500).send({
            message: err.message || "Failed to change password"
        });
    }
};


const sendOtpController = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail) {
            return res.status(400).send({ message: "Email required" });
        }

        const existing = otpStore[normalizedEmail];

        //  Cooldown: 30 sec
        if (existing && Date.now() - existing.lastSent < 30000) {
            return res.status(429).send({
                message: "Please wait 30 seconds before requesting again"
            });
        }

        //  Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        //  Store OTP with expiry
        otpStore[normalizedEmail] = {
            otp,
            expiresAt: Date.now() + 2 * 60 * 1000,
            lastSent: Date.now()
        };

        verifiedEmails.delete(normalizedEmail);

        await sendOTP(normalizedEmail, otp);

        res.send({
            message: "OTP sent successfully"
        });

    } catch (err) {
        res.status(500).send({
            message: err.message
        });
    }
};


const verifyOtpController = (req, res) => {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
        return res.status(400).send({
            message: "Email and OTP are required"
        });
    }

    const record = otpStore[normalizedEmail];

    if (!record) {
        return res.status(400).send({
            message: "No OTP found. Please request again"
        });
    }

    //  Check expiry
    if (Date.now() > record.expiresAt) {
        delete otpStore[normalizedEmail];
        return res.status(400).send({
            message: "OTP expired"
        });
    }

    //  Check OTP
    if (record.otp == otp) {
        delete otpStore[normalizedEmail];
        verifiedEmails.add(normalizedEmail);

        return res.send({
            message: "OTP verified"
        });
    }

    return res.status(400).send({
        message: "Invalid OTP"
    });
};


module.exports = {
    studentSignUp,
    studentLogin,
    sendOtpController,
    verifyOtpController,
    forgotPasswordController,
    resetPasswordController,
    changePasswordController
};
