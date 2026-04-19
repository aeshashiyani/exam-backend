import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Result.css";

function Result() {
  const { state } = useLocation();
  const nav = useNavigate();

  if (!state) {
    return (
      <div className="result-container">
        <Navbar />
        <div className="result-error">
          <h2>No exam data found</h2>
          <button className="btn-action" onClick={() => nav("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { score = 0, total = 20 } = state;
  const percentage = Math.round((score / total) * 100);
  const isPassed = percentage >= 60;

  const getPerformanceMessage = () => {
    if (percentage === 100) return "Perfect Score!";
    if (percentage >= 80) return "Excellent Performance!";
    if (percentage >= 60) return "Good Job!";
    if (percentage >= 40) return "Keep Practicing";
    return "Need Improvement";
  };

  const getColorClass = () => {
    if (percentage >= 80) return "excellent";
    if (percentage >= 60) return "good";
    if (percentage >= 40) return "average";
    return "poor";
  };

  return (
    <div className="result-container">
      <Navbar />
      <div className="result-card">
        <div className="result-header">
          <h1>Exam Results</h1>
          <p>Here's how you performed</p>
        </div>

        <div className={`result-score ${getColorClass()}`}>
          <div className="score-display">
            <div className="score-number">{score}</div>
            <div className="score-divider">/</div>
            <div className="total-number">{total}</div>
          </div>
          <div className="percentage">{percentage}%</div>
        </div>

        <div className="performance-section">
          <h2 className={`performance-message ${getColorClass()}`}>
            {getPerformanceMessage()}
          </h2>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Correct Answers</div>
              <div className="stat-value correct">{score}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Wrong Answers</div>
              <div className="stat-value wrong">{total - score}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Success Rate</div>
              <div className="stat-value">{percentage}%</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Questions</div>
              <div className="stat-value">{total}</div>
            </div>
          </div>
        </div>

        <div className="result-actions">
          <button className="btn-action btn-primary" onClick={() => nav("/dashboard")}>
            Back to Dashboard
          </button>
          <button className="btn-action btn-secondary" onClick={() => nav("/exam", { state: { subject: "ios" } })}>
            Try Another Exam
          </button>
        </div>

        {isPassed && (
          <div className="success-message">
            <p>Congratulations! You have passed the exam!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Result;