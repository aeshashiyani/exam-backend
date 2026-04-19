import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";
import "./Result.css"; // Reuse the same premium styling

function Profile() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`${API_URL}/results`);
        const currentUser = localStorage.getItem("username");

        // Match current user OR the default "Student" name to ensure results appear
        const userResults = res.data.filter(r =>
          r.username === currentUser ||
          r.username === "Student" ||
          !r.username ||
          r.username === "undefined"
        );

        setResults(userResults);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [API_URL]);

  return (
    <div className="result-container">
      <Navbar />
      <div className="result-card" style={{ maxWidth: "800px", marginTop: "40px" }}>
        <div className="result-header">
          <h1>My Exam History</h1>
          <p>View all your past performances</p>
        </div>

        {loading ? (
          <div className="message">Loading your history...</div>
        ) : results.length === 0 ? (
          <div className="message">No exams taken yet. Go start one!</div>
        ) : (
          <div className="history-list">
            {results.map((r, i) => (
              <div key={i} className="stat-item" style={{
                textAlign: "left",
                marginBottom: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                background: "#fdfdfd",
                borderRadius: "12px",
                borderBottom: "1px solid #eee"
              }}>
                <div>
                  <div style={{ fontSize: "1.3em", fontWeight: "bold", color: "#1a1a1a", textTransform: "capitalize", marginBottom: "4px" }}>
                    {r.subject}
                  </div>
                  <div style={{ fontSize: "0.85em", color: "#888", fontWeight: "500" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: "1.4em", fontWeight: "bold", color: "#d32f2f" }}>
                  {r.score} / {r.total} ({Math.round((r.score / r.total) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="result-actions" style={{ marginTop: "30px" }}>
          <button
            className="btn-action"
            onClick={() => nav("/dashboard")}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
