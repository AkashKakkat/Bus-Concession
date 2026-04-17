const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
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
        console.log("HEADER:", req.headers.authorization);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("DECODED:", decoded);
        req.student = decoded;

        next();


    } catch (error) {
        console.log("JWT ERROR:", error.message);
        console.log("HEADER:", req.headers.authorization);


        return res.status(401).send({
            message: "Invalid or expired token"
        });
    }
};

module.exports = authMiddleware;