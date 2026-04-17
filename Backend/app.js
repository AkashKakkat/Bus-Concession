const cors = require("cors")
const express = require("express");
require("dotenv").config();
const connect_db = require("./Config/db");
const Student = require("./Models/studentModel");
const authRoutes = require("./Routes/authRoutes");
const studentRoutes = require("./Routes/studentRoutes");
const conductorRoutes = require("./Routes/conductorRoutes");
const routeRoutes = require("./Routes/routeRoutes");
const walletRoutes = require("./Routes/walletRoutes");
const paymentRoutes = require("./Routes/paymentRoutes");

connect_db()

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    }
}));

app.use(express.json());


app.use("/auth", authRoutes);

app.use("/student", studentRoutes);

app.use("/conductor", conductorRoutes);

app.use("/route", routeRoutes);

app.use("/wallet", walletRoutes);

app.use("/payment", paymentRoutes);







app.post("/addStudent", async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();

        res.send("Student Added Succesfully");
    } catch (error) {
        res.send(error)
    }
})




app.get("/", (req, res) => {
    res.send("Bus Concession API is Running...");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);

});
