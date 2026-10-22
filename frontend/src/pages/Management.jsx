import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../services/api";

export default function ManagementPage() {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [officer, setOfficer] = useState({ name: "", email: "", password: "", departmentId: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function load() {
    const [departmentsResult, officersResult] = await Promise.all([api.get("/departments"), api.get("/officers")]);
    setDepartments(departmentsResult.data.departments); setOfficers(officersResult.data.officers);
  }
  useEffect(() => { load().catch((err) => setError(getErrorMessage(err))); }, []);
  async function addDepartment(event) {
    event.preventDefault(); setError(""); setMessage("");
    try { await api.post("/departments", { departmentName, description }); setDepartmentName(""); setDescription(""); setMessage("Department created."); await load(); } catch (err) { setError(getErrorMessage(err)); }
  }
  async function addOfficer(event) {
    event.preventDefault(); setError(""); setMessage("");
    try { await api.post("/officers", officer); setOfficer({ name: "", email: "", password: "", departmentId: "" }); setMessage("Officer account created."); await load(); } catch (err) { setError(getErrorMessage(err)); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">ADMINISTRATION</div><h1>Departments & officers</h1><p className="muted">Organize departments and create authorized officer accounts.</p></div></div>{error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}
    <div className="management-grid"><section className="panel"><h2>Add a department</h2><form className="form-stack" onSubmit={addDepartment}><label>Department name<input required maxLength="100" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} /></label><label>Description<input maxLength="500" value={description} onChange={(e) => setDescription(e.target.value)} /></label><button className="button primary">Create department</button></form><h3 className="subheading">Departments ({departments.length})</h3>{departments.length ? <ul className="simple-list">{departments.map((d) => <li key={d._id}><strong>{d.departmentName}</strong><small>{d.description}</small></li>)}</ul> : <p className="muted">No departments yet.</p>}</section>
    <section className="panel"><h2>Create an officer account</h2><form className="form-stack" onSubmit={addOfficer}><label>Full name<input required minLength="2" maxLength="100" value={officer.name} onChange={(e) => setOfficer({ ...officer, name: e.target.value })} /></label><label>Email address<input type="email" required value={officer.email} onChange={(e) => setOfficer({ ...officer, email: e.target.value })} /></label><label>Temporary password<input type="password" required minLength="8" maxLength="72" value={officer.password} onChange={(e) => setOfficer({ ...officer, password: e.target.value })} /></label><label>Department<select required value={officer.departmentId} onChange={(e) => setOfficer({ ...officer, departmentId: e.target.value })}><option value="">Select a department</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.departmentName}</option>)}</select></label><button className="button primary">Create officer</button></form><h3 className="subheading">Officer accounts ({officers.length})</h3>{officers.length ? <ul className="simple-list">{officers.map((o) => <li key={o._id}><strong>{o.name}</strong><small>{o.email} · {o.departmentId?.departmentName || "No department"}</small></li>)}</ul> : <p className="muted">No officers yet.</p>}</section></div>
  </>;
}
