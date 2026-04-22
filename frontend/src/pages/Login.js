import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || "";
      console.log("Attempting login with:", { username, password });
      const url = `${API_URL}/login`;
      console.log("Requesting:", url);
      const res = await fetch(url, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("username", data.username);
        nav("/dashboard");
      } else {
        setMessage(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage("Failed to connect to server: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Login</h1>
          <p>Welcome back! Please login to continue</p>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {message && <div className="message error">{message}</div>}

          <button
            className="btn-submit"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <div className="auth-footer">
          <p>Don't have an account?</p>
          <button className="btn-link" onClick={() => nav("/register")}>
            Register here
          </button>
        </div>


      </div>
    </div>
  );
}

export default Login;