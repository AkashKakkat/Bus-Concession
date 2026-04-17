const express = require("express");
const router = express.Router();
const Route = require("../Models/routeModel");


// create route (for admin use)
router.post("/create",async (req,res) =>{
    try {
        const { from, to, price, baseFare, concessionPercent } = req.body;
        const normalizedBaseFare = Number(baseFare ?? price);
        const normalizedConcessionPercent = Number(concessionPercent ?? 0);

        if (!Number.isFinite(normalizedBaseFare) || normalizedBaseFare <= 0) {
            return res.status(400).send({
                message: "baseFare must be greater than 0"
            });
        }

        if (
            !Number.isFinite(normalizedConcessionPercent) ||
            normalizedConcessionPercent < 0 ||
            normalizedConcessionPercent > 100
        ) {
            return res.status(400).send({
                message: "concessionPercent must be between 0 and 100"
            });
        }

        const route = await Route.create({
            from,
            to,
            price: Number(price ?? normalizedBaseFare),
            baseFare: normalizedBaseFare,
            concessionPercent: normalizedConcessionPercent
        });
        return res.send({
            message: "Route created..",
            data: route
        })
    } catch (err) {
        return res.status(500).send({
            message: err.message
        })
    }
})

// get all student ( for frontend dropdown)
    router.get("/all", async (req,res)=>{
    const routes = await Route.find();    

    res.send(routes);

    });

    module.exports = router;
