import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Analytics from "./components/Analytics";
import Faculty from "./components/Faculty";
import Students from "./components/Students";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import StudentLogin from "./pages/StudentLogin";
import FacultyLogin from "./pages/FacultyLogin";
import CoordinatorLogin from "./pages/CoordinatorLogin";

import StudentRegister from "./pages/StudentRegister";

import StudentDashboard from "./pages/StudentDashboardDb";

import CoordinatorDashboard from "./pages/CoordinatorDashboard";

import FacultyDashboard from "./pages/FacultyDashboardDb";

import { Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Analytics />
              <Faculty />
              <Students />
              <Footer />
            </>
          }
        />

        <Route path="/student" element={<StudentLogin />} />
        <Route path="/faculty" element={<FacultyLogin />} />
        <Route path="/coordinator" element={<CoordinatorLogin />} />

        <Route path="/register" element={<StudentRegister />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator-dashboard"
          element={
            <ProtectedRoute allowedRoles={["coordinator"]}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute allowedRoles={["faculty"]}>
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
