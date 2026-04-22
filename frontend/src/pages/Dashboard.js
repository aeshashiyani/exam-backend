import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const nav = useNavigate();
  const role = localStorage.getItem("role") || "student";
  const [subject, setSubject] = useState("ios");
  const [facultyData, setFacultyData] = useState({ results: [], students: 0, questions: 0 });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    console.log("🛠️ Dashboard initialized for role:", role);
    if (role === "faculty") {
      fetchFacultyData();
    } else {
      console.log("✅ Student role detected, stopping loader.");
      setLoading(false);
    }
  }, [role]);

  const fetchFacultyData = async () => {
    console.log("📡 Fetching faculty data from:", API_URL || "Relative Path");
    try {
      console.log("🔄 Calling /results...");
      const resResults = await axios.get(`${API_URL}/results`);
      console.log("✅ Results fetched:", resResults.data.length);

      console.log("🔄 Calling /students...");
      const resStudents = await axios.get(`${API_URL}/students`);
      console.log("✅ Students fetched:", resStudents.data.length);

      console.log("🔄 Calling /questions...");
      const resQuestions = await axios.get(`${API_URL}/questions`);
      console.log("✅ Questions fetched:", resQuestions.data.length);

      setFacultyData({
        results: resResults.data,
        students: resStudents.data.length,
        questions: resQuestions.data.length
      });
    } catch (err) {
      console.error("❌ ERROR: Failed to fetch faculty data", err);
    } finally {
      console.log("🏁 Loading finished.");
      setLoading(false);
    }
  };

  const subjects = [
    { id: "ios", name: "iOS", description: "Swift & iOS Development" },
    { id: "flutter", name: "Flutter", description: "Cross-platform development" },
    { id: "cloud computing", name: "Cloud Computing", description: "AWS, Azure, GCP" },
    { id: "nlp", name: "Natural Language Processing", description: "Text & Language" },
    { id: "machine learning", name: "Machine Learning", description: "AI & Algorithms" }
  ];

  const startExam = () => {
    localStorage.setItem("selectedSubject", subject);
    nav("/exam", { state: { subject } });
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Loading Dashboard for {role}...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Navbar />

      {role === "faculty" ? (
        <div className="faculty-view">
          <div className="dashboard-header">
            <h1>Faculty Command Center</h1>
            <p>Monitor student performance and manage exam content</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Students</h3>
              <div className="stat-value">{facultyData.students}</div>
            </div>
            <div className="stat-card">
              <h3>Question Bank</h3>
              <div className="stat-value">{facultyData.questions}</div>
            </div>
            <div className="stat-card">
              <h3>Exams Completed</h3>
              <div className="stat-value">{facultyData.results.length}</div>
            </div>
          </div>

          <div className="results-section">
            <h2>Student Results Overview</h2>
            <div className="results-table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {facultyData.results.map((res, i) => (
                    <tr key={i}>
                      <td>{res.username}</td>
                      <td>{res.subject.toUpperCase()}</td>
                      <td>{res.score}/{res.total}</td>
                      <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {facultyData.results.length === 0 && (
                    <tr>
                      <td colSpan="4">No results recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="student-view">
          <div className="dashboard-header">
            <h1>Select Your Subject</h1>
            <p>Choose a subject to start your exam - 20 questions, 10 minutes</p>
          </div>

          <div className="subjects-grid">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className={`subject-card ${subject === subj.id ? "active" : ""}`}
                onClick={() => setSubject(subj.id)}
              >
                <div className="subject-title">{subj.name}</div>
                <div className="subject-description">{subj.description}</div>
              </div>
            ))}
          </div>

          <div className="exam-info">
            <div className="info-item">
              <span>Questions:</span>
              <strong>20</strong>
            </div>
            <div className="info-item">
              <span>Time Limit:</span>
              <strong>10 Minutes</strong>
            </div>
            <div className="info-item">
              <span>Selected:</span>
              <strong>{subjects.find(s => s.id === subject)?.name}</strong>
            </div>
          </div>

          <div className="dashboard-actions">
            <button className="btn-start" onClick={startExam}>
              Start Exam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;