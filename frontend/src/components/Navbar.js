import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const nav = useNavigate();
  const location = useLocation();

  const username = (localStorage.getItem("username") && localStorage.getItem("username") !== "undefined") 
                   ? localStorage.getItem("username") 
                   : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    nav("/login");
  };

  const isActive = (path) => location.pathname === path;
  const role = localStorage.getItem("role") || "student";

  return (
    <nav className="navbar">
      <div className="nav-brand" onClick={() => nav("/dashboard")}>
        Exam System {username && <span style={{ fontSize: "0.5em", opacity: 0.7, marginLeft: "10px" }}>({username})</span>}
      </div>

      <div className="nav-links">
        <button
          className={`nav-btn ${isActive("/dashboard") ? "active" : ""}`}
          onClick={() => nav("/dashboard")}
        >
          Dashboard
        </button>

        {role === "student" && (
          <button
            className={`nav-btn ${isActive("/profile") ? "active" : ""}`}
            onClick={() => nav("/profile")}
          >
            My Result
          </button>
        )}

        <button className="nav-btn nav-btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;