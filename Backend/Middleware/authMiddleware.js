const jwt = require("jsonwebtoken");
const Student = require("../Models/studentModel");

const authMiddleware = async (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization;

        if (!bearerToken) {
            return res.status(401).send({
                message: "Token not provided"
            });
        }

        const [type, token] = bearerToken.split(" ");

        if (type !== "Bearer") {
            return res.status(401).send({
                message: "Invalid token format"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "student") {
            return res.status(403).send({
                message: "Access denied (Student only)"
            });
        }

        const student = await Student.findById(decoded.id).select("verificationStatus");

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        if (student.verificationStatus && student.verificationStatus !== "approved") {
            return res.status(403).send({
                message: "Student account is not approved by admin"
            });
        }

        req.student = decoded;

        next();


    } catch (error) {
        return res.status(401).send({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;
