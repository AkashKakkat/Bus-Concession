const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "student-ids");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniquePrefix}-${safeName}`);
    }
});

const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
]);

const studentIdUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error("College ID card must be a JPG, PNG, WEBP, or PDF file"));
        }

        cb(null, true);
    }
});

module.exports = studentIdUpload;
