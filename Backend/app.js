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

app.use(cors({
    origin: "http://localhost:5173"
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

app.listen(5000, () => {
    console.log("Server is running on port 5000");

});
