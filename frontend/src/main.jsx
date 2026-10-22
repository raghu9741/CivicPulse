import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import { ComplaintDetailPage, ComplaintListPage, NewComplaintPage } from "./pages/Complaints";
import ManagementPage from "./pages/Management";
import { NotificationsPage, ProfilePage } from "./pages/AccountPages";
import NotFound from "./pages/NotFound";
import "./styles.css";

function App() {
  return <AuthProvider><BrowserRouter><Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<ProtectedRoute />}><Route element={<Layout />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/complaints" element={<ComplaintListPage />} /><Route path="/complaints/:id" element={<ComplaintDetailPage />} /><Route element={<ProtectedRoute roles={["Citizen"]} />}><Route path="/complaints/new" element={<NewComplaintPage />} /></Route><Route element={<ProtectedRoute roles={["Admin"]} />}><Route path="/departments" element={<ManagementPage />} /></Route><Route element={<ProtectedRoute roles={["Citizen", "Officer"]} />}><Route path="/notifications" element={<NotificationsPage />} /><Route path="/profile" element={<ProfilePage />} /></Route></Route></Route><Route path="*" element={<NotFound />} /></Routes></BrowserRouter></AuthProvider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
