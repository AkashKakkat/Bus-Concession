const jwt = require("jsonwebtoken");

const isAdmin = (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization;

        if (!bearerToken) {
            return res.status(401).send({
                message: "Token required"
            });
        }

        const [type, token] = bearerToken.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).send({
                message: "Invalid token format"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).send({
                message: "Access denied (Admin only)"
            });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).send({
            message: "Invalid or expired token"
        });
    }
};

module.exports = isAdmin;
