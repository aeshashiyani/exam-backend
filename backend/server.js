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

// Fix for querySrv ECONNREFUSED
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   📦 AWS DYNAMODB CONFIG
========================= */
const region = process.env.AWS_REGION || "eu-north-1";

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
   🚀 SEEDING LOGIC (Question Bank)
========================= */
const seedQuestions = async () => {
  try {
    const existing = await docClient.send(new ScanCommand({ TableName: TABLES.QUESTIONS, Limit: 10 }));
    if (existing.Items && existing.Items.length >= 10) {
      console.log("✅ Question Bank is already full in DynamoDB");
      return;
    }

    const questionBank = [
      // iOS Development
      { id: "ios-1", question: "Which language is primarily used for iOS development?", options: ["Swift", "Java", "C#", "Kotlin"], answer: "Swift", subject: "ios" },
      { id: "ios-2", question: "What is the main lifecycle method called when a view controller is about to appear?", options: ["viewDidLoad", "viewWillAppear", "viewDidAppear", "viewWillDisappear"], answer: "viewWillAppear", subject: "ios" },
      { id: "ios-3", question: "What does ARC stand for in iOS development?", options: ["Automatic Reference Counting", "Advanced Result Code", "Auto Resource Control", "Asset Range Cache"], answer: "Automatic Reference Counting", subject: "ios" },
      { id: "ios-4", question: "Which framework is used for building user interfaces in a declarative way?", options: ["SwiftUI", "UIKit", "CoreData", "CoreML"], answer: "SwiftUI", subject: "ios" },
      
      // Flutter Development
      { id: "flutter-1", question: "Which language is used to write Flutter apps?", options: ["Dart", "Java", "Swift", "Kotlin"], answer: "Dart", subject: "flutter" },
      { id: "flutter-2", question: "What is the primary architectural component in Flutter?", options: ["Widget", "Fragment", "ViewController", "Activity"], answer: "Widget", subject: "flutter" },
      { id: "flutter-3", question: "Which command is used to check for errors in a Flutter project?", options: ["flutter doctor", "flutter run", "flutter clean", "flutter build"], answer: "flutter doctor", subject: "flutter" },
      { id: "flutter-4", question: "What type of engine does Flutter use for rendering?", options: ["Skia", "WebKit", "Gecko", "Blink"], answer: "Skia", subject: "flutter" },
      
      // Cloud Computing
      { id: "cloud-1", question: "What does AWS stand for?", options: ["Amazon Web Services", "Alpha Web Solution", "Amazon Web Store", "All Web Service"], answer: "Amazon Web Services", subject: "cloud computing" },
      { id: "cloud-2", question: "Which AWS service is used for scalable object storage?", options: ["S3", "EC2", "RDS", "Lambda"], answer: "S3", subject: "cloud computing" },
      { id: "cloud-3", question: "What is the serverless compute service in AWS called?", options: ["Lambda", "Fargate", "Elastic Beanstalk", "CloudFront"], answer: "Lambda", subject: "cloud computing" },
      { id: "cloud-4", question: "Which AWS service provides a managed NoSQL database?", options: ["DynamoDB", "Redshift", "Aurora", "ElastiCache"], answer: "DynamoDB", subject: "cloud computing" },
      
      // Machine Learning
      { id: "ml-1", question: "Which algorithm is commonly used for classification tasks?", options: ["Random Forest", "K-Means", "PCA", "Linear Regression"], answer: "Random Forest", subject: "machine learning" },
      { id: "ml-2", question: "What is the process of scaling data to have a mean of 0 and standard deviation of 1?", options: ["Standardization", "Normalization", "Vectorization", "Regularization"], answer: "Standardization", subject: "machine learning" },
      { id: "ml-3", question: "Which library is most popular for Deep Learning in Python?", options: ["TensorFlow", "Pandas", "Matplotlib", "Seaborn"], answer: "TensorFlow", subject: "machine learning" },
      
      // NLP
      { id: "nlp-1", question: "What does NLP stand for?", options: ["Natural Language Processing", "Node Language Protocol", "Network Layer Process", "Native Logic Programming"], answer: "Natural Language Processing", subject: "nlp" },
      { id: "nlp-2", question: "Which process involves reducing a word to its base form?", options: ["Lemmatization", "Tokenization", "Encoding", "Parsing"], answer: "Lemmatization", subject: "nlp" }
    ];

    console.log("📡 Hydrating DynamoDB with Question Bank...");
    for (const q of questionBank) {
      await docClient.send(new PutCommand({ 
        TableName: TABLES.QUESTIONS, 
        Item: { ...q, createdAt: Date.now() } 
      }));
    }
    console.log("📊 Successfully seeded all questions to AWS DynamoDB");
  } catch (err) {
    console.error("❌ SEED ERROR:", err.message);
  }
};

seedQuestions();

/* =========================
   🔐 AUTH ROUTES
========================= */

app.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ error: "All fields required" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const tableName = role === 'student' ? TABLES.STUDENTS : TABLES.FACULTIES;

    const existing = await docClient.send(new GetCommand({ TableName: tableName, Key: { username } }));
    if (existing.Item) return res.status(400).json({ error: "Username already exists" });

    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: { username, password: hashedPassword, role, createdAt: Date.now() }
    }));

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    let response = await docClient.send(new GetCommand({ TableName: TABLES.STUDENTS, Key: { username } }));
    let user = response.Item;

    if (!user) {
      response = await docClient.send(new GetCommand({ TableName: TABLES.FACULTIES, Key: { username } }));
      user = response.Item;
    }

    if (!user) return res.status(401).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret');
    res.json({ token, role: user.role, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
   📊 DATA ROUTES
========================= */

app.get("/students", async (req, res) => {
  try {
    const response = await docClient.send(new ScanCommand({ TableName: TABLES.STUDENTS }));
    res.json(response.Items.map(({ password, ...rest }) => rest));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

app.post("/generate-questions", async (req, res) => {
  try {
    const { subject } = req.body;
    const response = await docClient.send(new ScanCommand({ TableName: TABLES.QUESTIONS }));
    let questions = response.Items || [];
    
    if (subject) {
      questions = questions.filter(q => q.subject.toLowerCase() === subject.toLowerCase());
    }
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

app.post("/result", async (req, res) => {
  try {
    const { username, subject, score, total } = req.body;
    await docClient.send(new PutCommand({
      TableName: TABLES.RESULTS,
      Item: {
        username: username || "Student",
        subject: subject || "General",
        score: score || 0,
        total: total || 0,
        createdAt: Date.now().toString()
      }
    }));
    res.json({ message: "Result saved to AWS DynamoDB" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save result" });
  }
});

app.get("/results", async (req, res) => {
  try {
    const username = req.query.username;
    let response;
    
    if (username) {
      response = await docClient.send(new QueryCommand({
        TableName: TABLES.RESULTS,
        KeyConditionExpression: "username = :u",
        ExpressionAttributeValues: { ":u": username }
      }));
    } else {
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
const buildPath = path.join(__dirname, "public");
app.use(express.static(buildPath));

app.use((req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 AWS NATIVE SERVER RUNNING ON PORT ${PORT}`);
});