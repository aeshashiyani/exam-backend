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
        students: resStudents.data.length,
        questions: resQuestions.data.length
      });
    } catch (err) {
      console.error("Failed to fetch faculty data", err);
    } finally {
      setLoading(false);
    }
  };

  const subjects = [
    { id: "ios", name: "iOS Development", description: "Swift & Xcode Mastery", icon: "/assets/ios.png" },
    { id: "flutter", name: "Flutter", description: "Modern Cross-Platform SDK", icon: "/assets/flutter.png" },
    { id: "cloud computing", name: "Cloud Infrastructure", description: "AWS & Distributed Systems", icon: "/assets/cloud.png" },
    { id: "nlp", name: "Language AI", description: "Natural Language Processing", icon: "/assets/nlp.png" },
    { id: "machine learning", name: "Machine Learning", description: "Predictive AI & Algorithms", icon: "/assets/ml.png" }
  ];

  const startExam = () => {
    localStorage.setItem("selectedSubject", subject);
    nav("/exam", { state: { subject } });
  };

  if (loading) return (
    <div className="classic-loader">
      <div className="pulse-ring"></div>
      <p>Synchronizing with Cloud...</p>
    </div>
  );

  return (
    <div className="dashboard-root">
      <Navbar />
      
      <main className="dashboard-content">
        {role === "faculty" ? (
          <div className="faculty-portal animate-in">
            <header className="portal-header">
              <span className="badge">Faculty Command Center</span>
              <h1>Executive Overview</h1>
              <p>Performance analytics and system-wide monitoring</p>
            </header>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Registered Students</div>
                <div className="metric-value">{facultyData.students}</div>
                <div className="metric-trend up">Live Connection</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total Question Bank</div>
                <div className="metric-value">{facultyData.questions}</div>
                <div className="metric-trend">Curated Set</div>
              </div>
              <div className="metric-card highlight">
                <div className="metric-label">Exams Completed</div>
                <div className="metric-value">{facultyData.results.length}</div>
                <div className="metric-trend up">Active Sessions</div>
              </div>
            </div>

            <section className="data-table-section">
              <div className="section-header">
                <h2>Live Student Records</h2>
              </div>
              <div className="classic-table-wrapper">
                <table className="classic-table">
                  <thead>
                    <tr>
                      <th>STUDENT IDENTITY</th>
                      <th>SUBJECT SPECIALIZATION</th>
                      <th>FINAL SCORE</th>
                      <th>TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyData.results.map((res, i) => (
                      <tr key={i}>
                        <td className="user-cell">{res.username}</td>
                        <td className="subject-cell"><span>{res.subject.toUpperCase()}</span></td>
                        <td className="score-cell"><strong>{res.score}</strong>/{res.total}</td>
                        <td className="date-cell">{new Date(res.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {facultyData.results.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty-state">No academic records found in the current cluster.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="student-portal animate-in">
            <header className="portal-header">
              <span className="badge">Student Assessment Portal</span>
              <h1>Choose Your Domain</h1>
              <p>Select a specialized track to begin your certification assessment</p>
            </header>

            <div className="classic-grid">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  className={`classic-card ${subject === subj.id ? "selected" : ""}`}
                  onClick={() => setSubject(subj.id)}
                >
                  <div className="card-image-wrapper">
                    <img src={subj.icon} alt={subj.name} />
                  </div>
                  <div className="card-details">
                    <h3>{subj.name}</h3>
                    <p>{subj.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <footer className="assessment-footer">
              <div className="assessment-meta">
                <div className="meta-pill">20 Questions</div>
                <div className="meta-pill">10 Minutes</div>
                <div className="meta-pill active">{subjects.find(s => s.id === subject)?.name}</div>
              </div>
              <button className="btn-classic-start" onClick={startExam}>
                Initialize Assessment
              </button>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;