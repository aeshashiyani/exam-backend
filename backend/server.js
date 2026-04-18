const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase setup
if (!process.env.FIREBASE_KEY) {
  throw new Error("Missing FIREBASE_KEY environment variable");
}
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Add student
app.post("/student", async (req, res) => {
  const data = req.body;
  await db.collection("students").add(data);
  res.send("Student added");
});

// Get students
app.get("/students", async (req, res) => {
  const snapshot = await db.collection("students").get();
  let students = [];
  snapshot.forEach(doc => students.push(doc.data()));
  res.json(students);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});