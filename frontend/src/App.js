// // // // import React, { useEffect, useState } from "react";
// // // // import axios from "axios";

// // // // // 🔥 Replace with your Render URL
// // // // const API = "https://exam-backend.onrender.com";

// // // // function App() {
// // // //   const [students, setStudents] = useState([]);
// // // //   const [name, setName] = useState("");
// // // //   const [loading, setLoading] = useState(false);

// // // //   // 📄 Fetch students
// // // //   const fetchStudents = async () => {
// // // //     try {
// // // //       const res = await axios.get(`${API}/students`);
// // // //       setStudents(res.data);
// // // //     } catch (error) {
// // // //       console.error("Error fetching students:", error);
// // // //     }
// // // //   };

// // // //   // ➕ Add student
// // // //   const addStudent = async () => {
// // // //     if (!name.trim()) {
// // // //       alert("Please enter a name");
// // // //       return;
// // // //     }

// // // //     try {
// // // //       setLoading(true);
// // // //       await axios.post(`${API}/student`, { name });
// // // //       setName("");
// // // //       fetchStudents();
// // // //     } catch (error) {
// // // //       console.error("Error adding student:", error);
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   };

// // // //   // 🔄 Load data on start
// // // //   useEffect(() => {
// // // //     fetchStudents();
// // // //   }, []);

// // // //   return (
// // // //     <div style={{ padding: 20 }}>
// // // //       <h1>Exam System</h1>

// // // //       <input
// // // //         placeholder="Enter student name"
// // // //         value={name}
// // // //         onChange={(e) => setName(e.target.value)}
// // // //       />

// // // //       <button onClick={addStudent} disabled={loading}>
// // // //         {loading ? "Adding..." : "Add"}
// // // //       </button>

// // // //       <h3>Student List:</h3>
// // // //       <ul>
// // // //         {students.map((s) => (
// // // //           <li key={s.id}>{s.name}</li>
// // // //         ))}
// // // //       </ul>
// // // //     </div>
// // // //   );
// // // // }

// // // // export default App;

// // // import React, { useEffect, useState } from "react";
// // // import axios from "axios";

// // // const API = "https://exam-backend-8w9z.onrender.com";

// // // function App() {
// // //   const [questions, setQuestions] = useState([]);
// // //   const [answers, setAnswers] = useState([]);

// // //   useEffect(() => {
// // //     axios.get(`${API}/questions`)
// // //       .then(res => setQuestions(res.data))
// // //       .catch(err => console.log(err));
// // //   }, []);

// // //   const handleChange = (index, value) => {
// // //     const newAns = [...answers];
// // //     newAns[index] = value;
// // //     setAnswers(newAns);
// // //   };

// // //   const submitExam = async () => {
// // //     const res = await axios.post(`${API}/submit`, { answers });
// // //     alert(`Score: ${res.data.score}/${res.data.total}`);
// // //   };

// // //   return (
// // //     <div style={{ padding: 20 }}>
// // //       <h1>Online Exam System</h1>

// // //       {questions.map((q, i) => (
// // //         <div key={i} style={{ marginBottom: 20 }}>
// // //           <h3>{q.question}</h3>

// // //           {q.options.map((opt, j) => (
// // //             <div key={j}>
// // //               <input
// // //                 type="radio"
// // //                 name={`q${i}`}
// // //                 onChange={() => handleChange(i, opt)}
// // //               />
// // //               {opt}
// // //             </div>
// // //           ))}
// // //         </div>
// // //       ))}

// // //       <button onClick={submitExam}>Submit Exam</button>
// // //     </div>
// // //   );
// // // }

// // // export default App;

// // import React, { useEffect, useState } from "react";
// // import axios from "axios";

// // const BASE_URL = "https://exam-backend-8w9z.onrender.com";

// // function App() {
// //   const [students, setStudents] = useState([]);
// //   const [name, setName] = useState("");
// //   const [questions, setQuestions] = useState([]);

// //   // Fetch students
// //   const fetchStudents = async () => {
// //     const res = await axios.get(`${BASE_URL}/students`);
// //     setStudents(res.data);
// //   };

// //   // Add student
// //   const addStudent = async () => {
// //     await axios.post(`${BASE_URL}/student`, { name });
// //     setName("");
// //     fetchStudents();
// //   };

// //   // Generate AI questions
// //   const generateQuestions = async () => {
// //     const res = await axios.post(`${BASE_URL}/generate-questions`, {
// //       subject: "Java",
// //       difficulty: "easy"
// //     });

// //     setQuestions(res.data);
// //   };

// //   // Save questions
// //   const saveQuestions = async () => {
// //     await axios.post(`${BASE_URL}/save-questions`, questions);
// //     alert("Saved to DB");
// //   };

// //   useEffect(() => {
// //     fetchStudents();
// //   }, []);

// //   return (
// //     <div style={{ padding: 20 }}>
// //       <h1>🎓 Smart Exam System</h1>

// //       {/* Student Section */}
// //       <h2>Add Student</h2>
// //       <input
// //         value={name}
// //         onChange={(e) => setName(e.target.value)}
// //         placeholder="Enter name"
// //       />
// //       <button onClick={addStudent}>Add</button>

// //       <h3>Student List</h3>
// //       <ul>
// //         {students.map((s, i) => (
// //           <li key={i}>{s.name}</li>
// //         ))}
// //       </ul>

// //       <hr />

// //       {/* AI Section */}
// //       <h2>🤖 AI Question Generator</h2>

// //       <button onClick={generateQuestions}>
// //         Generate Questions
// //       </button>

// //       <button onClick={saveQuestions}>
// //         Save Questions
// //       </button>

// //       <ul>
// //         {questions.map((q, i) => (
// //           <li key={i}>
// //             <b>{q.question}</b>
// //             <ul>
// //               {q.options.map((opt, idx) => (
// //                 <li key={idx}>{opt}</li>
// //               ))}
// //             </ul>
// //             <p>Answer: {q.answer}</p>
// //           </li>
// //         ))}
// //       </ul>
// //     </div>
// //   );
// // }

// // export default App;

// import React, { useState } from "react";
// import axios from "axios";

// const API = "http://localhost:5000"; // change if deployed

// function App() {
//   const [questions, setQuestions] = useState([]);
//   const [answers, setAnswers] = useState([]);
//   const [score, setScore] = useState(null);

//   // 🔥 Generate from AI
//   const generateQuestions = async () => {
//     try {
//       const res = await axios.post(`${API}/generate-questions`, {
//         subject: "Math",
//         difficulty: "easy"
//       });

//       setQuestions(res.data);
//       setAnswers([]);
//       setScore(null);
//     } catch (err) {
//       console.log(err);
//       alert("AI failed");
//     }
//   };

//   // select answer
//   const handleSelect = (qIndex, option) => {
//     const newAnswers = [...answers];
//     newAnswers[qIndex] = option;
//     setAnswers(newAnswers);
//   };

//   // submit exam
//   const submitExam = () => {
//     let correct = 0;

//     questions.forEach((q, i) => {
//       if (answers[i] === q.answer) {
//         correct++;
//       }
//     });

//     setScore(correct);
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>📝 Online Exam System</h1>

//       {/* 🔥 NEW BUTTON */}
//       <button onClick={generateQuestions}>
//         Generate Questions (AI)
//       </button>

//       <br /><br />

//       {questions.map((q, i) => (
//         <div key={i} style={{ marginBottom: 20 }}>
//           <h3>{i + 1}. {q.question}</h3>

//           {q.options.map((opt, j) => (
//             <div key={j}>
//               <input
//                 type="radio"
//                 name={`q${i}`}
//                 onChange={() => handleSelect(i, opt)}
//               />
//               {opt}
//             </div>
//           ))}
//         </div>
//       ))}

//       {questions.length > 0 && (
//         <button onClick={submitExam}>Submit Exam</button>
//       )}

//       {score !== null && (
//         <h2>🎯 Score: {score} / {questions.length}</h2>
//       )}
//     </div>
//   );
// }

// export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Exam from "./pages/Exam";
import Result from "./pages/Result";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/result" element={<Result />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

 