const bcrypt = require("bcrypt");
const Admin = require("../Models/adminModel");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const ensureDefaultAdmin = async () => {
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const password = process.env.ADMIN_PASSWORD;
    const name = (process.env.ADMIN_NAME || "System Admin").trim();

    if (!email || !password) {
        return;
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: "admin"
    });
};

module.exports = ensureDefaultAdmin;
