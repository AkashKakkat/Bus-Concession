const studentModel = require("../Models/studentModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOTP = require("..//Utils/sendMail");

let otpStore = {};
let verifiedEmails = new Set();

const normalizeEmail = (email = "") => email.trim().toLowerCase();


const studentSignUp = async (req, res) => {
    try {
        const { student_id, name, email, password, college } = req.body;
        const normalizedEmail = normalizeEmail(email);

        
        if (!student_id || !name || !normalizedEmail || !password || !college) {
            return res.status(400).send({
                message: "All fields are required..!!"
            });
        }

        if (!verifiedEmails.has(normalizedEmail)) {
            return res.status(403).send({
                message: "Please verify OTP first"
            });
        }

        // email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).send({
                message: "Invalid email format..!!"
            });
        }

        // password validation
        const passwordRegex = /^.{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).send({
                message: "Password must be atleast 6 characters..!!"
            })
        }

        // checking the already existing student_id and email
        const student = await studentModel.findOne({ $or: [{ student_id: student_id }, { email: normalizedEmail }] })

        if (student) {
            if (student.student_id === student_id) {
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
        }

        usrObj.password = await bcrypt.hash(password, 10);
        const createStudent = await studentModel.create(usrObj);
        if (!createStudent) {
            return res.status(500).send({
                message: "Error creating student..!!"
            })
        }

        verifiedEmails.delete(normalizedEmail);

        return res.status(201).send({
            message: "Student create successfully...",
            data: createStudent
        })
    } catch (err) {
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
                email: student.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).send({
            message: "Login successful",
            token: token
        });

    } catch (err) {
        return res.status(500).send({
            message: err.message || "Internal server error..!!"
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



module.exports = { studentSignUp, studentLogin, sendOtpController, verifyOtpController };
