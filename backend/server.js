require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const axios = require("axios");
const Anthropic = require('@anthropic-ai/sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

/* =========================
   MongoDB CONNECTION
========================= */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/exam";
console.log("📡 Attempting to connect to:", MONGODB_URI.includes("@") ? "Cloud Database (Atlas)" : "Local Database (127.0.0.1)");

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    seedUsers();
    seedQuestions();
  })
  .catch(err => {
    console.log("❌ MongoDB Connection Error:");
    console.log(err.message);
  });

/* =========================
   📦 MODELS
========================= */

// Question Model
const QuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  subject: String,
  difficulty: String,
  createdAt: { type: Date, default: Date.now }
});

const Question = mongoose.model("Question", QuestionSchema);

// Result Model
const ResultSchema = new mongoose.Schema({
  score: Number,
  total: Number,
  createdAt: { type: Date, default: Date.now }
});

const Result = mongoose.model("Result", ResultSchema);

// User Model
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

// Seed initial data
const seedUsers = async () => {
  const users = [
    { username: 'student1', password: 'pass123', role: 'student' },
    { username: 'student2', password: 'pass123', role: 'student' },
    { username: 'faculty1', password: 'pass123', role: 'faculty' },
    { username: 'faculty2', password: 'pass123', role: 'faculty' }
  ];
  for (const userData of users) {
    const existing = await User.findOne({ username: userData.username });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await User.create({ ...userData, password: hashedPassword });
      console.log(`Seeded user: ${userData.username}`);
    }
  }
};

// Seed sample questions for specific subjects
const seedQuestions = async () => {
  try {
    // Clear old questions first
    await Question.deleteMany({});
    console.log("🗑️ Cleared old questions");
  
  const sampleQuestions = [
    // ===== iOS - 20 questions =====
    { question: "Which language is primarily used for iOS development?", options: ["Swift", "Java", "C#", "Kotlin"], answer: "Swift", subject: "ios", difficulty: "easy" },
    { question: "What is the main lifecycle method called when a view controller is about to appear?", options: ["viewDidLoad", "viewWillAppear", "viewDidAppear", "viewWillDisappear"], answer: "viewWillAppear", subject: "ios", difficulty: "medium" },
    { question: "Which framework is used for building UIs in iOS?", options: ["UIKit", "Flask", "Django", "React Native"], answer: "UIKit", subject: "ios", difficulty: "easy" },
    { question: "What is the purpose of Codable protocol in Swift?", options: ["For networking", "For serialization/deserialization", "For UI rendering", "For data storage"], answer: "For serialization/deserialization", subject: "ios", difficulty: "hard" },
    { question: "Which design pattern is most commonly used in iOS development?", options: ["MVC", "MVP", "VIPER", "MVVM"], answer: "MVC", subject: "ios", difficulty: "medium" },
    { question: "What is SwiftUI used for?", options: ["Backend development", "Building declarative user interfaces", "Database management", "Networking"], answer: "Building declarative user interfaces", subject: "ios", difficulty: "easy" },
    { question: "Which method is called first in the iOS app lifecycle?", options: ["applicationDidBecomeActive", "applicationWillEnterForeground", "application:didFinishLaunchingWithOptions:", "applicationWillResignActive"], answer: "application:didFinishLaunchingWithOptions:", subject: "ios", difficulty: "hard" },
    { question: "What is Core Data used for in iOS?", options: ["Networking", "Audio playback", "Local data persistence", "UI animations"], answer: "Local data persistence", subject: "ios", difficulty: "medium" },
    { question: "Which class is used to make network requests in iOS?", options: ["URLSession", "NSNetworkRequest", "HTTPClient", "NetManager"], answer: "URLSession", subject: "ios", difficulty: "medium" },
    { question: "What does ARC stand for in Swift?", options: ["Automatic Reference Counting", "Allocated Resource Control", "App Runtime Configuration", "Advanced Resource Compiler"], answer: "Automatic Reference Counting", subject: "ios", difficulty: "hard" },
    { question: "Which keyword is used to define an optional in Swift?", options: ["nullable", "optional", "?", "@optional"], answer: "?", subject: "ios", difficulty: "easy" },
    { question: "What is a delegate pattern in iOS?", options: ["A way to pass data between view controllers", "A design pattern where one object acts on behalf of another", "A Swift protocol", "A memory management technique"], answer: "A design pattern where one object acts on behalf of another", subject: "ios", difficulty: "medium" },
    { question: "Which tool is used to manage dependencies in iOS?", options: ["npm", "pip", "CocoaPods", "gradle"], answer: "CocoaPods", subject: "ios", difficulty: "easy" },
    { question: "What is Grand Central Dispatch (GCD) used for?", options: ["UI rendering", "Database queries", "Concurrency and multithreading", "File management"], answer: "Concurrency and multithreading", subject: "ios", difficulty: "hard" },
    { question: "What is the entry point of a Swift iOS application?", options: ["main.swift", "AppDelegate.swift", "ViewController.swift", "SceneDelegate.swift"], answer: "AppDelegate.swift", subject: "ios", difficulty: "medium" },
    { question: "Which Swift collection type stores key-value pairs?", options: ["Array", "Set", "Dictionary", "Tuple"], answer: "Dictionary", subject: "ios", difficulty: "easy" },
    { question: "What is the purpose of the @State property wrapper in SwiftUI?", options: ["Network calls", "Managing mutable state in a view", "Animation control", "Navigation"], answer: "Managing mutable state in a view", subject: "ios", difficulty: "medium" },
    { question: "What is Xcode?", options: ["A Swift library", "Apple's IDE for iOS/macOS development", "A testing framework", "A cloud service"], answer: "Apple's IDE for iOS/macOS development", subject: "ios", difficulty: "easy" },
    { question: "Which method is used to present a modal view controller?", options: ["pushViewController", "presentViewController", "showViewController", "displayController"], answer: "presentViewController", subject: "ios", difficulty: "medium" },
    { question: "What is UserDefaults used for in iOS?", options: ["Storing large files", "Network caching", "Storing small pieces of user data", "Managing app themes"], answer: "Storing small pieces of user data", subject: "ios", difficulty: "easy" },

    // ===== Flutter - 20 questions =====
    { question: "Which language is used for Flutter development?", options: ["Dart", "Java", "JavaScript", "C++"], answer: "Dart", subject: "flutter", difficulty: "easy" },
    { question: "What is the basic building block of Flutter UI?", options: ["Component", "Widget", "Container", "View"], answer: "Widget", subject: "flutter", difficulty: "easy" },
    { question: "Which Flutter widget is used for layout with rows and columns?", options: ["GridView", "Row/Column", "Stack", "Wrap"], answer: "Row/Column", subject: "flutter", difficulty: "medium" },
    { question: "What is hot reload in Flutter?", options: ["Restarting the app", "Reloading code without restarting", "Clearing cache", "None"], answer: "Reloading code without restarting", subject: "flutter", difficulty: "medium" },
    { question: "What does StatefulWidget allow you to do?", options: ["Display static content", "Manage changing state in the UI", "Make network requests", "Handle animations only"], answer: "Manage changing state in the UI", subject: "flutter", difficulty: "medium" },
    { question: "Which widget is used to display scrollable lists in Flutter?", options: ["Container", "ListView", "Column", "GridView"], answer: "ListView", subject: "flutter", difficulty: "easy" },
    { question: "What is the purpose of the pubspec.yaml file in Flutter?", options: ["Storing user data", "Managing project dependencies and assets", "Configuring the server", "Writing Dart code"], answer: "Managing project dependencies and assets", subject: "flutter", difficulty: "easy" },
    { question: "Which state management solution is officially recommended by Flutter?", options: ["Redux", "MobX", "Provider", "GetX"], answer: "Provider", subject: "flutter", difficulty: "hard" },
    { question: "What is a Future in Dart?", options: ["A synchronous operation", "An asynchronous operation that returns a value", "A widget lifecycle method", "A build context"], answer: "An asynchronous operation that returns a value", subject: "flutter", difficulty: "medium" },
    { question: "Which widget creates a scrollable grid layout in Flutter?", options: ["ListView", "Stack", "GridView", "Wrap"], answer: "GridView", subject: "flutter", difficulty: "easy" },
    { question: "What does the BuildContext represent in Flutter?", options: ["Application theme", "Widget's location in the widget tree", "Network configuration", "Database connection"], answer: "Widget's location in the widget tree", subject: "flutter", difficulty: "hard" },
    { question: "How do you handle navigation in Flutter?", options: ["Using Intent", "Using Navigator and Routes", "Using href tags", "Using Segues"], answer: "Using Navigator and Routes", subject: "flutter", difficulty: "medium" },
    { question: "Which keyword is used for asynchronous functions in Dart?", options: ["sync", "async", "await only", "future"], answer: "async", subject: "flutter", difficulty: "medium" },
    { question: "What is the flutter run command used for?", options: ["Publishing the app", "Running the app on a device/emulator", "Compiling to native code", "Installing dependencies"], answer: "Running the app on a device/emulator", subject: "flutter", difficulty: "easy" },
    { question: "Which widget overlaps children on top of each other in Flutter?", options: ["Column", "Row", "Stack", "Wrap"], answer: "Stack", subject: "flutter", difficulty: "medium" },
    { question: "What is the Scaffold widget used for?", options: ["Displaying images", "Providing basic material design layout structure", "Handling gestures", "Managing animations"], answer: "Providing basic material design layout structure", subject: "flutter", difficulty: "easy" },
    { question: "What does FutureBuilder do in Flutter?", options: ["Builds widgets synchronously", "Builds widgets based on a Future's state", "Creates animation builders", "Handles user input"], answer: "Builds widgets based on a Future's state", subject: "flutter", difficulty: "hard" },
    { question: "Which method must be overridden in a StatelessWidget?", options: ["initState", "build", "dispose", "setState"], answer: "build", subject: "flutter", difficulty: "easy" },
    { question: "What is StreamBuilder used for in Flutter?", options: ["Database migrations", "Building UI from a stream of data", "Creating REST APIs", "Managing routes"], answer: "Building UI from a stream of data", subject: "flutter", difficulty: "hard" },
    { question: "Which platform does Flutter NOT natively support?", options: ["Android", "iOS", "Web", "Assembly"], answer: "Assembly", subject: "flutter", difficulty: "easy" },

    // ===== Cloud Computing - 20 questions =====
    { question: "Which cloud provider offers AWS?", options: ["Google", "Microsoft", "Amazon", "Apple"], answer: "Amazon", subject: "cloud computing", difficulty: "easy" },
    { question: "What does IaaS stand for?", options: ["Infrastructure as a Service", "Integration as a Service", "Information as a Service", "Internet as a Service"], answer: "Infrastructure as a Service", subject: "cloud computing", difficulty: "easy" },
    { question: "Which service provides managed databases in the cloud?", options: ["EC2", "S3", "RDS", "Lambda"], answer: "RDS", subject: "cloud computing", difficulty: "medium" },
    { question: "What is the primary advantage of cloud computing?", options: ["Local storage", "Scalability and cost efficiency", "More security", "Slower processing"], answer: "Scalability and cost efficiency", subject: "cloud computing", difficulty: "hard" },
    { question: "What does SaaS stand for?", options: ["Software as a Service", "Storage as a Service", "Server as a Service", "Security as a Service"], answer: "Software as a Service", subject: "cloud computing", difficulty: "easy" },
    { question: "Which AWS service is used for object storage?", options: ["EC2", "RDS", "S3", "VPC"], answer: "S3", subject: "cloud computing", difficulty: "easy" },
    { question: "What is a Virtual Machine (VM) in cloud computing?", options: ["A physical server", "An emulated computer system running on physical hardware", "A container", "A microservice"], answer: "An emulated computer system running on physical hardware", subject: "cloud computing", difficulty: "medium" },
    { question: "What does PaaS stand for?", options: ["Platform as a Service", "Protocol as a Service", "Performance as a Service", "Process as a Service"], answer: "Platform as a Service", subject: "cloud computing", difficulty: "easy" },
    { question: "Which cloud service model gives users the most control over infrastructure?", options: ["SaaS", "PaaS", "IaaS", "FaaS"], answer: "IaaS", subject: "cloud computing", difficulty: "medium" },
    { question: "What is serverless computing?", options: ["Computing without any servers", "Running code without managing servers", "Offline computing", "Edge computing"], answer: "Running code without managing servers", subject: "cloud computing", difficulty: "medium" },
    { question: "What is AWS Lambda?", options: ["A machine learning service", "A serverless compute service", "A storage service", "A database service"], answer: "A serverless compute service", subject: "cloud computing", difficulty: "medium" },
    { question: "Which cloud provider offers Azure?", options: ["Amazon", "Google", "Microsoft", "IBM"], answer: "Microsoft", subject: "cloud computing", difficulty: "easy" },
    { question: "What is auto-scaling in cloud computing?", options: ["Automatically deleting instances", "Automatically adjusting resource capacity based on demand", "Scaling databases manually", "Encrypting data automatically"], answer: "Automatically adjusting resource capacity based on demand", subject: "cloud computing", difficulty: "medium" },
    { question: "What is a CDN (Content Delivery Network) used for?", options: ["Database management", "Delivering content to users from geographically closer servers", "Source code management", "Containerization"], answer: "Delivering content to users from geographically closer servers", subject: "cloud computing", difficulty: "medium" },
    { question: "What is Docker used for in cloud computing?", options: ["Virtual machine management", "Containerizing applications", "DNS management", "Load balancing"], answer: "Containerizing applications", subject: "cloud computing", difficulty: "medium" },
    { question: "What is Kubernetes used for?", options: ["Object storage", "Container orchestration", "Serverless functions", "Database management"], answer: "Container orchestration", subject: "cloud computing", difficulty: "hard" },
    { question: "What is a cloud region?", options: ["A VPN connection", "A geographic area containing data centers", "A virtual network", "A billing unit"], answer: "A geographic area containing data centers", subject: "cloud computing", difficulty: "easy" },
    { question: "What is the shared responsibility model in cloud security?", options: ["Only the cloud provider is responsible", "Only the customer is responsible", "Both the provider and customer share security responsibilities", "No one is responsible"], answer: "Both the provider and customer share security responsibilities", subject: "cloud computing", difficulty: "hard" },
    { question: "Which protocol is commonly used for secure cloud communication?", options: ["HTTP", "FTP", "HTTPS/TLS", "SMTP"], answer: "HTTPS/TLS", subject: "cloud computing", difficulty: "medium" },
    { question: "What is a hybrid cloud?", options: ["Only private cloud", "Only public cloud", "Combination of private and public cloud", "A cloud without internet"], answer: "Combination of private and public cloud", subject: "cloud computing", difficulty: "medium" },

    // ===== NLP - 20 questions =====
    { question: "What does NLP stand for?", options: ["Natural Language Processing", "Neural Layer Protocol", "Network Language Processor", "None"], answer: "Natural Language Processing", subject: "nlp", difficulty: "easy" },
    { question: "Which technique is used to break text into words?", options: ["Lemmatization", "Tokenization", "Stemming", "Parsing"], answer: "Tokenization", subject: "nlp", difficulty: "medium" },
    { question: "What is the purpose of stop words removal in NLP?", options: ["Improve accuracy", "Remove common words that don't add meaning", "Encrypt data", "Compress data"], answer: "Remove common words that don't add meaning", subject: "nlp", difficulty: "hard" },
    { question: "Which Python library is popular for NLP tasks?", options: ["NumPy", "NLTK", "Pandas", "Matplotlib"], answer: "NLTK", subject: "nlp", difficulty: "medium" },
    { question: "What is stemming in NLP?", options: ["Translating text", "Reducing a word to its base/root form", "Generating new words", "Classifying sentences"], answer: "Reducing a word to its base/root form", subject: "nlp", difficulty: "medium" },
    { question: "What is sentiment analysis?", options: ["Counting words", "Identifying emotional tone in text", "Parsing grammar", "Translating text"], answer: "Identifying emotional tone in text", subject: "nlp", difficulty: "easy" },
    { question: "What does TF-IDF stand for?", options: ["Term Frequency-Inverse Document Frequency", "Text Feature-Identification Document Format", "Term Filter-Inverse Data Format", "None of the above"], answer: "Term Frequency-Inverse Document Frequency", subject: "nlp", difficulty: "hard" },
    { question: "Which model architecture revolutionized NLP in 2017?", options: ["RNN", "CNN", "Transformer", "LSTM"], answer: "Transformer", subject: "nlp", difficulty: "hard" },
    { question: "What is Named Entity Recognition (NER)?", options: ["Generating new names", "Identifying and classifying named entities in text", "Renaming files", "Parsing JSON"], answer: "Identifying and classifying named entities in text", subject: "nlp", difficulty: "medium" },
    { question: "What is a language model in NLP?", options: ["A grammar textbook", "A model that predicts the probability of word sequences", "A translation dictionary", "A sentiment classifier"], answer: "A model that predicts the probability of word sequences", subject: "nlp", difficulty: "hard" },
    { question: "What is Lemmatization?", options: ["Counting words in a sentence", "Reducing words to their base dictionary form", "Generating n-grams", "Splitting sentences"], answer: "Reducing words to their base dictionary form", subject: "nlp", difficulty: "medium" },
    { question: "What is a Bag of Words model?", options: ["A neural network", "A text representation using word frequency", "A grammar rule set", "A sequence model"], answer: "A text representation using word frequency", subject: "nlp", difficulty: "medium" },
    { question: "Which model is BERT based on?", options: ["RNN", "CNN", "LSTM", "Transformer"], answer: "Transformer", subject: "nlp", difficulty: "hard" },
    { question: "What is POS tagging in NLP?", options: ["Marking positions in code", "Labeling words with their grammatical role", "Parsing HTML", "Sorting text"], answer: "Labeling words with their grammatical role", subject: "nlp", difficulty: "medium" },
    { question: "What is a corpus in NLP?", options: ["A single document", "A large collection of text used for training", "A grammar rule", "A word embedding"], answer: "A large collection of text used for training", subject: "nlp", difficulty: "easy" },
    { question: "What are word embeddings?", options: ["Compressed text files", "Dense vector representations of words", "Grammar rules", "Stop word lists"], answer: "Dense vector representations of words", subject: "nlp", difficulty: "hard" },
    { question: "What does spaCy provide for NLP?", options: ["Image processing", "Industrial-strength NLP processing tools", "Game development libraries", "Web scraping tools"], answer: "Industrial-strength NLP processing tools", subject: "nlp", difficulty: "medium" },
    { question: "What is machine translation in NLP?", options: ["Translating code", "Automatically translating text from one language to another", "Encrypting messages", "Compressing text"], answer: "Automatically translating text from one language to another", subject: "nlp", difficulty: "easy" },
    { question: "What is an n-gram in NLP?", options: ["A type of neural network", "A contiguous sequence of n items from a text", "A grammar rule", "A tokenization method"], answer: "A contiguous sequence of n items from a text", subject: "nlp", difficulty: "medium" },
    { question: "What is text classification?", options: ["Sorting files alphabetically", "Assigning predefined categories to text", "Counting characters", "Parsing XML"], answer: "Assigning predefined categories to text", subject: "nlp", difficulty: "easy" },

    // ===== Machine Learning - 20 questions =====
    { question: "What is supervised learning?", options: ["Learning without labels", "Learning with labeled data", "Unsupervised learning", "Reinforcement learning"], answer: "Learning with labeled data", subject: "machine learning", difficulty: "easy" },
    { question: "Which algorithm is used for classification?", options: ["Linear Regression", "Decision Trees", "K-Means", "PCA"], answer: "Decision Trees", subject: "machine learning", difficulty: "medium" },
    { question: "What is the purpose of cross-validation?", options: ["Check for overfitting", "Validate the model", "Improve accuracy", "All of the above"], answer: "All of the above", subject: "machine learning", difficulty: "hard" },
    { question: "Which library is most popular for ML in Python?", options: ["TensorFlow", "Scikit-learn", "PyTorch", "All popular"], answer: "All popular", subject: "machine learning", difficulty: "medium" },
    { question: "What is overfitting in machine learning?", options: ["When a model performs well on training data but poorly on unseen data", "When training takes too long", "When the dataset is too small", "When the model is too simple"], answer: "When a model performs well on training data but poorly on unseen data", subject: "machine learning", difficulty: "medium" },
    { question: "What is unsupervised learning?", options: ["Learning with labeled data", "Learning without labeled data", "Learning through rewards", "Learning with partial labels"], answer: "Learning without labeled data", subject: "machine learning", difficulty: "easy" },
    { question: "Which algorithm is used for clustering?", options: ["Linear Regression", "Logistic Regression", "K-Means", "SVM"], answer: "K-Means", subject: "machine learning", difficulty: "medium" },
    { question: "What is a neural network?", options: ["A type of database", "A model inspired by the human brain with interconnected nodes", "A sorting algorithm", "A statistical formula"], answer: "A model inspired by the human brain with interconnected nodes", subject: "machine learning", difficulty: "easy" },
    { question: "What is gradient descent?", options: ["A regularization technique", "An optimization algorithm to minimize a loss function", "A clustering algorithm", "A dimensionality reduction method"], answer: "An optimization algorithm to minimize a loss function", subject: "machine learning", difficulty: "hard" },
    { question: "What does CNN stand for in deep learning?", options: ["Convolutional Neural Network", "Connected Node Network", "Compiled Neural Network", "Cyclic Node Network"], answer: "Convolutional Neural Network", subject: "machine learning", difficulty: "medium" },
    { question: "What is the purpose of a training set?", options: ["To evaluate the model", "To train and fit the model parameters", "To tune hyperparameters", "To deploy the model"], answer: "To train and fit the model parameters", subject: "machine learning", difficulty: "easy" },
    { question: "What is regularization used for?", options: ["Speeding up training", "Preventing overfitting", "Increasing model complexity", "Reducing dataset size"], answer: "Preventing overfitting", subject: "machine learning", difficulty: "hard" },
    { question: "What is a confusion matrix used for?", options: ["Visualizing decision trees", "Evaluating classification model performance", "Plotting regression lines", "Showing feature importance"], answer: "Evaluating classification model performance", subject: "machine learning", difficulty: "medium" },
    { question: "What is the bias-variance tradeoff?", options: ["Tradeoff between speed and accuracy", "Balance between underfitting (high bias) and overfitting (high variance)", "Tradeoff between precision and recall", "Memory vs computation tradeoff"], answer: "Balance between underfitting (high bias) and overfitting (high variance)", subject: "machine learning", difficulty: "hard" },
    { question: "Which algorithm is used for dimensionality reduction?", options: ["K-Means", "SVM", "PCA", "Decision Tree"], answer: "PCA", subject: "machine learning", difficulty: "hard" },
    { question: "What is reinforcement learning?", options: ["Learning with labeled examples", "Learning by trial and error using rewards and penalties", "Learning without any data", "Learning from clustering"], answer: "Learning by trial and error using rewards and penalties", subject: "machine learning", difficulty: "medium" },
    { question: "What is feature engineering?", options: ["Building neural networks", "Creating or transforming input variables to improve model performance", "Selecting the best algorithm", "Tuning hyperparameters"], answer: "Creating or transforming input variables to improve model performance", subject: "machine learning", difficulty: "medium" },
    { question: "What does LSTM stand for?", options: ["Long Short-Term Memory", "Linear Stochastic Training Model", "Large Scale Training Method", "Layered Semantic Text Model"], answer: "Long Short-Term Memory", subject: "machine learning", difficulty: "hard" },
    { question: "What is the purpose of the activation function in a neural network?", options: ["To initialize weights", "To introduce non-linearity into the network", "To normalize data", "To reduce learning rate"], answer: "To introduce non-linearity into the network", subject: "machine learning", difficulty: "hard" },
    { question: "What is transfer learning?", options: ["Moving data between servers", "Using a pretrained model's knowledge for a new related task", "Transferring model weights to a database", "Copying training data"], answer: "Using a pretrained model's knowledge for a new related task", subject: "machine learning", difficulty: "medium" }
  ];
  
    await Question.insertMany(sampleQuestions);
    console.log(`✅ Seeded ${sampleQuestions.length} sample questions`);
  } catch (err) {
    console.log("❌ Error seeding questions:", err.message);
  }
};


/* =========================
   🟢 BASIC ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("🚀 Backend Running");
});

app.get("/test", (req, res) => {
  res.json({ message: "✅ Backend is working" });
});

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
    const user = new User({ username, password: hashedPassword, role });
    await user.save();
    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.log("❌ REGISTER ERROR:", err.message);
    if (err.code === 11000) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: err.message || "Registration failed" });
    }
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
    res.json({ token, role: user.role });
  } catch (err) {
    console.log("❌ LOGIN ERROR:", err.message);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});


/* =========================
   🤖 AI GENERATE QUESTIONS (FIXED)
========================= */
// Create exam with random questions from database
app.post("/create-exam", async (req, res) => {
  try {
    const questions = await Question.aggregate([
      { $sample: { size: 5 } }
    ]);
    
    if (questions.length === 0) {
      return res.status(500).json({ error: "No questions in database" });
    }
    
    res.json(questions);
  } catch (err) {
    console.log("❌ EXAM CREATION ERROR:", err.message);
    res.status(500).json({ error: "Exam creation failed" });
  }
});

// Generate questions endpoint - returns 20 shuffled questions by subject
app.post("/generate-questions", async (req, res) => {
  try {
    const rawSubject = req.body.subject || req.body.difficulty || "";
    const subject = rawSubject.toString().trim();

    console.log("🔍 generate-questions request:", { subject, body: req.body });
    console.log("🔍 Available questions count:", await Question.countDocuments());

    if (!subject) {
      const allSubjects = await Question.distinct('subject');
      return res.status(400).json({
        error: "No subject provided",
        availableSubjects: allSubjects
      });
    }

    // Fetch all 20 questions for the subject (case-insensitive), shuffled randomly
    const dbQuestions = await Question.aggregate([
      { $match: { subject: { $regex: new RegExp(`^${subject}$`, 'i') } } },
      { $sample: { size: 20 } }  // random shuffle, up to 20
    ]);

    console.log(`✅ Found ${dbQuestions.length} questions for subject: "${subject}"`);
    if (dbQuestions.length > 0) {
      return res.json(dbQuestions);
    }

    const allSubjects = await Question.distinct('subject');
    console.log("📚 Available subjects:", allSubjects);

    return res.status(404).json({
      error: "No questions found",
      availableSubjects: allSubjects,
      requestedSubject: subject
    });
  } catch (err) {
    console.log("❌ QUESTIONS ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch questions: " + err.message });
  }
});

// 🔀 Shuffle function
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}


/* =========================
   ❓ ADD QUESTION
========================= */
app.post("/question", async (req, res) => {
  try {
    const q = new Question(req.body);
    await q.save();
    res.json({ message: "Question added", q });
  } catch (err) {
    res.status(500).json({ error: "Failed to add question" });
  }
});


/* =========================
   📚 GET QUESTIONS
========================= */
app.get("/questions", async (req, res) => {
  try {
    const data = await Question.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});


/* =========================
   📝 CREATE EXAM (RANDOM)
========================= */
app.post("/create-exam", async (req, res) => {
  try {
    const questions = await Question.aggregate([
      { $sample: { size: 5 } }
    ]);

    res.json(questions);
  } catch {
    res.status(500).json({ error: "Exam creation failed" });
  }
});


/* =========================
   📊 SAVE RESULT
========================= */
app.post("/result", async (req, res) => {
  try {
    const result = new Result(req.body);
    await result.save();
    res.json({ message: "Result saved", result });
  } catch {
    res.status(500).json({ error: "Result save failed" });
  }
});


/* =========================
   📊 GET RESULTS
========================= */
app.get("/results", async (req, res) => {
  try {
    const data = await Result.find();
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch results" });
  }
});


/* =========================
   🚀 START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});