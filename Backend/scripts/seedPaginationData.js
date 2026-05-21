require("dotenv").config();

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const Student = require("../Models/studentModel");
const Conductor = require("../Models/conductorModel");
const Route = require("../Models/routeModel");
const Transaction = require("../Models/transactionModel");

const DUMMY_EMAIL_DOMAIN = "pagination-test.local";
const DUMMY_DESCRIPTION_PREFIX = "[PAGINATION_TEST]";
const DUMMY_STUDENT_ID_START = 900000;
const DEFAULT_PASSWORD = "Test@12345";

const firstNames = [
  "Aarav",
  "Ishaan",
  "Rohan",
  "Vihaan",
  "Aditya",
  "Arjun",
  "Nikhil",
  "Dev",
  "Ananya",
  "Diya",
  "Meera",
  "Kavya",
  "Nandita",
  "Sara",
  "Priya",
  "Aisha",
];

const lastNames = [
  "Nair",
  "Menon",
  "Pillai",
  "Varma",
  "Krishnan",
  "Thomas",
  "Joseph",
  "Mathew",
  "Das",
  "Ravi",
  "George",
  "Kumar",
];

const colleges = [
  "Government Engineering College",
  "Model Polytechnic College",
  "National Arts and Science College",
  "City Commerce College",
  "Central Institute of Technology",
  "St. Marys College",
  "Regional Science College",
  "Metro Business School",
];

const locations = [
  "Kozhikode",
  "Thrissur",
  "Kochi",
  "Alappuzha",
  "Kottayam",
  "Thiruvananthapuram",
  "Kannur",
  "Palakkad",
  "Malappuram",
  "Kollam",
  "Idukki",
  "Wayanad",
  "Pathanamthitta",
  "Kasargod",
  "Ernakulam",
];

const modules = new Set(["students", "conductors", "routes", "transactions", "all"]);

const getArgValue = (name, fallback) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
};

const hasFlag = (name) => process.argv.includes(`--${name}`);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseModule = () => {
  const selectedModule = getArgValue("module", "all").toLowerCase();

  if (!modules.has(selectedModule)) {
    throw new Error(`Invalid module "${selectedModule}". Use one of: ${Array.from(modules).join(", ")}.`);
  }

  return selectedModule;
};

const fullName = (index) => `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;

const studentEmail = (index) => `student${String(index + 1).padStart(3, "0")}@${DUMMY_EMAIL_DOMAIN}`;

const conductorEmail = (index) => `conductor${String(index + 1).padStart(3, "0")}@${DUMMY_EMAIL_DOMAIN}`;

const buildRoutes = () =>
  Array.from({ length: 30 }, (_, index) => {
    const from = locations[index % locations.length];
    const to = locations[(index + 4) % locations.length];
    const baseFare = 45 + (index % 12) * 15;

    return {
      from: `Pagination Test ${from}`,
      to: `Pagination Test ${to}`,
      price: baseFare,
      baseFare,
      concessionPercent: [25, 35, 40, 50][index % 4],
    };
  });

const shouldRun = (selectedModule, moduleName) => selectedModule === "all" || selectedModule === moduleName;

async function connectDatabase() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.MONGO_DB_NAME;

  if (!mongoUrl || !dbName) {
    throw new Error("Missing MONGO_URL or MONGO_DB_NAME in environment.");
  }

  await mongoose.connect(mongoUrl, { dbName });
  console.log(`Connected to MongoDB database "${dbName}".`);
}

async function clearDummyData(selectedModule) {
  console.log("Clearing only pagination dummy data...");
  const dummyEmailRegex = new RegExp(`@${escapeRegExp(DUMMY_EMAIL_DOMAIN)}$`);
  const dummyDescriptionRegex = new RegExp(`^${escapeRegExp(DUMMY_DESCRIPTION_PREFIX)}`);

  if (shouldRun(selectedModule, "transactions")) {
    const result = await Transaction.deleteMany({
      description: { $regex: dummyDescriptionRegex },
    });
    console.log(`Removed ${result.deletedCount} dummy transactions.`);
  }

  if (shouldRun(selectedModule, "students")) {
    const result = await Student.deleteMany({
      email: { $regex: dummyEmailRegex },
    });
    console.log(`Removed ${result.deletedCount} dummy students.`);
  }

  if (shouldRun(selectedModule, "conductors")) {
    const result = await Conductor.deleteMany({
      email: { $regex: dummyEmailRegex },
    });
    console.log(`Removed ${result.deletedCount} dummy conductors.`);
  }

  if (shouldRun(selectedModule, "routes")) {
    const result = await Route.deleteMany({
      from: { $regex: "^Pagination Test " },
      to: { $regex: "^Pagination Test " },
    });
    console.log(`Removed ${result.deletedCount} dummy routes.`);
  }
}

async function seedRoutes() {
  const routes = buildRoutes();
  let created = 0;
  let updated = 0;

  for (const route of routes) {
    const result = await Route.updateOne(
      { from: route.from, to: route.to },
      { $set: route },
      { upsert: true }
    );

    created += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;
  }

  console.log(`Routes ready: ${routes.length} dummy routes (${created} inserted, ${updated} updated).`);
}

async function seedConductors(passwordHash) {
  let created = 0;
  let updated = 0;

  for (let index = 0; index < 40; index += 1) {
    const conductor = {
      name: fullName(index + 25),
      email: conductorEmail(index),
      password: passwordHash,
      bus_no: `PT-BUS-${String(index + 1).padStart(3, "0")}`,
      role: "conductor",
    };

    const result = await Conductor.updateOne(
      { email: conductor.email },
      { $set: conductor },
      { upsert: true }
    );

    created += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;
  }

  console.log(`Conductors ready: 40 dummy conductors (${created} inserted, ${updated} updated).`);
}

async function seedStudents(passwordHash) {
  const routes = await Route.find({ from: { $regex: "^Pagination Test " } }).select("_id").lean();

  if (routes.length === 0) {
    throw new Error("No dummy routes found. Run routes seed before students.");
  }

  const statuses = ["pending", "approved", "rejected"];
  let created = 0;
  let updated = 0;

  for (let index = 0; index < 80; index += 1) {
    const verificationStatus = statuses[index % statuses.length];
    const student = {
      student_id: DUMMY_STUDENT_ID_START + index,
      name: fullName(index),
      email: studentEmail(index),
      password: passwordHash,
      college: colleges[index % colleges.length],
      route: routes[index % routes.length]._id,
      walletBalance: 100 + (index % 20) * 25,
      role: "student",
      verificationStatus,
      verifiedAt: verificationStatus === "pending" ? undefined : new Date(Date.now() - index * 86400000),
    };

    const result = await Student.updateOne(
      { email: student.email },
      { $set: student },
      { upsert: true }
    );

    created += result.upsertedCount || 0;
    updated += result.modifiedCount || 0;
  }

  console.log(`Students ready: 80 dummy students (${created} inserted, ${updated} updated).`);
}

async function seedTransactions() {
  const dummyEmailRegex = new RegExp(`@${escapeRegExp(DUMMY_EMAIL_DOMAIN)}$`);
  const dummyDescriptionRegex = new RegExp(`^${escapeRegExp(DUMMY_DESCRIPTION_PREFIX)}`);
  const [students, conductors] = await Promise.all([
    Student.find({ email: { $regex: dummyEmailRegex } }).populate("route").lean(),
    Conductor.find({ email: { $regex: dummyEmailRegex } }).select("_id").lean(),
  ]);

  if (students.length === 0) {
    throw new Error("No dummy students found. Run students seed before transactions.");
  }

  await Transaction.deleteMany({
    description: { $regex: dummyDescriptionRegex },
  });

  const transactions = Array.from({ length: 160 }, (_, index) => {
    const student = students[index % students.length];
    const type = index % 4 === 0 ? "credit" : "debit";
    const amount = type === "credit" ? 200 + (index % 8) * 50 : 15 + (index % 12) * 10;
    const date = new Date(Date.now() - index * 43200000);

    return {
      studentId: student._id,
      conductorId: conductors.length ? conductors[index % conductors.length]._id : undefined,
      type,
      amount,
      description:
        type === "credit"
          ? `${DUMMY_DESCRIPTION_PREFIX} Wallet top-up for ${student.name}`
          : `${DUMMY_DESCRIPTION_PREFIX} Fare payment by ${student.name}`,
      routeSnapshot: student.route
        ? {
            from: student.route.from,
            to: student.route.to,
          }
        : undefined,
      date,
      createdAt: date,
      updatedAt: date,
    };
  });

  await Transaction.insertMany(transactions);
  console.log(`Transactions ready: ${transactions.length} dummy transactions inserted.`);
}

async function seedPaginationData() {
  const selectedModule = parseModule();
  const clearOnly = hasFlag("clear");

  await connectDatabase();

  try {
    if (clearOnly) {
      await clearDummyData(selectedModule);
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    if (shouldRun(selectedModule, "routes")) {
      await seedRoutes();
    }

    if (shouldRun(selectedModule, "conductors")) {
      await seedConductors(passwordHash);
    }

    if (shouldRun(selectedModule, "students")) {
      if (selectedModule === "students") {
        await seedRoutes();
      }

      await seedStudents(passwordHash);
    }

    if (shouldRun(selectedModule, "transactions")) {
      if (selectedModule === "transactions") {
        await seedRoutes();
        await seedConductors(passwordHash);
        await seedStudents(passwordHash);
      }

      await seedTransactions();
    }

    console.log("Pagination dummy data seed completed safely.");
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seedPaginationData().catch(async (error) => {
  console.error("Failed to seed pagination dummy data:", error.message);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  process.exit(1);
});
