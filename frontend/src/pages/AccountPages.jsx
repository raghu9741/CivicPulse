import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  async function load() { const { data } = await api.get("/notifications"); setItems(data.notifications); }
  useEffect(() => { load().catch((err) => setError(getErrorMessage(err))); }, []);
  async function markRead(id) {
    try { await api.patch(`/notifications/${id}/read`); await load(); } catch (err) { setError(getErrorMessage(err)); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">UPDATES</div><h1>Notifications</h1><p className="muted">Updates related to your CivicPulse activity.</p></div></div><section className="panel">{error && <div className="alert error">{error}</div>}{items.length ? <div className="notification-list">{items.map((item) => <article key={item._id} className={`notification ${item.isRead ? "" : "unread"}`}><span className="notification-mark">●</span><div><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div>{!item.isRead && <button className="text-button" onClick={() => markRead(item._id)}>Mark read</button>}</article>)}</div> : <div className="empty-state"><span>♧</span><strong>No notifications</strong><p>There are no updates to show right now.</p></div>}</section></>;
}

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try { const { data } = await api.patch("/auth/profile", { name }); setUser(data.user); setName(data.user.name); setMessage("Profile updated."); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">ACCOUNT</div><h1>My profile</h1><p className="muted">Manage your personal account details.</p></div></div><section className="panel form-panel"><div className="profile-heading"><div className="avatar large-avatar">{user.name[0].toUpperCase()}</div><div><h2>{user.name}</h2><p className="muted">{user.role} account</p></div></div>{error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}<form className="form-stack" onSubmit={submit}><label>Full name<input required minLength="2" maxLength="100" value={name} onChange={(e) => setName(e.target.value)} /></label><label>Email address<input value={user.email} disabled /></label><label>Account role<input value={user.role} disabled /></label><button className="button primary" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button></form></section></>;
}
