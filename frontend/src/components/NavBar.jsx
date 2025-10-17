import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        backgroundColor: "#1e293b",
        color: "white",
      }}
    >
      <h2 style={{ margin: 0 }}>🌍 GeoGuardian</h2>

      <div>
        {!token ? (
          <>
            <Link to="/login" style={linkStyle}>
              Login
            </Link>
            <Link to="/register" style={linkStyle}>
              Register
            </Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: "15px" }}>
              👋 Hi, {user?.name || "User"}
            </span>
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const linkStyle = {
  color: "white",
  marginRight: "15px",
  textDecoration: "none",
  fontWeight: "bold",
};

const logoutButtonStyle = {
  backgroundColor: "#ef4444",
  border: "none",
  color: "white",
  padding: "6px 12px",
  borderRadius: "6px",
  cursor: "pointer",
};

export default Navbar;
