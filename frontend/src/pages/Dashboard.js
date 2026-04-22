import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const nav = useNavigate();
  const role = localStorage.getItem("role") || "student";
  const [view, setView] = useState("overview"); // 'overview' or 'students'
  const [facultyData, setFacultyData] = useState({ results: [], students: [], questions: 0 });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    console.log("🛠️ Dashboard initialized for role:", role);
    if (role === "faculty") {
      fetchFacultyData();
    } else {
      setLoading(false);
    }
  }, [role]);

  const fetchFacultyData = async () => {
    try {
      const [resResults, resStudents, resQuestions] = await Promise.all([
        axios.get(`${API_URL}/results`),
        axios.get(`${API_URL}/students`),
        axios.get(`${API_URL}/questions`)
      ]);
      setFacultyData({
        results: resResults.data,
        students: resStudents.data,
        questions: resQuestions.data.length
      });
    } catch (err) {
      console.error("❌ ERROR: Failed to fetch faculty data", err);
    } finally {
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

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p>Syncing Dashboard...</p>
    </div>
  );

  return (
    <div className="dashboard-container">
      <Navbar />

      {role === "faculty" ? (
        <div className="faculty-view">
          <div className="dashboard-header">
            <h1>Faculty Command Center</h1>
            <p>Monitor student performance and manage platform resources</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Active Students</h3>
              <div className="stat-value">{facultyData.students.length}</div>
            </div>
            <div className="stat-card">
              <h3>Question Bank</h3>
              <div className="stat-value">{facultyData.questions}</div>
            </div>
            <div className="stat-card">
              <h3>Exams Taken</h3>
              <div className="stat-value">{facultyData.results.length}</div>
            </div>
          </div>

          {/* Senior Dev Tabs */}
          <div className="view-switcher">
            <button 
              className={`view-btn ${view === "overview" ? "active" : ""}`}
              onClick={() => setView("overview")}
            >
              Performance Overview
            </button>
            <button 
              className={`view-btn ${view === "students" ? "active" : ""}`}
              onClick={() => setView("students")}
            >
              Student Registry
            </button>
          </div>

          <div className="content-area">
            {view === "overview" ? (
              <div className="results-section glass-card">
                <h2>Recent Exam Results</h2>
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Date Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyData.results.map((res, i) => (
                        <tr key={i}>
                          <td><strong>{res.username}</strong></td>
                          <td><span className="badge">{res.subject.toUpperCase()}</span></td>
                          <td className="score-cell">{res.score} / {res.total}</td>
                          <td>{new Date(res.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      {facultyData.results.length === 0 && (
                        <tr><td colSpan="4" className="empty-msg">No results recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="results-section glass-card">
                <h2>Registered Student List</h2>
                <div className="results-table-container">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Account Created</th>
                        <th>Total Exams Taken</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyData.students.map((stu, i) => (
                        <tr key={i}>
                          <td><strong>{stu.username}</strong></td>
                          <td>{new Date(stu.createdAt).toLocaleDateString()}</td>
                          <td>
                            {facultyData.results.filter(r => r.username === stu.username).length} Exams
                          </td>
                        </tr>
                      ))}
                      {facultyData.students.length === 0 && (
                        <tr><td colSpan="3" className="empty-msg">No students registered yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="student-view">
          <div className="dashboard-header">
            <h1>Select Your Exam</h1>
            <p>Choose a specialized topic to begin your assessment</p>
          </div>

          <div className="subjects-grid">
            {subjects.map((subj) => (
              <div
                key={subj.id}
                className={`subject-card ${localStorage.getItem("selectedSubject") === subj.id ? "active" : ""}`}
                onClick={() => {
                  localStorage.setItem("selectedSubject", subj.id);
                  nav("/exam", { state: { subject: subj.id } });
                }}
              >
                <div className="subject-title">{subj.name}</div>
                <div className="subject-description">{subj.description}</div>
                <div className="card-footer">
                  <span>20 Questions</span>
                  <span>10 Mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;