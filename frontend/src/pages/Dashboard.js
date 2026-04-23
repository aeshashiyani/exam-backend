import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const nav = useNavigate();
  const role = localStorage.getItem("role") || "student";
  const username = localStorage.getItem("username");
  
  const [view, setView] = useState("overview"); // 'overview', 'students', 'manage-questions'
  const [facultyData, setFacultyData] = useState({ results: [], students: [], questions: 0 });
  const [loading, setLoading] = useState(true);
  
  // Faculty MCQ Form State
  const [selectedSubject, setSelectedSubject] = useState("");
  const [mcqs, setMcqs] = useState(Array(20).fill({ question: "", options: ["", "", "", ""], answer: "" }));
  const [formMsg, setFormMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Student Start Exam State
  const [examConfirm, setExamConfirm] = useState(null); // stores subject object

  const [allocatedSubjects, setAllocatedSubjects] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    if (role === "faculty") {
      fetchFacultyData();
      const stored = localStorage.getItem("subjects");
      if (stored) {
        try {
          setAllocatedSubjects(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse subjects", e);
        }
      }
    } else {
      setLoading(false);
    }
  }, [role, view]); // Re-run when view changes to ensure fresh state

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

  const handleMcqChange = (index, field, value, optIndex = null) => {
    const newMcqs = [...mcqs];
    if (field === "options") {
      const newOpts = [...newMcqs[index].options];
      newOpts[optIndex] = value;
      newMcqs[index] = { ...newMcqs[index], options: newOpts };
    } else {
      newMcqs[index] = { ...newMcqs[index], [field]: value };
    }
    setMcqs(newMcqs);
  };

  const submitMcqs = async () => {
    if (!selectedSubject) return setFormMsg("❌ Please select a subject");
    
    // Validate all fields
    const isInvalid = mcqs.some(q => !q.question || q.options.some(o => !o) || !q.answer);
    if (isInvalid) return setFormMsg("❌ Please fill all 20 questions and options");

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/add-questions`, {
        username,
        subject: selectedSubject,
        questions: mcqs
      });
      setFormMsg("✅ Successfully updated 20 questions!");
      fetchFacultyData();
      // Reset form msg after some time
      setTimeout(() => setFormMsg(""), 5000);
    } catch (err) {
      setFormMsg("❌ Failed to update: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

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

          <div className="view-switcher">
            <button className={`view-btn ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}>Overview</button>
            <button className={`view-btn ${view === "students" ? "active" : ""}`} onClick={() => setView("students")}>Students</button>
            <button className={`view-btn ${view === "manage-questions" ? "active" : ""}`} onClick={() => setView("manage-questions")}>Add MCQs</button>
          </div>

          <div className="content-area">
            {view === "overview" && (
              <div className="results-section glass-card">
                <h2>Recent Exam Results</h2>
                <div className="results-table-container">
                  <table className="results-table">
                    <thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Date</th></tr></thead>
                    <tbody>
                      {facultyData.results.map((res, i) => (
                        <tr key={i}>
                          <td><strong>{res.username}</strong></td>
                          <td><span className="badge">{res.subject.toUpperCase()}</span></td>
                          <td className="score-cell">{res.score} / {res.total}</td>
                          <td>{res.createdAt ? new Date(parseInt(res.createdAt)).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                      {facultyData.results.length === 0 && (
                        <tr><td colSpan="4" className="empty-msg">No results recorded yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "students" && (
              <div className="results-section glass-card">
                <h2>Student Registry</h2>
                <div className="results-table-container">
                  <table className="results-table">
                    <thead><tr><th>Username</th><th>Created</th><th>Exams</th></tr></thead>
                    <tbody>
                      {facultyData.students.map((stu, i) => (
                        <tr key={i}>
                          <td><strong>{stu.username}</strong></td>
                          <td>{new Date(stu.createdAt).toLocaleDateString()}</td>
                          <td>{facultyData.results.filter(r => r.username === stu.username).length} Taken</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {view === "manage-questions" && (
              <div className="question-form-container glass-card">
                <h2>Update MCQs (Exactly 20)</h2>
                <div className="subject-selector">
                  <label>Select Your Allocated Subject: </label>
                  <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="answer-select" style={{ width: '250px', display: 'inline-block', marginLeft: '10px' }}>
                    <option value="">-- Choose Subject --</option>
                    {allocatedSubjects.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="questions-list">
                  {mcqs.map((q, i) => (
                    <div key={i} className="question-block">
                      <h4>Question {i + 1}</h4>
                      <input 
                        className="question-input" 
                        placeholder="Enter question text..." 
                        value={q.question} 
                        onChange={(e) => handleMcqChange(i, "question", e.target.value)}
                      />
                      <div className="options-grid-form">
                        {q.options.map((opt, j) => (
                          <input 
                            key={j} 
                            className="option-input" 
                            placeholder={`Option ${j + 1}`} 
                            value={opt} 
                            onChange={(e) => handleMcqChange(i, "options", e.target.value, j)}
                          />
                        ))}
                      </div>
                      <select 
                        className="answer-select" 
                        value={q.answer} 
                        onChange={(e) => handleMcqChange(i, "answer", e.target.value)}
                      >
                        <option value="">-- Select Correct Answer --</option>
                        {q.options.map((opt, j) => opt && <option key={j} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="form-actions">
                  {formMsg && <div style={{ marginRight: '20px', padding: '15px', borderRadius: '10px', background: formMsg.includes('✅') ? '#ecfdf5' : '#fef2f2', color: formMsg.includes('✅') ? '#059669' : '#dc2626' }}>{formMsg}</div>}
                  <button className="btn-confirm" onClick={submitMcqs} disabled={submitting}>
                    {submitting ? "Uploading..." : "Publish 20 Questions"}
                  </button>
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
                onClick={() => setExamConfirm(subj)}
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

          {examConfirm && (
            <div className="start-exam-overlay">
              <div className="start-exam-card">
                <h2>{examConfirm.name} Exam</h2>
                <p>Are you ready to begin your assessment? Please review the details below:</p>
                <div className="exam-info-box">
                  <div className="exam-info-item"><span>Total Questions:</span> <span>20</span></div>
                  <div className="exam-info-item"><span>Time Limit:</span> <span>10 Minutes</span></div>
                  <div className="exam-info-item"><span>Passing Score:</span> <span>50%</span></div>
                </div>
                <div className="overlay-actions">
                  <button className="btn-cancel" onClick={() => setExamConfirm(null)}>Cancel</button>
                  <button className="btn-confirm" onClick={() => {
                    localStorage.setItem("selectedSubject", examConfirm.id);
                    nav("/exam", { state: { subject: examConfirm.id } });
                  }}>Start Exam</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;