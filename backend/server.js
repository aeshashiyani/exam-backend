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
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    seedUsers(); 
    seedQuestions();
  })
  .catch(err => console.log("❌ DB Connection Error:", err));

/* =========================
   🏗️ DATA MODELS
========================= */
// Master User for Authentication
const User = mongoose.model("User", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
}, { collection: "users" }));

// Specific Collection for Students
const Student = mongoose.model("Student", new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: "students" }));

// Specific Collection for Faculty
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
    if (!username || !password || !role) return res.status(400).json({ error: "All fields required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save to Master Auth Collection
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();

    // Save to Role-Specific Collection for Atlas Organization
    if (role === "faculty") {
      const newFaculty = new Faculty({ username });
      await newFaculty.save();
    } else {
      const newStudent = new Student({ username });
      await newStudent.save();
    }

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Username already exists" });
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
   📝 EXAM & STUDENT ROUTES
========================= */
app.get("/students", async (req, res) => {
  const data = await Student.find();
  res.json(data);
});

app.get("/questions", async (req, res) => {
  const data = await Question.find();
  res.json(data);
});

app.get("/results", async (req, res) => {
  const data = await Result.find();
  res.json(data);
});

app.post("/result", async (req, res) => {
  try {
    const newResult = new Result(req.body);
    await newResult.save();
    res.status(201).json({ message: "Result saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save result" });
  }
});

/* =========================
   🤖 AI QUESTION GENERATOR
========================= */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate-questions", async (req, res) => {
  const { subject } = req.body;
  try {
    const prompt = `Generate 10 multiple-choice questions on ${subject}. Format as JSON: [{"question": "...", "options": ["...", "..."], "answer": "..."}]`;
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    const questions = JSON.parse(response.choices[0].message.content);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "AI failed to generate questions" });
  }
});

/* =========================
   🌐 STATIC FILES & SERVER
========================= */
const frontendPath = path.join(__dirname, "public");
app.use(express.static(frontendPath));

app.get("*path", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

const seedUsers = async () => {
  // Optional: Add seeding logic here if needed
};

const seedQuestions = async () => {
  // Optional: Add seeding logic here if needed
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on port ${PORT}`));