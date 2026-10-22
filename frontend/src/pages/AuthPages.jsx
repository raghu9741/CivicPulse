import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

function AuthFrame({ title, subtitle, children }) {
  return <div className="auth-page"><Link to="/" className="brand auth-brand"><span className="brand-mark">C</span><span>CivicPulse<small>PUBLIC GRIEVANCE SYSTEM</small></span></Link><section className="auth-card"><div className="eyebrow">CIVICPULSE ACCOUNT</div><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</section><p className="auth-foot">A clearer path from concern to resolution.</p></div>;
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await login(form); navigate("/dashboard"); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <AuthFrame title="Welcome back" subtitle="Sign in to continue to your CivicPulse workspace."><form onSubmit={submit} className="form-stack"><label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>{error && <div className="alert error">{error}</div>}<button className="button primary full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form><p className="auth-switch">New to CivicPulse? <Link to="/register">Create a citizen account</Link></p></AuthFrame>;
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { await register(form); navigate("/dashboard"); } catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <AuthFrame title="Create your account" subtitle="Register as a citizen to submit and follow public complaints."><form onSubmit={submit} className="form-stack"><label>Full name<input required minLength="2" maxLength="100" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Email address<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label>Password<input type="password" required minLength="8" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><small>Use at least 8 characters.</small></label>{error && <div className="alert error">{error}</div>}<button className="button primary full" disabled={busy}>{busy ? "Creating account…" : "Create citizen account"}</button></form><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p></AuthFrame>;
}
