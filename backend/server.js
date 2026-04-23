require("dotenv").config();
const dns = require('dns');
const path = require('path');
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// AWS SDK v3
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  ScanCommand, 
  QueryCommand 
} = require("@aws-sdk/lib-dynamodb");

// Fix for querySrv ECONNREFUSED on some networks (not needed for DynamoDB but kept for safety)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* =========================
   📦 AWS DYNAMODB CONFIG
========================= */
const region = process.env.AWS_REGION || "eu-north-1";

// For local testing, we use credentials. In production (EB), we use IAM Roles.
const clientConfig = {
  region: region
};

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const TABLES = {
  STUDENTS: "Students",
  FACULTIES: "Faculties",
  RESULTS: "Results",
  QUESTIONS: "Questions"
};

/* =========================
   🚀 SEEDING LOGIC
========================= */
const seedQuestions = async () => {
  try {
    const existing = await docClient.send(new ScanCommand({ TableName: TABLES.QUESTIONS, Limit: 1 }));
    if (existing.Items && existing.Items.length > 0) {
      console.log("✅ Questions already exist in DynamoDB");
      return;
    }

    const sampleQuestions = [
      { id: "ios-1", question: "Which language is primarily used for iOS development?", options: ["Swift", "Java", "C#", "Kotlin"], answer: "Swift", subject: "ios" },
      { id: "ios-2", question: "What is the main lifecycle method called when a view controller is about to appear?", options: ["viewDidLoad", "viewWillAppear", "viewDidAppear", "viewWillDisappear"], answer: "viewWillAppear", subject: "ios" },
      { id: "flutter-1", question: "Which language is used to write Flutter apps?", options: ["Dart", "Java", "Swift", "Kotlin"], answer: "Dart", subject: "flutter" },
      { id: "cloud-1", question: "What does AWS stand for?", options: ["Amazon Web Services", "Alpha Web Solution", "Amazon Web Store", "All Web Service"], answer: "Amazon Web Services", subject: "cloud computing" }
      // Add more as needed
    ];

    for (const q of sampleQuestions) {
      await docClient.send(new PutCommand({ TableName: TABLES.QUESTIONS, Item: { ...q, createdAt: Date.now() } }));
    }
    console.log("📊 Successfully seeded Questions to DynamoDB");
  } catch (err) {
    console.error("❌ SEED ERROR:", err.message);
  }
};

seedQuestions();

/* =========================
   🔐 AUTH ROUTES
========================= */

// Register
app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "All fields required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tableName = role === 'student' ? TABLES.STUDENTS : TABLES.FACULTIES;

    // Check if user exists
    const existing = await docClient.send(new GetCommand({ TableName: tableName, Key: { username } }));
    if (existing.Item) {
      return res.status(400).json({ error: "Username already exists" });
    }

    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        username,
        password: hashedPassword,
        role,
        createdAt: Date.now()
      }
    }));

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.log("❌ REGISTER ERROR:", err.message);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check Students first
    let response = await docClient.send(new GetCommand({ TableName: TABLES.STUDENTS, Key: { username } }));
    let user = response.Item;

    if (!user) {
      // Check Faculties
      response = await docClient.send(new GetCommand({ TableName: TABLES.FACULTIES, Key: { username } }));
      user = response.Item;
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role }, 
      process.env.JWT_SECRET || 'secret'
    );
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err.message);
    res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
   📊 DATA ROUTES
========================= */

// Get all students
app.get("/students", async (req, res) => {
  try {
    const response = await docClient.send(new ScanCommand({ TableName: TABLES.STUDENTS }));
    const students = response.Items.map(s => {
      const { password, ...rest } = s;
      return rest;
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Get questions for subject
app.get("/questions", async (req, res) => {
  try {
    const subject = req.query.subject;
    const response = await docClient.send(new ScanCommand({ TableName: TABLES.QUESTIONS }));
    let questions = response.Items;
    
    if (subject) {
      questions = questions.filter(q => q.subject === subject);
    }
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Save result
app.post("/results", async (req, res) => {
  try {
    const { username, subject, score, total } = req.body;
    await docClient.send(new PutCommand({
      TableName: TABLES.RESULTS,
      Item: {
        username,
        subject,
        score,
        total,
        createdAt: Date.now().toString()
      }
    }));
    res.json({ message: "Result saved to AWS DynamoDB" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save result" });
  }
});

// Get results
app.get("/results", async (req, res) => {
  try {
    const username = req.query.username;
    let response;
    
    if (username) {
      // Query by username (Partition Key)
      response = await docClient.send(new QueryCommand({
        TableName: TABLES.RESULTS,
        KeyConditionExpression: "username = :u",
        ExpressionAttributeValues: { ":u": username }
      }));
    } else {
      // Scan all (Faculty view)
      response = await docClient.send(new ScanCommand({ TableName: TABLES.RESULTS }));
    }
    
    res.json(response.Items || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

/* =========================
   🌐 STATIC FILES & ROUTING
========================= */
const buildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(buildPath));

app.get("/:any*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AWS NATIVE SERVER RUNNING ON PORT ${PORT}`);
});