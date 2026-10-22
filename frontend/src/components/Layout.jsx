import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const common = [{ to: "/dashboard", label: "Overview", icon: "◫" }, { to: "/complaints", label: "Complaints", icon: "▤" }];
  const links = user.role === "Admin"
    ? [...common, { to: "/departments", label: "Departments & officers", icon: "⌂" }]
    : user.role === "Citizen"
      ? [...common, { to: "/complaints/new", label: "Submit a complaint", icon: "+" }, { to: "/notifications", label: "Notifications", icon: "♧" }, { to: "/profile", label: "My profile", icon: "○" }]
      : [...common, { to: "/notifications", label: "Notifications", icon: "♧" }, { to: "/profile", label: "My profile", icon: "○" }];

  async function signOut() {
    try { await logout(); } finally { navigate("/"); }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand"><span className="brand-mark">C</span><span>CivicPulse<small>PUBLIC GRIEVANCE SYSTEM</small></span></NavLink>
        <div className="side-label">WORKSPACE</div>
        <nav>{links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === "/complaints"} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><span>{link.icon}</span>{link.label}</NavLink>)}</nav>
        <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{user.name[0].toUpperCase()}</div><div><strong>{user.name}</strong><small>{user.role}</small></div></div><button className="signout" onClick={signOut}>↗ &nbsp; Sign out</button></div>
      </aside>
      <main className="main-area"><header className="topbar"><span>Public Grievance Management</span><span className="role-pill">{user.role} account</span></header><div className="page-content"><Outlet /></div></main>
    </div>
  );
}
