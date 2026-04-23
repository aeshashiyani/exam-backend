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
  QueryCommand,
  DeleteCommand 
} = require("@aws-sdk/lib-dynamodb");

// Fix for querySrv ECONNREFUSED
dns.setServers(['8.8.8.8', '8.8.4.4']);

/* =========================
   ⚙️ CONFIGURATION & DB
========================= */
const TABLES = {
  STUDENTS: "Students",
  FACULTIES: "Faculties",
  QUESTIONS: "Questions",
  RESULTS: "Results"
};

const clientConfig = { region: "eu-north-1" };

// On Elastic Beanstalk, use IAM Roles if credentials aren't in env
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const app = express();
app.use(cors());
app.use(express.json());

// 🩺 AWS Health Check
app.get("/health", (req, res) => res.status(200).send("Healthy"));
app.get("/api/ping", (req, res) => res.status(200).send("API is Live"));

/* =========================
   🚀 SEEDING LOGIC (100 Questions)
========================= */
/* =========================
   🚀 SEEDING LOGIC (100 Questions & 3 Faculties)
========================= */
const seedData = async () => {
  try {
    // 1. Seed Questions
    const existingQ = await docClient.send(new ScanCommand({ TableName: TABLES.QUESTIONS, Limit: 5 }));
    if (!existingQ.Items || existingQ.Items.length < 100) {
      const questionBank = [
        // --- iOS DEVELOPMENT (20 QUESTIONS) ---
        { id: "ios-1", question: "Which language is primarily used for modern iOS development?", options: ["Swift", "Java", "Python", "Kotlin"], answer: "Swift", subject: "ios" },
        { id: "ios-2", question: "What is the main lifecycle method called when a view controller is about to appear?", options: ["viewDidLoad", "viewWillAppear", "viewDidAppear", "viewWillDisappear"], answer: "viewWillAppear", subject: "ios" },
        { id: "ios-3", question: "What does ARC stand for in iOS?", options: ["Automatic Reference Counting", "Auto Resource Center", "Advanced Result Code", "Array Resource Count"], answer: "Automatic Reference Counting", subject: "ios" },
        { id: "ios-4", question: "Which framework is used for building declarative user interfaces in iOS?", options: ["SwiftUI", "UIKit", "CocoaTouch", "CoreML"], answer: "SwiftUI", subject: "ios" },
        { id: "ios-5", question: "What is the primary tool used to develop iOS apps?", options: ["Xcode", "Android Studio", "VS Code", "PyCharm"], answer: "Xcode", subject: "ios" },
        { id: "ios-6", question: "Which collection type in Swift stores unique values?", options: ["Set", "Array", "Dictionary", "Tuple"], answer: "Set", subject: "ios" },
        { id: "ios-7", question: "What is the purpose of a 'guard' statement in Swift?", options: ["Exit early if a condition is not met", "Loop through an array", "Declare a constant", "Perform a force unwrap"], answer: "Exit early if a condition is not met", subject: "ios" },
        { id: "ios-8", question: "Which property wrapper is used for simple state management in SwiftUI?", options: ["@State", "@ObservedObject", "@Binding", "@Environment"], answer: "@State", subject: "ios" },
        { id: "ios-9", question: "What is the purpose of GCD in iOS?", options: ["Manage concurrent tasks", "Design UI layouts", "Store data locally", "Handle network requests"], answer: "Manage concurrent tasks", subject: "ios" },
        { id: "ios-10", question: "What is the entry point of a Swift application?", options: ["@main", "@UIApplication", "func main()", "app.start()"], answer: "@main", subject: "ios" },
        { id: "ios-11", question: "Which protocol is used for serializing and deserializing data in Swift?", options: ["Codable", "Equatable", "Hashable", "Comparable"], answer: "Codable", subject: "ios" },
        { id: "ios-12", question: "What is a 'Optional' in Swift?", options: ["A type that can represent a value or no value", "A required variable", "A loop type", "A UI component"], answer: "A type that can represent a value or no value", subject: "ios" },
        { id: "ios-13", question: "Which pattern is commonly used for data passing between view controllers?", options: ["Delegation", "Singleton", "Factory", "Builder"], answer: "Delegation", subject: "ios" },
        { id: "ios-14", question: "What is the purpose of Auto Layout?", options: ["Create responsive UI", "Manage database", "Debug code", "Compile assets"], answer: "Create responsive UI", subject: "ios" },
        { id: "ios-15", question: "Which keyword is used to prevent a class from being inherited?", options: ["final", "static", "private", "public"], answer: "final", subject: "ios" },
        { id: "ios-16", question: "What is a closure in Swift?", options: ["Self-contained block of functionality", "A class type", "An array", "A loop"], answer: "Self-contained block of functionality", subject: "ios" },
        { id: "ios-17", question: "What is the purpose of 'weak' keyword in properties?", options: ["Prevent retain cycles", "Increase speed", "Private access", "Store constants"], answer: "Prevent retain cycles", subject: "ios" },
        { id: "ios-18", question: "Which component manages the application life cycle?", options: ["AppDelegate", "ViewController", "View", "Model"], answer: "AppDelegate", subject: "ios" },
        { id: "ios-19", question: "What is used to debug network calls in Xcode?", options: ["Network Link Conditioner", "Console", "Debug Navigator", "Simulator"], answer: "Network Link Conditioner", subject: "ios" },
        { id: "ios-20", question: "Which architecture is Apple's latest recommendation for SwiftUI?", options: ["MVVM", "MVC", "VIPER", "MVP"], answer: "MVVM", subject: "ios" },
  
        // --- FLUTTER DEVELOPMENT (20 QUESTIONS) ---
        { id: "flutter-1", question: "Which language is used to write Flutter apps?", options: ["Dart", "Java", "Swift", "C++"], answer: "Dart", subject: "flutter" },
        { id: "flutter-2", question: "Everything in Flutter is a...?", options: ["Widget", "Component", "Activity", "Fragment"], answer: "Widget", subject: "flutter" },
        { id: "flutter-3", question: "Which command checks if your environment is ready for Flutter?", options: ["flutter doctor", "flutter run", "flutter config", "flutter check"], answer: "flutter doctor", subject: "flutter" },
        { id: "flutter-4", question: "What is the engine used by Flutter for rendering?", options: ["Skia", "WebKit", "Gecko", "Blink"], answer: "Skia", subject: "flutter" },
        { id: "flutter-5", question: "Which widget is the root of most Flutter apps?", options: ["MaterialApp", "Container", "Scaffold", "Column"], answer: "MaterialApp", subject: "flutter" },
        { id: "flutter-6", question: "What is the purpose of 'pubspec.yaml'?", options: ["Manage dependencies", "Define UI", "Compile code", "Run tests"], answer: "Manage dependencies", subject: "flutter" },
        { id: "flutter-7", question: "Which widget provides a basic layout structure (App Bar, Drawer, etc.)?", options: ["Scaffold", "Container", "Stack", "Row"], answer: "Scaffold", subject: "flutter" },
        { id: "flutter-8", question: "What is 'Hot Reload' in Flutter?", options: ["Update UI without restarting", "Compile the app", "Clean the build", "Debug mode"], answer: "Update UI without restarting", subject: "flutter" },
        { id: "flutter-9", question: "Which state management approach is built into Flutter?", options: ["setState", "Provider", "Bloc", "Redux"], answer: "setState", subject: "flutter" },
        { id: "flutter-10", question: "What is a 'StatelessWidget'?", options: ["A widget that does not change state", "A widget that stores data", "A loop widget", "A network widget"], answer: "A widget that does not change state", subject: "flutter" },
        { id: "flutter-11", question: "Which widget is used to create a scrollable list?", options: ["ListView", "Column", "Row", "Stack"], answer: "ListView", subject: "flutter" },
        { id: "flutter-12", question: "What is the purpose of a 'Navigator'?", options: ["Manage screen routing", "Fetch data", "Build UI", "Style components"], answer: "Manage screen routing", subject: "flutter" },
        { id: "flutter-13", question: "Which operator is used for null-safety in Dart?", options: ["?", "!", "??", "all of these"], answer: "all of these", subject: "flutter" },
        { id: "flutter-14", question: "What is a 'Future' in Dart?", options: ["A result of an async operation", "A loop", "A constant", "A UI element"], answer: "A result of an async operation", subject: "flutter" },
        { id: "flutter-15", question: "Which widget allows overlapping children?", options: ["Stack", "Column", "Row", "Wrap"], answer: "Stack", subject: "flutter" },
        { id: "flutter-16", question: "How do you add assets in Flutter?", options: ["In pubspec.yaml", "In main.dart", "In assets.json", "In build.gradle"], answer: "In pubspec.yaml", subject: "flutter" },
        { id: "flutter-17", question: "Which function is the starting point of a Flutter app?", options: ["main()", "runApp()", "start()", "init()"], answer: "main()", subject: "flutter" },
        { id: "flutter-18", question: "What is the purpose of 'Keys' in Flutter?", options: ["Identify widgets in a tree", "Secure data", "Access database", "Translate text"], answer: "Identify widgets in a tree", subject: "flutter" },
        { id: "flutter-19", question: "Which widget is used to handle user gestures like taps?", options: ["GestureDetector", "TouchBox", "PressArea", "ClickSensor"], answer: "GestureDetector", subject: "flutter" },
        { id: "flutter-20", question: "What is a 'Stream' in Dart?", options: ["A sequence of async events", "A single value", "A UI widget", "A file type"], answer: "A sequence of async events", subject: "flutter" },
  
        // --- CLOUD COMPUTING (20 QUESTIONS) ---
        { id: "cloud-1", question: "What does AWS stand for?", options: ["Amazon Web Services", "Alpha Web Solution", "Amazon Web Store", "All Web Service"], answer: "Amazon Web Services", subject: "cloud computing" },
        { id: "cloud-2", question: "Which service provides scalable object storage?", options: ["S3", "EC2", "RDS", "Lambda"], answer: "S3", subject: "cloud computing" },
        { id: "cloud-3", question: "What is the serverless compute service in AWS?", options: ["Lambda", "Fargate", "EC2", "Lightsail"], answer: "Lambda", subject: "cloud computing" },
        { id: "cloud-4", question: "Which service is used for a managed NoSQL database?", options: ["DynamoDB", "Redshift", "Aurora", "Oracle"], answer: "DynamoDB", subject: "cloud computing" },
        { id: "cloud-5", question: "What does EC2 stand for?", options: ["Elastic Compute Cloud", "Easy Cloud Computing", "Efficient Cloud Engine", "Electronic Cloud Center"], answer: "Elastic Compute Cloud", subject: "cloud computing" },
        { id: "cloud-6", question: "Which service is used for managing users and permissions?", options: ["IAM", "KMS", "GuardDuty", "Shield"], answer: "IAM", subject: "cloud computing" },
        { id: "cloud-7", question: "What is a VPC?", options: ["Virtual Private Cloud", "Very Private Center", "Virtual Power Control", "Vector Processing Core"], answer: "Virtual Private Cloud", subject: "cloud computing" },
        { id: "cloud-8", question: "Which service is used for CDN (Content Delivery Network)?", options: ["CloudFront", "Route 53", "Direct Connect", "API Gateway"], answer: "CloudFront", subject: "cloud computing" },
        { id: "cloud-9", question: "What is the purpose of Route 53?", options: ["Manage DNS", "Store data", "Run code", "Send emails"], answer: "Manage DNS", subject: "cloud computing" },
        { id: "cloud-10", question: "What is the 'Free Tier' in AWS?", options: ["Limited free usage of services", "Completely free account", "Free training", "Free hardware"], answer: "Limited free usage of services", subject: "cloud computing" },
        { id: "cloud-11", question: "Which service is used for data warehousing?", options: ["Redshift", "DynamoDB", "S3", "EFS"], answer: "Redshift", subject: "cloud computing" },
        { id: "cloud-12", question: "What is an 'Availability Zone'?", options: ["One or more data centers", "A country", "A city", "A single server"], answer: "One or more data centers", subject: "cloud computing" },
        { id: "cloud-13", question: "Which service provides managed SQL databases?", options: ["RDS", "DynamoDB", "DocumentDB", "Keyspaces"], answer: "RDS", subject: "cloud computing" },
        { id: "cloud-14", question: "What is 'Auto Scaling'?", options: ["Adjusting capacity based on load", "Automatically writing code", "Self-repairing servers", "Auto-paying bills"], answer: "Adjusting capacity based on load", subject: "cloud computing" },
        { id: "cloud-15", question: "Which service is used for sending transactional emails?", options: ["SES", "SNS", "SQS", "SWF"], answer: "SES", subject: "cloud computing" },
        { id: "cloud-16", question: "What is 'CloudWatch' used for?", options: ["Monitoring and logging", "Designing UI", "Hacking", "Storing files"], answer: "Monitoring and logging", subject: "cloud computing" },
        { id: "cloud-17", question: "What is 'CloudTrail' used for?", options: ["Governance and auditing", "Computing", "Networking", "Database"], answer: "Governance and auditing", subject: "cloud computing" },
        { id: "cloud-18", question: "Which service handles message queuing?", options: ["SQS", "SNS", "SES", "Kinesis"], answer: "SQS", subject: "cloud computing" },
        { id: "cloud-19", question: "What is an 'IAM Role'?", options: ["Temporary permissions for a service", "A user password", "A billing tier", "A hardware type"], answer: "Temporary permissions for a service", subject: "cloud computing" },
        { id: "cloud-20", question: "Which service is used for Infrastructure as Code?", options: ["CloudFormation", "Terraform", "Both of these", "None"], answer: "Both of these", subject: "cloud computing" },
  
        // --- MACHINE LEARNING (20 QUESTIONS) ---
        { id: "ml-1", question: "What is the core goal of Machine Learning?", options: ["Make predictions from data", "Build websites", "Fix hardware", "Write emails"], answer: "Make predictions from data", subject: "machine learning" },
        { id: "ml-2", question: "What is Supervised Learning?", options: ["Learning with labeled data", "Learning with no data", "Unsupervised learning", "Manual coding"], answer: "Learning with labeled data", subject: "machine learning" },
        { id: "ml-3", question: "Which algorithm is used for classification?", options: ["Logistic Regression", "Linear Regression", "K-Means", "PCA"], answer: "Logistic Regression", subject: "machine learning" },
        { id: "ml-4", question: "What is 'Overfitting'?", options: ["Model performing too well on training data only", "Model being too small", "Data being too large", "Fast training"], answer: "Model performing too well on training data only", subject: "machine learning" },
        { id: "ml-5", question: "Which library is most popular for ML in Python?", options: ["Scikit-Learn", "Matplotlib", "Django", "Flask"], answer: "Scikit-Learn", subject: "machine learning" },
        { id: "ml-6", question: "What is a 'Neural Network'?", options: ["Algorithm inspired by human brain", "A web browser", "A social network", "A hardware part"], answer: "Algorithm inspired by human brain", subject: "machine learning" },
        { id: "ml-7", question: "What is 'Deep Learning'?", options: ["Neural networks with many layers", "Reading books", "Manual coding", "Database storage"], answer: "Neural networks with many layers", subject: "machine learning" },
        { id: "ml-8", question: "Which metric measures the accuracy of a model?", options: ["F1-Score", "Weight", "Speed", "Color"], answer: "F1-Score", subject: "machine learning" },
        { id: "ml-9", question: "What is K-Means used for?", options: ["Clustering", "Classification", "Regression", "Cleaning"], answer: "Clustering", subject: "machine learning" },
        { id: "ml-10", question: "What is 'Training Data'?", options: ["Data used to build the model", "Data to sell", "Public data", "Secret data"], answer: "Data used to build the model", subject: "machine learning" },
        { id: "ml-11", question: "What is 'Bias' in ML?", options: ["Error from erroneous assumptions", "Fast learning", "Small data", "High accuracy"], answer: "Error from erroneous assumptions", subject: "machine learning" },
        { id: "ml-12", question: "What is 'Variance' in ML?", options: ["Sensitivity to small fluctuations in training set", "Error", "Weight", "Bias"], answer: "Sensitivity to small fluctuations in training set", subject: "machine learning" },
        { id: "ml-13", question: "Which algorithm is a 'Black Box'?", options: ["Deep Neural Networks", "Decision Trees", "Linear Regression", "K-NN"], answer: "Deep Neural Networks", subject: "machine learning" },
        { id: "ml-14", question: "What is the purpose of 'Cross-Validation'?", options: ["Evaluate model performance", "Increase data", "Clean data", "Speed up training"], answer: "Evaluate model performance", subject: "machine learning" },
        { id: "ml-15", question: "What is 'Feature Engineering'?", options: ["Creating better input data", "Building servers", "Writing code", "Designing UI"], answer: "Creating better input data", subject: "machine learning" },
        { id: "ml-16", question: "What is 'Gradient Descent'?", options: ["Optimization algorithm", "A loop", "A data type", "A sorting method"], answer: "Optimization algorithm", subject: "machine learning" },
        { id: "ml-17", question: "Which company created TensorFlow?", options: ["Google", "Facebook", "Microsoft", "Amazon"], answer: "Google", subject: "machine learning" },
        { id: "ml-18", question: "Which company created PyTorch?", options: ["Facebook", "Google", "Apple", "Oracle"], answer: "Facebook", subject: "machine learning" },
        { id: "ml-19", question: "What is 'Reinforcement Learning'?", options: ["Learning through rewards/penalties", "Manual learning", "Watching videos", "None"], answer: "Learning through rewards/penalties", subject: "machine learning" },
        { id: "ml-20", question: "What is 'NLP' within ML?", options: ["Natural Language Processing", "Node Logic", "Native Process", "Network Layer"], answer: "Natural Language Processing", subject: "machine learning" },
  
        // --- NLP (20 QUESTIONS) ---
        { id: "nlp-1", question: "What is 'Tokenization'?", options: ["Splitting text into words/tokens", "Hacking tokens", "Creating keys", "Deleting text"], answer: "Splitting text into words/tokens", subject: "nlp" },
        { id: "nlp-2", question: "What is 'Stemming'?", options: ["Reducing word to root form", "Removing text", "Adding text", "Translating"], answer: "Reducing word to root form", subject: "nlp" },
        { id: "nlp-3", question: "What is 'Stop Word Removal'?", options: ["Deleting common words like 'the', 'is'", "Stopping the code", "Removing errors", "Deleting files"], answer: "Deleting common words like 'the', 'is'", subject: "nlp" },
        { id: "nlp-4", question: "What is 'Sentiment Analysis'?", options: ["Determining emotion in text", "Reading news", "Correcting grammar", "Translating"], answer: "Determining emotion in text", subject: "nlp" },
        { id: "nlp-5", question: "What is 'Lemmatization'?", options: ["Context-aware root reduction", "Stemming", "Tokenization", "Encoding"], answer: "Context-aware root reduction", subject: "nlp" },
        { id: "nlp-6", question: "Which library is popular for NLP in Python?", options: ["NLTK", "Flask", "Django", "NumPy"], answer: "NLTK", subject: "nlp" },
        { id: "nlp-7", question: "What is 'Spacy'?", options: ["Advanced NLP library", "A game", "A space tool", "A database"], answer: "Advanced NLP library", subject: "nlp" },
        { id: "nlp-8", question: "What does 'TF-IDF' stand for?", options: ["Term Frequency-Inverse Document Frequency", "Total File Data", "Text Format", "True Factor"], answer: "Term Frequency-Inverse Document Frequency", subject: "nlp" },
        { id: "nlp-9", question: "What is 'Named Entity Recognition'?", options: ["Identifying names, dates, places", "Hacking names", "Naming files", "Deleting names"], answer: "Identifying names, dates, places", subject: "nlp" },
        { id: "nlp-10", question: "What is 'Machine Translation'?", options: ["Translating text via computer", "Manual translation", "Coding", "Formatting"], answer: "Translating text via computer", subject: "nlp" },
        { id: "nlp-11", question: "What is 'Word2Vec'?", options: ["Mapping words to vectors", "Word to text", "Word to file", "Word to link"], answer: "Mapping words to vectors", subject: "nlp" },
        { id: "nlp-12", question: "What is a 'Transformer' in NLP?", options: ["Deep learning model for text", "A robot", "A hardware part", "A loop"], answer: "Deep learning model for text", subject: "nlp" },
        { id: "nlp-13", question: "What is 'BERT'?", options: ["Google's NLP model", "A user", "A browser", "A database"], answer: "Google's NLP model", subject: "nlp" },
        { id: "nlp-14", question: "What is 'GPT'?", options: ["Generative Pre-trained Transformer", "General Processing Tool", "Global Power Task", "None"], answer: "Generative Pre-trained Transformer", subject: "nlp" },
        { id: "nlp-15", question: "What is 'Part-of-Speech Tagging'?", options: ["Labeling words as nouns, verbs, etc.", "Tagging friends", "Social tagging", "File tagging"], answer: "Labeling words as nouns, verbs, etc.", subject: "nlp" },
        { id: "nlp-16", question: "What is 'N-gram'?", options: ["Contiguous sequence of N items", "A weight", "A distance", "A speed"], answer: "Contiguous sequence of N items", subject: "nlp" },
        { id: "nlp-17", question: "What is 'Corpus' in NLP?", options: ["A large set of text data", "A dead body", "A hardware", "A code file"], answer: "A large set of text data", subject: "nlp" },
        { id: "nlp-18", question: "What is 'Parsing' in NLP?", options: ["Analyzing grammatical structure", "Deleting text", "Formatting", "Downloading"], answer: "Analyzing grammatical structure", subject: "nlp" },
        { id: "nlp-19", question: "What is 'Bag of Words'?", options: ["Representation of text by word frequency", "A physical bag", "A database", "A loop"], answer: "Representation of text by word frequency", subject: "nlp" },
        { id: "nlp-20", question: "What is 'Chatbot'?", options: ["Software that simulates conversation", "A hardware", "A search engine", "A game"], answer: "Software that simulates conversation", subject: "nlp" }
      ];
  
      console.log("📡 Hydrating AWS DynamoDB with 100+ Questions...");
      for (const q of questionBank) {
        await docClient.send(new PutCommand({ 
          TableName: TABLES.QUESTIONS, 
          Item: { ...q, createdAt: Date.now() } 
        }));
      }
    }

    // 2. Seed Faculties
    const faculties = [
      { username: "Ms.Bhumika", password: "pass123", role: "faculty", subjects: ["cloud computing"] },
      { username: "Mr.Jeetendra", password: "pass123", role: "faculty", subjects: ["ios", "flutter"] },
      { username: "Ms.Kajal", password: "pass123", role: "faculty", subjects: ["machine learning", "nlp"] }
    ];

    for (const f of faculties) {
      const hashedPassword = await bcrypt.hash(f.password, 10);
      await docClient.send(new PutCommand({
        TableName: TABLES.FACULTIES,
        Item: { ...f, password: hashedPassword, createdAt: Date.now() }
      }));
      console.log(`✅ Faculty ${f.username} seeded/updated.`);
    }
    console.log("📊 SUCCESS: AWS Native Seeding Complete!");
  } catch (err) {
    console.error("❌ SEED ERROR:", err.message);
  }
};

seedData();

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
    await docClient.send(new PutCommand({ TableName: tableName, Item: { username, password: hashedPassword, role, createdAt: Date.now() } }));
    res.json({ message: "User registered successfully" });
  } catch (err) { res.status(500).json({ error: "Registration failed" }); }
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
    
    // Include allocated subjects for faculty
    const userData = { token, role: user.role, username: user.username };
    if (user.role === 'faculty') userData.subjects = user.subjects || [];
    
    res.json(userData);
  } catch (err) { res.status(500).json({ error: "Login failed" }); }
});

/* =========================
   📊 MCQ MANAGEMENT (FACULTY ONLY)
========================= */
app.post("/add-questions", async (req, res) => {
  try {
    const { username, subject, questions } = req.body;
    
    if (!username || !subject || !questions || questions.length !== 20) {
      return res.status(400).json({ error: "Exactly 20 questions and all fields are required" });
    }

    // Verify faculty and subject allocation
    const facResponse = await docClient.send(new GetCommand({ TableName: TABLES.FACULTIES, Key: { username } }));
    const faculty = facResponse.Item;
    
    if (!faculty || !faculty.subjects.map(s => s.toLowerCase()).includes(subject.toLowerCase())) {
      return res.status(403).json({ error: "Unauthorized: Subject not allocated to this faculty" });
    }

    // Fetch existing questions for this subject to delete them
    const scanResponse = await docClient.send(new ScanCommand({ 
      TableName: TABLES.QUESTIONS,
      FilterExpression: "subject = :s",
      ExpressionAttributeValues: { ":s": subject.toLowerCase() }
    }));
    
    for (const item of scanResponse.Items || []) {
      await docClient.send(new DeleteCommand({ TableName: TABLES.QUESTIONS, Key: { id: item.id } }));
    }

    // Add new 20 questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await docClient.send(new PutCommand({
        TableName: TABLES.QUESTIONS,
        Item: { 
          id: `${subject.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
          question: q.question,
          options: q.options,
          answer: q.answer,
          subject: subject.toLowerCase(),
          createdAt: Date.now()
        }
      }));
    }

    res.json({ message: `Successfully updated 20 questions for ${subject}` });
  } catch (err) {
    console.error("❌ UPDATE ERROR:", err);
    res.status(500).json({ error: "Failed to update questions: " + err.message });
  }
});

/* =========================
   📊 DATA ROUTES
========================= */
app.get("/students", async (req, res) => {
  try {
    const response = await docClient.send(new ScanCommand({ TableName: TABLES.STUDENTS }));
    res.json(response.Items.map(({ password, ...rest }) => rest));
  } catch (err) { res.status(500).json({ error: "Failed to fetch students" }); }
});

app.post("/generate-questions", async (req, res) => {
  try {
    const { subject } = req.body;
    const response = await docClient.send(new ScanCommand({ TableName: TABLES.QUESTIONS }));
    let questions = response.Items || [];
    if (subject) { questions = questions.filter(q => q.subject.toLowerCase() === subject.toLowerCase()); }
    res.json(questions);
  } catch (err) { res.status(500).json({ error: "Failed to fetch questions" }); }
});

app.post("/result", async (req, res) => {
  try {
    const { username, subject, score, total } = req.body;
    await docClient.send(new PutCommand({
      TableName: TABLES.RESULTS,
      Item: { username: username || "Student", subject: subject || "General", score: score || 0, total: total || 0, createdAt: Date.now().toString() }
    }));
    res.json({ message: "Result saved to AWS DynamoDB" });
  } catch (err) { res.status(500).json({ error: "Failed to save result" }); }
});

app.get("/results", async (req, res) => {
  try {
    const username = req.query.username;
    let response;
    if (username) {
      response = await docClient.send(new QueryCommand({ TableName: TABLES.RESULTS, KeyConditionExpression: "username = :u", ExpressionAttributeValues: { ":u": username } }));
    } else { response = await docClient.send(new ScanCommand({ TableName: TABLES.RESULTS })); }
    res.json(response.Items || []);
  } catch (err) { res.status(500).json({ error: "Failed to fetch results" }); }
});

const buildPath = path.join(__dirname, "public");
app.use(express.static(buildPath));
app.use((req, res) => { res.sendFile(path.join(buildPath, "index.html")); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { 
  console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
  console.log(`📡 AWS Region: ${clientConfig.region}`);
  console.log(`🔐 Credentials: ${clientConfig.credentials ? 'Manual' : 'IAM Role'}`);
});