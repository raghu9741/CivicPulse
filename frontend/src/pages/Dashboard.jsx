import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const statusLabels = ["Submitted", "Assigned", "In Progress", "Resolved", "Rejected"];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/complaints")])
      .then(([statsResult, complaintResult]) => { setStats(statsResult.data); setRecent(complaintResult.data.complaints.slice(0, 5)); })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);
  return <><div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>Good day, {user.name.split(" ")[0]}</h1><p className="muted">{user.role === "Citizen" ? "Follow your submissions and stay up to date on progress." : user.role === "Officer" ? "Review the cases assigned to you and keep citizens updated." : "Monitor reports, manage assignments, and support a timely response."}</p></div>{user.role === "Citizen" && <Link className="button primary" to="/complaints/new">＋ New complaint</Link>}</div>
    {error && <div className="alert error">{error}</div>}
    <section className="stat-grid">{statusLabels.map((status) => <article className="stat-card" key={status}><div className="stat-top"><span>{status}</span><span className={`status-dot ${status.toLowerCase().replace(" ", "-")}`} /></div><strong>{stats?.byStatus?.[status] ?? (stats ? 0 : "—")}</strong><small>complaints</small></article>)}</section>
    <section className="panel"><div className="section-heading"><div><h2>Recent complaints</h2><p className="muted">{stats ? `${stats.total} total records in your view` : "Loading records…"}</p></div><Link to="/complaints" className="text-link">View all →</Link></div>
      {recent.length ? <div className="table-wrap"><table><thead><tr><th>Complaint</th><th>Category</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{recent.map((item) => <tr key={item._id}><td><Link className="table-title" to={`/complaints/${item._id}`}>{item.title}</Link><small>{item.location}</small></td><td>{item.category}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><span className={`badge ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><span>▤</span><strong>No complaints yet</strong><p>New submissions will appear here once recorded.</p></div>}
    </section>
    <p className="note">CivicPulse currently uses manual category, priority, and assignment workflows. AI capabilities are not enabled in this phase.</p>
  </>;
}
