import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const nav = useNavigate();

  const [subject, setSubject] = useState("ios");

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

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    nav("/login");
  };

  return (
    <div className="dashboard-container">
      <Navbar />
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
          <strong>{subjects.find(s => s.id === subject)?.name.split(" ")[1]}</strong>
        </div>
      </div>

      <div className="dashboard-actions">
        <button className="btn-start" onClick={startExam}>
          Start Exam
        </button>
        <button className="btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Dashboard;