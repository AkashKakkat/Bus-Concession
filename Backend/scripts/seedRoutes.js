require("dotenv").config();
const mongoose = require("mongoose");
const Route = require("../Models/routeModel");

const FIXED_ROUTES = [
  { from: "Kozhikode", to: "Thrissur", price: 120, baseFare: 120, concessionPercent: 50 },
  { from: "Kozhikode", to: "Kochi", price: 180, baseFare: 180, concessionPercent: 50 },
  { from: "Thrissur", to: "Kochi", price: 90, baseFare: 90, concessionPercent: 50 },
  { from: "Kochi", to: "Alappuzha", price: 70, baseFare: 70, concessionPercent: 50 },
  { from: "Kochi", to: "Kottayam", price: 85, baseFare: 85, concessionPercent: 50 },
  { from: "Kottayam", to: "Thiruvananthapuram", price: 170, baseFare: 170, concessionPercent: 50 },
  { from: "Kochi", to: "Thiruvananthapuram", price: 260, baseFare: 260, concessionPercent: 50 },
];

async function seedRoutes() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB_NAME;

  if (!mongoUrl || !dbName) {
    throw new Error("Missing MONGO_URL or MONGO_DB_NAME in environment.");
  }

  await mongoose.connect(mongoUrl, { dbName });

  try {
    await Route.deleteMany({});
    await Route.insertMany(FIXED_ROUTES);
    console.log(`Seeded ${FIXED_ROUTES.length} fixed routes into ${dbName}.`);
  } finally {
    await mongoose.disconnect();
  }
}

seedRoutes().catch((error) => {
  console.error("Failed to seed routes:", error.message);
  process.exit(1);
});
