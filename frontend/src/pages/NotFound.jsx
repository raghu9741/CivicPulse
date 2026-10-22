import { Link } from "react-router-dom";

export default function NotFound() {
  return <div className="not-found"><div className="eyebrow">404 · PAGE NOT FOUND</div><h1>That page isn't here.</h1><p className="muted">The link may be incorrect or the page may have moved.</p><Link to="/" className="button primary">Return home</Link></div>;
}
