const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

/* =========================
   📦 MONGODB CONNECTION
========================= */
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ CRITICAL ERROR: MONGO_URI is not defined in environment variables!");
} else {
  mongoose.connect(MONGO_URI)
    .then(() => {
      console.log("✅ Connected to MongoDB Atlas");
      seedQuestions();
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));
}

/* =========================
   🏗️ DATA MODELS
========================= */
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
}, { collection: "users" }));

const Student = mongoose.model("Student", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: "students" }));

const Faculty = mongoose.model("Faculty", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: "faculties" }));

const Question = mongoose.model("Question", new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  subject: String,
  difficulty: String
}, { collection: "questions" }));

const Result = mongoose.model("Result", new mongoose.Schema({
  username: String,
  subject: String,
  score: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now }
}, { collection: "results" }));

/* =========================
   🔐 AUTH ROUTES
========================= */
app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    if (role === "faculty") await new Faculty({ username }).save();
    else await new Student({ username }).save();
    res.status(201).json({ message: "User registered" });
  } catch (err) { res.status(400).json({ error: "Registration failed" }); }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Invalid login" });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "1d" });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

/* =========================
   📝 API ROUTES
========================= */
app.get("/students", async (req, res) => res.json(await Student.find()));
app.get("/questions", async (req, res) => res.json(await Question.find()));
app.get("/results", async (req, res) => res.json(await Result.find()));
app.post("/result", async (req, res) => {
  try {
    await new Result(req.body).save();
    res.status(201).json({ message: "Saved" });
  } catch (e) { res.status(500).json({ error: "Save failed" }); }
});

/* =========================
   🤖 AI GENERATION
========================= */
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.post("/generate-questions", async (req, res) => {
  const { subject } = req.body;
  if (!openai) return res.status(503).json({ error: "AI service not configured" });
  try {
    const prompt = `Generate 10 multiple-choice questions on ${subject}. Format as JSON array: [{"question": "...", "options": ["...", "..."], "answer": "..."}]`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });
    res.json(JSON.parse(response.choices[0].message.content));
  } catch (err) { res.status(500).json({ error: "AI failed" }); }
});

/* =========================
   🌐 SERVER & SEEDING
========================= */
const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));
app.get("*", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

const seedQuestions = async () => {
  try {
    const count = await Question.countDocuments();
    if (count > 0) return;
    const samples = [
      { question: "Language for iOS?", options: ["Swift", "Java", "C#", "Dart"], answer: "Swift", subject: "ios" },
      { question: "Language for Flutter?", options: ["Dart", "Kotlin", "Swift", "Go"], answer: "Dart", subject: "flutter" },
      { question: "AWS Provider?", options: ["Amazon", "Google", "Microsoft", "IBM"], answer: "Amazon", subject: "cloud computing" },
      { question: "What is NLP?", options: ["Natural Language Processing", "Neural Layer", "Network Link", "None"], answer: "Natural Language Processing", subject: "nlp" },
      { question: "What is ML?", options: ["Machine Learning", "Mobile Layer", "Master Link", "None"], answer: "Machine Learning", subject: "machine learning" }
    ];
    await Question.insertMany(samples);
    console.log("✅ Seeded initial questions");
  } catch (e) { console.error("❌ Seeding Error:", e); }
};

const PORT = process.env.PORT || 8080; // AWS EB prefers 8080
app.listen(PORT, () => {
  console.log(`🔥 SERVER BOOT SUCCESSFUL! Listening on port ${PORT}`);
  console.log("🛠️ Environment Check:");
  console.log(` - MONGO_URI: ${process.env.MONGO_URI ? "DETECTED" : "MISSING"}`);
  console.log(` - JWT_SECRET: ${process.env.JWT_SECRET ? "DETECTED" : "MISSING"}`);
  console.log(` - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "DETECTED" : "MISSING"}`);
});