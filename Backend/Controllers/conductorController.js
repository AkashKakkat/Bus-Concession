const Conductor = require("../Models/conductorModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


//  SIGNUP
const conductorSignUp = async (req, res) => {
    try {

        console.log("conductor API HIT");
        

        const { name, email, password, bus_no } = req.body;

        if (!name || !email || !password || !bus_no) {
            return res.status(400).send({
                message: "All fields required"
            });
        }

        const existing = await Conductor.findOne({ email });

        if (existing) {
            return res.status(409).send({
                message: "Conductor already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const conductor = await Conductor.create({
            name,
            email,
            password: hashedPassword,
            bus_no
        });

        res.status(201).send({
            message: "Conductor created",
            data: conductor
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};


//  LOGIN
const conductorLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const conductor = await Conductor.findOne({ email });

        if (!conductor) {
            return res.status(404).send({
                message: "Conductor not found"
            });
        }

        const isMatch = await bcrypt.compare(password, conductor.password);

        if (!isMatch) {
            return res.status(401).send({
                message: "Incorrect password"
            });
        }

        const token = jwt.sign(
            {
                id: conductor._id,
                role: "conductor" 
            },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.send({
            message: "Login successful",
            token
        });

    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

module.exports = { conductorSignUp, conductorLogin };