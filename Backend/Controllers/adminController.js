const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Admin = require("../Models/adminModel");
const Student = require("../Models/studentModel");
const Conductor = require("../Models/conductorModel");
const Route = require("../Models/routeModel");
const Transaction = require("../Models/transactionModel");

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const buildRegex = (value = "") => new RegExp(value.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

const buildTokenPayload = (admin) => ({
    id: admin._id,
    email: admin.email,
    role: admin.role
});

const validateRoutePayload = ({ from, to, price, baseFare, concessionPercent }) => {
    if (!from || !to) {
        return "Both from and to are required";
    }

    const normalizedBaseFare = Number(baseFare ?? price);
    const normalizedConcessionPercent = Number(concessionPercent ?? 0);

    if (!Number.isFinite(normalizedBaseFare) || normalizedBaseFare <= 0) {
        return "baseFare must be greater than 0";
    }

    if (
        !Number.isFinite(normalizedConcessionPercent) ||
        normalizedConcessionPercent < 0 ||
        normalizedConcessionPercent > 100
    ) {
        return "concessionPercent must be between 0 and 100";
    }

    return null;
};

const buildDateRangeFilter = (dateFrom, dateTo, fieldName = "createdAt") => {
    const range = {};

    if (dateFrom) {
        range.$gte = new Date(dateFrom);
    }

    if (dateTo) {
        const inclusiveEndDate = new Date(dateTo);
        inclusiveEndDate.setHours(23, 59, 59, 999);
        range.$lte = inclusiveEndDate;
    }

    return Object.keys(range).length > 0 ? { [fieldName]: range } : {};
};

const validateDateRange = (dateFrom, dateTo) => {
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    if (fromDate && Number.isNaN(fromDate.getTime())) {
        return "dateFrom must be a valid date";
    }

    if (toDate && Number.isNaN(toDate.getTime())) {
        return "dateTo must be a valid date";
    }

    if (fromDate && toDate && fromDate > toDate) {
        return "dateFrom cannot be later than dateTo";
    }

    return null;
};

const getCollegeIdCardResponse = (student) => {
    if (!student.collegeIdCard?.filename) {
        return null;
    }

    return {
        filename: student.collegeIdCard.filename,
        originalName: student.collegeIdCard.originalName,
        mimetype: student.collegeIdCard.mimetype,
        size: student.collegeIdCard.size,
        uploadedAt: student.collegeIdCard.uploadedAt
    };
};

const uploadRoot = path.resolve(__dirname, "..", "uploads", "student-ids");

const isInsideUploadRoot = (filePath) => (
    filePath === uploadRoot || filePath.startsWith(`${uploadRoot}${path.sep}`)
);

const resolveCollegeIdCardPath = (collegeIdCard = {}) => {
    const candidates = [];

    if (collegeIdCard.path) {
        candidates.push(path.resolve(collegeIdCard.path));
        candidates.push(path.resolve(__dirname, "..", collegeIdCard.path));
    }

    if (collegeIdCard.filename) {
        candidates.push(path.join(uploadRoot, path.basename(collegeIdCard.filename)));
    }

    return candidates.find((candidate) => isInsideUploadRoot(candidate) && fs.existsSync(candidate));
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!normalizedEmail || !password) {
            return res.status(400).send({
                message: "Email and password are required"
            });
        }

        const admin = await Admin.findOne({ email: normalizedEmail });

        if (!admin) {
            return res.status(404).send({
                message: "Admin not found"
            });
        }

        if (admin.role !== "admin") {
            return res.status(403).send({
                message: "Access denied (Admin only)"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).send({
                message: "Incorrect password"
            });
        }

        const token = jwt.sign(buildTokenPayload(admin), process.env.JWT_SECRET, {
            expiresIn: "2h"
        });

        return res.status(200).send({
            message: "Admin login successful",
            token,
            role: admin.role
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error logging in admin"
        });
    }
};

const getStudents = async (_req, res) => {
    try {
        const { q = "", college = "", routeId = "", verificationStatus = "", dateFrom, dateTo } = _req.query;

        const dateError = validateDateRange(dateFrom, dateTo);

        if (dateError) {
            return res.status(400).send({
                message: dateError
            });
        }

        const query = {
            ...buildDateRangeFilter(dateFrom, dateTo)
        };

        if (q.trim()) {
            const regex = buildRegex(q);
            query.$or = [
                { name: regex },
                { email: regex },
                { college: regex },
                { student_id: Number.isNaN(Number(q)) ? -1 : Number(q) }
            ];
        }

        if (college.trim()) {
            query.college = buildRegex(college);
        }

        if (routeId.trim()) {
            query.route = routeId.trim();
        }

        if (verificationStatus.trim()) {
            if (!["pending", "approved", "rejected"].includes(verificationStatus.trim())) {
                return res.status(400).send({
                    message: "verificationStatus must be pending, approved, or rejected"
                });
            }

            query.verificationStatus = verificationStatus.trim();
        }

        const students = await Student.find(query)
            .select("-password")
            .populate("route")
            .sort({ createdAt: -1 });

        const response = students.map((student) => {
            const item = student.toObject();
            item.collegeIdCard = getCollegeIdCardResponse(student);
            return item;
        });

        return res.status(200).send(response);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching students"
        });
    }
};

const getStudentDetails = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select("-password")
            .populate("route");

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        const response = student.toObject();
        response.collegeIdCard = getCollegeIdCardResponse(student);

        return res.status(200).send(response);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching student details"
        });
    }
};

const approveStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        if (!student.collegeIdCard?.filename) {
            return res.status(400).send({
                message: "Student has no college ID card to verify"
            });
        }

        student.verificationStatus = "approved";
        student.verifiedAt = new Date();
        student.verifiedBy = req.admin.id;
        await student.save();

        return res.status(200).send({
            message: "Student approved successfully",
            data: {
                id: student._id,
                verificationStatus: student.verificationStatus,
                verifiedAt: student.verifiedAt
            }
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error approving student"
        });
    }
};

const rejectStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        student.verificationStatus = "rejected";
        student.verifiedAt = new Date();
        student.verifiedBy = req.admin.id;
        await student.save();

        return res.status(200).send({
            message: "Student rejected",
            data: {
                id: student._id,
                verificationStatus: student.verificationStatus,
                verifiedAt: student.verifiedAt
            }
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error rejecting student"
        });
    }
};

const viewStudentIdCard = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select("collegeIdCard");

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        if (!student.collegeIdCard?.filename && !student.collegeIdCard?.path) {
            return res.status(404).send({
                message: "College ID card not found"
            });
        }

        const resolvedPath = resolveCollegeIdCardPath(student.collegeIdCard);

        if (!resolvedPath) {
            return res.status(404).send({
                message: "College ID card file not found"
            });
        }

        res.setHeader("Content-Type", student.collegeIdCard.mimetype || "application/octet-stream");
        res.setHeader(
            "Content-Disposition",
            `inline; filename="${student.collegeIdCard.originalName || student.collegeIdCard.filename}"`
        );

        return res.sendFile(resolvedPath);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error loading college ID card"
        });
    }
};

const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        await Transaction.deleteMany({ studentId: student._id });

        return res.status(200).send({
            message: "Student deleted successfully"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error deleting student"
        });
    }
};

const getConductors = async (_req, res) => {
    try {
        const { q = "", busNo = "", dateFrom, dateTo } = _req.query;

        const dateError = validateDateRange(dateFrom, dateTo);

        if (dateError) {
            return res.status(400).send({
                message: dateError
            });
        }

        const query = {
            ...buildDateRangeFilter(dateFrom, dateTo)
        };

        if (q.trim()) {
            const regex = buildRegex(q);
            query.$or = [
                { name: regex },
                { email: regex },
                { bus_no: regex }
            ];
        }

        if (busNo.trim()) {
            query.bus_no = buildRegex(busNo);
        }

        const conductors = await Conductor.find(query)
            .select("-password")
            .sort({ createdAt: -1 });

        return res.status(200).send(conductors);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching conductors"
        });
    }
};

const getConductorDetails = async (req, res) => {
    try {
        const conductor = await Conductor.findById(req.params.id).select("-password");

        if (!conductor) {
            return res.status(404).send({
                message: "Conductor not found"
            });
        }

        return res.status(200).send(conductor);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching conductor details"
        });
    }
};

const deleteConductor = async (req, res) => {
    try {
        const conductor = await Conductor.findByIdAndDelete(req.params.id);

        if (!conductor) {
            return res.status(404).send({
                message: "Conductor not found"
            });
        }

        return res.status(200).send({
            message: "Conductor deleted successfully"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error deleting conductor"
        });
    }
};

const createConductor = async (req, res) => {
    try {
        const { name, email, password, bus_no } = req.body;
        const normalizedEmail = normalizeEmail(email);

        if (!name || !normalizedEmail || !password || !bus_no) {
            return res.status(400).send({
                message: "All fields required"
            });
        }

        const existing = await Conductor.findOne({ email: normalizedEmail });

        if (existing) {
            return res.status(409).send({
                message: "Conductor already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const conductor = await Conductor.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            bus_no,
            role: "conductor"
        });

        return res.status(201).send({
            message: "Conductor created",
            data: conductor
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error creating conductor"
        });
    }
};

const getRoutes = async (_req, res) => {
    try {
        const { q = "", from = "", to = "" } = _req.query;

        const query = {};

        if (q.trim()) {
            const regex = buildRegex(q);
            query.$or = [{ from: regex }, { to: regex }];
        }

        if (from.trim()) {
            query.from = buildRegex(from);
        }

        if (to.trim()) {
            query.to = buildRegex(to);
        }

        const routes = await Route.find(query).sort({ createdAt: -1 });

        return res.status(200).send(routes);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching routes"
        });
    }
};

const createRoute = async (req, res) => {
    try {
        const validationError = validateRoutePayload(req.body);

        if (validationError) {
            return res.status(400).send({
                message: validationError
            });
        }

        const route = await Route.create({
            from: req.body.from.trim(),
            to: req.body.to.trim(),
            price: Number(req.body.price ?? req.body.baseFare),
            baseFare: Number(req.body.baseFare ?? req.body.price),
            concessionPercent: Number(req.body.concessionPercent ?? 0)
        });

        return res.status(201).send({
            message: "Route created successfully",
            data: route
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error creating route"
        });
    }
};

const updateRoute = async (req, res) => {
    try {
        const validationError = validateRoutePayload(req.body);

        if (validationError) {
            return res.status(400).send({
                message: validationError
            });
        }

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            {
                from: req.body.from.trim(),
                to: req.body.to.trim(),
                price: Number(req.body.price ?? req.body.baseFare),
                baseFare: Number(req.body.baseFare ?? req.body.price),
                concessionPercent: Number(req.body.concessionPercent ?? 0)
            },
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).send({
                message: "Route not found"
            });
        }

        return res.status(200).send({
            message: "Route updated successfully",
            data: route
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error updating route"
        });
    }
};

const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);

        if (!route) {
            return res.status(404).send({
                message: "Route not found"
            });
        }

        return res.status(200).send({
            message: "Route deleted successfully"
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error deleting route"
        });
    }
};

const getTransactions = async (_req, res) => {
    try {
        const { q = "", type = "", dateFrom, dateTo } = _req.query;

        const dateError = validateDateRange(dateFrom, dateTo);

        if (dateError) {
            return res.status(400).send({
                message: dateError
            });
        }

        const matchStage = {
            ...buildDateRangeFilter(dateFrom, dateTo, "date")
        };

        if (type.trim()) {
            if (!["credit", "debit"].includes(type.trim())) {
                return res.status(400).send({
                    message: "type must be credit or debit"
                });
            }

            matchStage.type = type.trim();
        }

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: {
                    path: "$student",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        if (q.trim()) {
            const regex = buildRegex(q);

            pipeline.push({
                $match: {
                    $or: [
                        { description: regex },
                        { "student.name": regex },
                        { "student.email": regex }
                    ]
                }
            });
        }

        pipeline.push(
            {
                $project: {
                    studentId: "$student._id",
                    type: 1,
                    amount: 1,
                    description: 1,
                    date: 1,
                    createdAt: 1,
                    student: {
                        _id: "$student._id",
                        name: "$student.name",
                        email: "$student.email",
                        student_id: "$student.student_id",
                        college: "$student.college"
                    }
                }
            },
            { $sort: { createdAt: -1 } }
        );

        const transactions = await Transaction.aggregate(pipeline);

        return res.status(200).send(transactions);
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching transactions"
        });
    }
};

const getReports = async (_req, res) => {
    try {
        const [studentCount, conductorCount, routeCount] = await Promise.all([
            Student.countDocuments(),
            Conductor.countDocuments(),
            Route.countDocuments()
        ]);

        const transactionSummary = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalCredits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0]
                        }
                    },
                    totalDebits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0]
                        }
                    },
                    transactionCount: { $sum: 1 }
                }
            }
        ]);

        const monthlyTransactions = await Transaction.aggregate([
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$date"
                        }
                    },
                    credits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0]
                        }
                    },
                    debits: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0]
                        }
                    },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 6 }
        ]);

        const routeSelectionReport = await Student.aggregate([
            {
                $match: {
                    route: { $ne: null }
                }
            },
            {
                $lookup: {
                    from: "routes",
                    localField: "route",
                    foreignField: "_id",
                    as: "routeDoc"
                }
            },
            { $unwind: "$routeDoc" },
            {
                $group: {
                    _id: "$routeDoc._id",
                    routeLabel: {
                        $first: {
                            $concat: ["$routeDoc.from", " -> ", "$routeDoc.to"]
                        }
                    },
                    studentsAssigned: { $sum: 1 },
                    baseFare: { $first: "$routeDoc.baseFare" },
                    concessionPercent: { $first: "$routeDoc.concessionPercent" }
                }
            },
            { $sort: { studentsAssigned: -1, routeLabel: 1 } },
            { $limit: 5 }
        ]);

        return res.status(200).send({
            overview: {
                studentCount,
                conductorCount,
                routeCount,
                totalCredits: transactionSummary[0]?.totalCredits || 0,
                totalDebits: transactionSummary[0]?.totalDebits || 0,
                transactionCount: transactionSummary[0]?.transactionCount || 0
            },
            monthlyTransactions,
            routeSelectionReport
        });
    } catch (error) {
        return res.status(500).send({
            message: error.message || "Error fetching reports"
        });
    }
};

module.exports = {
    adminLogin,
    getStudents,
    getStudentDetails,
    approveStudent,
    rejectStudent,
    viewStudentIdCard,
    deleteStudent,
    getConductors,
    getConductorDetails,
    createConductor,
    deleteConductor,
    getRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    getTransactions,
    getReports
};
