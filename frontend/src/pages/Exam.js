// import { useLocation, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import Navbar from "../components/Navbar";
// import QuestionCard from "../components/QuestionCard";

// function Exam() {
//   const { state } = useLocation();
//   const nav = useNavigate();

//   const [questions, setQuestions] = useState([]);
//   const [answers, setAnswers] = useState([]);
//   const [time, setTime] = useState(60);

//   // 🔥 Fetch AI questions
//   useEffect(() => {
//     axios.post("http://localhost:5000/generate-questions", {
//       subject: state.subject,
//       difficulty: state.difficulty
//     })
//     .then(res => setQuestions(res.data))
//     .catch(err => {
//       console.log(err);
//       alert("AI failed");
//     });
//   }, []);

//   // ⏱ Timer
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setTime(t => {
//         if (t === 1) submitExam();
//         return t - 1;
//       });
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   const selectAnswer = (i, opt) => {
//     const arr = [...answers];
//     arr[i] = opt;
//     setAnswers(arr);
//   };

//   const submitExam = () => {
//     let score = 0;
//     questions.forEach((q, i) => {
//       if (answers[i] === q.answer) score++;
//     });

//     nav("/result", {
//       state: { score, total: questions.length }
//     });
//   };

//   return (
//     <>
//       <Navbar />
//       <div style={{ padding: 20 }}>
//         <h2>⏱ Time Left: {time}s</h2>

//         {questions.map((q, i) => (
//           <QuestionCard
//             key={i}
//             question={q}
//             index={i}
//             onSelect={selectAnswer}
//           />
//         ))}

//         {questions.length > 0 && (
//           <button onClick={submitExam}>Submit Exam</button>
//         )}
//       </div>
//     </>
//   );
// }

// export default Exam;

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import QuestionCard from "../components/QuestionCard";
import "./Exam.css";

function Exam() {
  const location = useLocation();
  const nav = useNavigate();

  const initialSubject = location.state?.subject || localStorage.getItem("selectedSubject") || "";
  const [subject, setSubject] = useState(initialSubject);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [time, setTime] = useState(600); // 10 minutes = 600 seconds
  const [loading, setLoading] = useState(true);

  // 🔥 Decode HTML (for free APIs like OpenTrivia)
  const decodeHTML = (str) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
  };

  const API_URL = process.env.REACT_APP_API_URL || "";

  // 🔥 Fetch Questions
  useEffect(() => {
    if (!subject) {
      alert("Missing exam details");
      nav("/dashboard");
      return;
    }

    console.log("Fetching questions for subject:", subject);

    axios.post(`${API_URL}/generate-questions`, {
      subject
    })
      .then(res => {
        console.log("✅ Questions loaded:", res.data);
        setQuestions(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error loading questions:", err);
        alert("Failed to load questions. Is the backend running?");
        setLoading(false);
      });
  }, [subject, API_URL]);

  // ⏱ Timer
  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

  // ✅ Select Answer
  const selectAnswer = (i, opt) => {
    const arr = [...answers];
    arr[i] = opt;
    setAnswers(arr);
  };

  // ✅ Submit Exam
  const submitExam = () => {
    let score = 0;

    questions.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });

    // 🔥 Save result to Atlas
    console.log("Saving result to cloud...");
    axios.post(`${API_URL}/result`, {
      score,
      total: questions.length,
      subject: localStorage.getItem("selectedSubject") || "General",
      username: (localStorage.getItem("username") && localStorage.getItem("username") !== "undefined") 
                ? localStorage.getItem("username") 
                : "Student"
    })
      .then(() => console.log("✅ Result saved!"))
      .catch((err) => console.error("❌ Save failed:", err.message));

    nav("/result", {
      state: { score, total: questions.length }
    });
  };

  // ⏳ Loading UI
  if (loading) {
    return (
      <div className="exam-container">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner">
            <h2>📚 Loading Questions...</h2>
            <p>Please wait while we prepare your exam</p>
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timerClass = time <= 60 ? "timer-warning" : "";

  return (
    <div className="exam-container">
      <Navbar />
      <div className="exam-header">
        <h2 className="exam-title">Exam in Progress</h2>
        <div className={`exam-timer ${timerClass}`}>
          <span>Time Left:</span>
          <div className={`timer-value ${timerClass}`}>
            {formatTime(time)}
          </div>
        </div>
        <div className="question-counter">
          Question {questions.findIndex(q => !answers[questions.indexOf(q)] || answers[questions.indexOf(q)] !== q.answer) + 1} / {questions.length}
        </div>
      </div>

      <div className="questions-container">
        {questions.map((q, i) => (
          <div key={i} className="question-wrapper">
            <div className="question-number">Question {i + 1} of {questions.length}</div>
            <div className="question-text">
              {decodeHTML(q.question)}
            </div>
            <div className="options-grid">
              {q.options.map((option, idx) => (
                <button
                  key={idx}
                  className={`option-button ${answers[i] === option ? "selected" : ""}`}
                  onClick={() => selectAnswer(i, option)}
                >
                  {decodeHTML(option)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="exam-actions">
        {questions.length > 0 && (
          <button className="btn-submit" onClick={submitExam}>
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}

export default Exam;