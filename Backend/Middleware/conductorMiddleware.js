const jwt = require("jsonwebtoken");

const conductorMiddleware = (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization;

        if (!bearerToken) {
            return res.status(401).send({
                message: "Token required"
            });
        }

        const [type, token] = bearerToken.split(" ");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "conductor") {
            return res.status(403).send({
                message: "Access denied (Conductor only)"
            });
        }

        req.conductor = decoded;

        next();

    } catch (err) {
        return res.status(401).send({
            message: "Invalid token"
        });
    }
};

module.exports = conductorMiddleware;