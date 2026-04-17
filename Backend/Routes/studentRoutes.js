const express = require("express");
const studentRouter = express.Router();
const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");
const Route = require("../Models/routeModel")
const Student = require("../Models/studentModel");
const authMiddleware = require("../Middleware/authMiddleware");
const conductorMiddleware = require("../Middleware/conductorMiddleware");
const { normalizeFareDetails } = require("../Utils/fareCalculator");
const { isSameRoutePoint } = require("../Utils/routeMatcher");
//  Protected Route , get student
studentRouter.get("/profile", authMiddleware, async (req, res) => {
    try {
        const student = await Student.findById(req.student.id)
            .select("-password")
            .populate("route");

        if (!student) {
            return res.status(404).send({
                message: "Student not found..!!"
            });
        }

        res.status(200).send({
            message: "Profile fetched successfully",
            data: student
        });

    } catch (error) {
        res.status(500).send({
            message: "Error fetching profile"
        });
    }
});

// generate pass
studentRouter.get("/generate-pass", authMiddleware, async (req, res) => {
    try {

        const student = await Student.findById(req.student.id).populate("route");

        if (!student) {
            return res.status(404).send({
                message: "Student not found"
            });
        }

        if (!student.route) {
            return res.status(400).send({
                message: "Please select a route first"
            });
        }

        const fareDetails = normalizeFareDetails(student.route);

        //  Create token using DB data 
        const token = jwt.sign(
            {
                id: student._id,
                email: student.email,
                route: student.route,
                fare: fareDetails
            },
            process.env.JWT_SECRET,
            { expiresIn: "2m" }
        );


        const qr = await QRCode.toDataURL(token);

        res.status(200).send({
            message: "QR generated",
            qrCode: qr,
            token, // for testing
            baseFare: fareDetails.baseFare,
            concessionPercent: fareDetails.concessionPercent,
            finalFare: fareDetails.finalFare
        });

    } catch (error) {
        console.log("QR ERROR:", error.message);

        res.status(500).send({
            message: "Error generating QR"
        });
    }
});


// verify pass
studentRouter.post("/verify-pass",conductorMiddleware, async (req, res) => {
    try {
        const { token, currentFrom, currentTo } = req.body;

        if (!token || !currentFrom || !currentTo) {
            return res.status(400).send({
                message: "Token, From and To is required..!!"
            });
        }

        // decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // get student with route
        const student = await Student.findById(decoded.id).populate("route");

        if (!student || !student.route) {
            return res.status(404).send({
                message: "Invalid pass..!!"
            })
        }

        // extract route from DB
        const passFrom = student.route.from;
        const passTo = student.route.to;
        const fareDetails = normalizeFareDetails(student.route);

        // compare routes
        if (
            !isSameRoutePoint(passFrom, currentFrom) ||
            !isSameRoutePoint(passTo, currentTo)
        ){
            return res.status(403).send({
                message: "Route not allowed..!!",
                AllowedRoute : `${passFrom}  -->  ${passTo}`
            })
        }

        // valid
        return res.status(200).send({
            message:"Valid pass..",
            student: {
                Name: student.name,
                Email: student.email
            },
            route: student.route,
            baseFare: fareDetails.baseFare,
            concessionPercent: fareDetails.concessionPercent,
            finalFare: fareDetails.finalFare
            
        })
    } catch (err) {
        return res.status(401).send({
            message: "Invalid or expired token..!!"
        })
    }
})


// select route
studentRouter.post("/select-route", authMiddleware, async (req, res) => {
    try {
        const { routeId } = req.body;

        const route = await Route.findById(routeId);

        if (!route) {
            return res.status(404).send({
                message: "Route not found..!!"
            });
        }


        const student = await Student.findByIdAndUpdate(
            req.student.id,
            { route: routeId },
            { new: true }
        ).populate("route");

        res.send({
            message: "Route selected..",
            data: student
        })

    } catch (err) {
        return res.status(500).send({
            message: err.message
        })
    }
})

module.exports = studentRouter;
