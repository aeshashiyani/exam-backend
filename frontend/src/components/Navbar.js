import { useNavigate } from "react-router-dom";

function Navbar() {
  const nav = useNavigate();

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 20px",
      background: "#222",
      color: "#fff"
    }}>
      <h2 style={{ cursor: "pointer" }} onClick={() => nav("/dashboard")}>
        Exam System
      </h2>

      <div>
        <button onClick={() => nav("/dashboard")} style={{ marginRight: 10 }}>
          Dashboard
        </button>

        <button onClick={() => nav("/")}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Navbar;