import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

const categories = ["Water", "Electricity", "Roads", "Waste Management", "Sanitation", "Public Safety", "Other"];
const priorities = ["Normal", "High", "Critical"];
const officerStatuses = ["In Progress", "Resolved", "Rejected"];

export function ComplaintListPage() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", category: "", priority: "" });
  const [error, setError] = useState("");
  const { user } = useAuth();
  useEffect(() => {
    const timer = setTimeout(() => api.get("/complaints", { params: filters }).then(({ data }) => { setItems(data.complaints); setError(""); }).catch((err) => setError(getErrorMessage(err))), 200);
    return () => clearTimeout(timer);
  }, [filters]);
  return <><div className="page-heading"><div><div className="eyebrow">CASE MANAGEMENT</div><h1>{user.role === "Officer" ? "Assigned complaints" : user.role === "Admin" ? "All complaints" : "My complaints"}</h1><p className="muted">Search, review, and track public service requests.</p></div>{user.role === "Citizen" && <Link to="/complaints/new" className="button primary">＋ New complaint</Link>}</div>
    <section className="panel"><div className="filter-row"><input aria-label="Search complaints" placeholder="Search by title or location…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /><select aria-label="Filter status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{["Submitted", "Assigned", "In Progress", "Resolved", "Rejected"].map((status) => <option key={status}>{status}</option>)}</select><select aria-label="Filter category" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><select aria-label="Filter priority" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></div>
      {error && <div className="alert error">{error}</div>}
      {items.length ? <div className="table-wrap"><table><thead><tr><th>Complaint</th>{user.role !== "Citizen" && <th>Citizen</th>}<th>Category / Priority</th><th>Last updated</th><th>Status</th></tr></thead><tbody>{items.map((item) => <tr key={item._id}><td><Link className="table-title" to={`/complaints/${item._id}`}>{item.title}</Link><small>{item.location}</small></td>{user.role !== "Citizen" && <td>{item.citizenId?.name || "—"}</td>}<td>{item.category}<small>{item.priority} priority</small></td><td>{new Date(item.updatedAt).toLocaleDateString()}</td><td><span className={`badge ${item.status.toLowerCase().replace(" ", "-")}`}>{item.status}</span></td></tr>)}</tbody></table></div> : !error && <div className="empty-state"><span>▤</span><strong>No matching complaints</strong><p>Try changing the filters or submit a new complaint.</p></div>}</section>
  </>;
}

export function NewComplaintPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", category: "", priority: "Normal", location: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try { const { data } = await api.post("/complaints", form); navigate(`/complaints/${data.complaint._id}`); }
    catch (err) { setError(getErrorMessage(err)); } finally { setBusy(false); }
  }
  return <><div className="page-heading"><div><div className="eyebrow">CITIZEN SERVICES</div><h1>Submit a complaint</h1><p className="muted">Provide enough detail so the relevant team can understand your concern.</p></div></div><section className="panel form-panel"><form className="form-stack" onSubmit={submit}><label>Complaint title<input required minLength="4" maxLength="150" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Briefly describe the issue" /></label><label>Detailed description<textarea required minLength="10" maxLength="5000" rows="5" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What happened, and when did you first notice it?" /></label><div className="form-grid"><label>Category<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="">Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select><small>Priority is selected by you.</small></label></div><label>Location<input required maxLength="300" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Street, neighborhood, or landmark" /></label>{error && <div className="alert error">{error}</div>}<div className="form-actions"><Link className="button secondary" to="/complaints">Cancel</Link><button className="button primary" disabled={busy}>{busy ? "Submitting…" : "Submit complaint"}</button></div></form></section></>;
}

export function ComplaintDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [assignment, setAssignment] = useState({ departmentId: "", officerId: "" });
  const [update, setUpdate] = useState({ status: "In Progress", remarks: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get(`/complaints/${id}`);
    setRecord(data);
  }
  useEffect(() => { load().catch((err) => setError(getErrorMessage(err))); }, [id]);
  useEffect(() => {
    if (user.role === "Admin") api.get("/departments").then(({ data }) => setDepartments(data.departments)).catch((err) => setError(getErrorMessage(err)));
  }, [user.role]);
  useEffect(() => {
    if (assignment.departmentId) api.get("/officers", { params: { departmentId: assignment.departmentId } }).then(({ data }) => setOfficers(data.officers)).catch((err) => setError(getErrorMessage(err)));
    else setOfficers([]);
  }, [assignment.departmentId]);
  async function runAction(action) {
    setError(""); setMessage("");
    try { await action(); await load(); setMessage("Changes saved successfully."); } catch (err) { setError(getErrorMessage(err)); }
  }
  if (error && !record) return <div className="alert error">{error}</div>;
  if (!record) return <div className="center-state">Loading complaint…</div>;
  const { complaint, history } = record;
  return <><div className="page-heading"><div><Link to="/complaints" className="back-link">← Back to complaints</Link><div className="eyebrow">COMPLAINT DETAILS</div><h1>{complaint.title}</h1><p className="muted">Submitted {new Date(complaint.createdAt).toLocaleString()}</p></div><span className={`badge large ${complaint.status.toLowerCase().replace(" ", "-")}`}>{complaint.status}</span></div>
    {error && <div className="alert error">{error}</div>}{message && <div className="alert success">{message}</div>}
    <div className="detail-grid"><section className="panel"><div className="section-heading"><h2>Report details</h2><span className={`badge ${complaint.priority.toLowerCase()}`}>{complaint.priority} priority</span></div><div className="detail-meta"><div><small>CATEGORY</small><strong>{complaint.category}</strong></div><div><small>LOCATION</small><strong>{complaint.location}</strong></div>{user.role !== "Citizen" && <div><small>REPORTED BY</small><strong>{complaint.citizenId?.name}</strong></div>}<div><small>DEPARTMENT</small><strong>{complaint.departmentId?.departmentName || "Not assigned"}</strong></div><div><small>OFFICER</small><strong>{complaint.assignedOfficerId?.name || "Not assigned"}</strong></div></div><div className="description-block"><small>DESCRIPTION</small><p>{complaint.description}</p></div>{complaint.resolutionNotes && <div className="description-block"><small>OFFICER REMARKS</small><p>{complaint.resolutionNotes}</p></div>}</section>
      <aside className="panel timeline-panel"><h2>Activity history</h2>{history.length ? <ol className="timeline">{history.map((entry) => <li key={entry._id}><span className="timeline-dot" /><div><strong>{entry.newStatus}</strong><p>{entry.remarks || "Status updated"}</p><small>{entry.changedBy?.name || "System"} · {new Date(entry.createdAt).toLocaleString()}</small></div></li>)}</ol> : <p className="muted">No history available.</p>}</aside>
    </div>
    {user.role === "Admin" && !["Resolved", "Rejected"].includes(complaint.status) && <section className="panel action-panel"><h2>Assign complaint</h2><div className="form-grid"><label>Department<select value={assignment.departmentId} onChange={(e) => setAssignment({ departmentId: e.target.value, officerId: "" })}><option value="">Select department</option>{departments.map((d) => <option key={d._id} value={d._id}>{d.departmentName}</option>)}</select></label><label>Officer<select disabled={!assignment.departmentId} value={assignment.officerId} onChange={(e) => setAssignment({ ...assignment, officerId: e.target.value })}><option value="">Select officer</option>{officers.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</select></label></div><button className="button primary" disabled={!assignment.departmentId || !assignment.officerId} onClick={() => runAction(() => api.patch(`/complaints/${id}/assignment`, assignment))}>Save assignment</button></section>}
    {user.role === "Officer" && <section className="panel action-panel"><h2>Update complaint status</h2><div className="form-grid"><label>New status<select value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>{officerStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><label>Remarks<textarea rows="2" maxLength="2000" value={update.remarks} onChange={(e) => setUpdate({ ...update, remarks: e.target.value })} placeholder="Add progress or resolution notes" /></label></div><button className="button primary" disabled={["Resolved", "Rejected"].includes(complaint.status)} onClick={() => runAction(() => api.patch(`/complaints/${id}/status`, update))}>Update status</button></section>}
  </>;
}
