require("dotenv").config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Fix for querySrv ECONNREFUSED

const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

const StudentSchema = new mongoose.Schema({
  username: String,
}, { collection: 'students' });

const Student = mongoose.model("Student", StudentSchema);

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📡 Connected to DB for cleanup...");

    // Delete students with empty, null, or missing username
    const result = await Student.deleteMany({
      $or: [
        { username: "" },
        { username: null },
        { username: { $exists: false } }
      ]
    });

    console.log(`✅ SUCCESS: Removed ${result.deletedCount} blank student records.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err.message);
    process.exit(1);
  }
}

cleanup();
