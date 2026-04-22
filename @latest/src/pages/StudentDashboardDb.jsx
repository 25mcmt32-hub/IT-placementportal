import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../config/api";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../config/auth";

const STUDENT_DEGREE_OPTIONS = ["IMTech", "MTech(CS)", "MTech(AI)"];

function isDriveVisibleForDegree(driveDegree, studentDegree) {
  if (!driveDegree || driveDegree === "All Degrees") {
    return true;
  }

  return driveDegree === studentDegree;
}

function StudentDashboardDb() {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const [active, setActive] = useState("profile");
  const [student, setStudent] = useState(null);
  const [drives, setDrives] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    regno: "",
    year: "",
    branch: "",
    degree: "",
    tenth: "",
    twelfth: "",
    ug: "",
    pg: "",
    password: "",
    resume: null,
  });

  const getStudentCgpa = () => {
    const value = parseFloat(student?.ug || student?.pg || "0");
    return Number.isFinite(value) ? value : 0;
  };

  useEffect(() => {
    if (!authUser?.id) {
      setError("Student session not found.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadStudent() {
      try {
        setIsLoading(true);
        const [studentData, driveData, materialData] = await Promise.all([
          apiRequest(`/students/${authUser.id}`),
          apiRequest("/drives"),
          apiRequest("/materials"),
        ]);

        if (isMounted) {
          setStudent(studentData.user);
          setDrives(driveData.drives);
          setMaterials(materialData.materials);
          setEditForm({
            name: studentData.user.name || "",
            email: studentData.user.email || "",
            regno: studentData.user.regno || "",
            year: studentData.user.year || "",
            branch: studentData.user.branch || "",
            degree: studentData.user.degree || "",
            tenth: studentData.user.tenth || "",
            twelfth: studentData.user.twelfth || "",
            ug: studentData.user.ug || "",
            pg: studentData.user.pg || "",
            password: "",
            resume: null,
          });
          setError("");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadStudent();

    return () => {
      isMounted = false;
    };
  }, [authUser?.id]);

  const handleLogout = () => {
    clearAuthUser();
    navigate("/student");
  };

  const handleEditChange = (event) => {
    const { name, value, files } = event.target;
    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = new FormData();
      payload.append("name", editForm.name);
      payload.append("email", editForm.email);
      payload.append("regno", editForm.regno);
      payload.append("year", editForm.year);
      payload.append("branch", editForm.branch);
      payload.append("degree", editForm.degree);
      payload.append("tenth", editForm.tenth);
      payload.append("twelfth", editForm.twelfth);
      payload.append("ug", editForm.ug);
      payload.append("pg", editForm.pg);

      if (editForm.password) {
        payload.append("password", editForm.password);
      }

      if (editForm.resume) {
        payload.append("resume", editForm.resume);
      }

      const data = await apiRequest(`/students/${authUser.id}`, {
        method: "PATCH",
        body: payload,
      });

      setStudent(data.user);
      saveAuthUser({
        ...authUser,
        ...data.user,
      });
      setEditForm((currentForm) => ({
        ...currentForm,
        password: "",
        resume: null,
      }));
      setIsEditing(false);
      setMessage("Profile updated successfully.");
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleApply = async (driveId) => {
    try {
      setError("");
      setMessage("");

      const data = await apiRequest(`/drives/${driveId}/apply`, {
        method: "POST",
        body: JSON.stringify({
          studentId: authUser.id,
        }),
      });

      setDrives((currentDrives) =>
        currentDrives.map((drive) => (drive._id === driveId ? data.drive : drive))
      );
      setMessage("Applied successfully.");
    } catch (applyError) {
      setError(applyError.message);
    }
  };

  const visibleDrives = drives.filter((drive) => isDriveVisibleForDegree(drive.degree, student?.degree));

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Student Panel</h3>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>

        <p
          onClick={() => setActive("profile")}
          style={{
            background: active === "profile" ? "white" : "",
            color: active === "profile" ? "#b30000" : "",
          }}
        >
          Personal Details
        </p>

        <p
          onClick={() => setActive("drives")}
          style={{
            background: active === "drives" ? "white" : "",
            color: active === "drives" ? "#b30000" : "",
          }}
        >
          Drives
        </p>

        <p
          onClick={() => setActive("hub")}
          style={{
            background: active === "hub" ? "white" : "",
            color: active === "hub" ? "#b30000" : "",
          }}
        >
          Knowledge Hub
        </p>
      </div>

      <div className="content">
        {error ? <p className="form-message error-message dashboard-message">{error}</p> : null}
        {message ? <p className="form-message success-message dashboard-message">{message}</p> : null}
        {isLoading ? <p className="dashboard-empty">Loading dashboard data...</p> : null}

        {!isLoading && active === "profile" && student ? (
          <div>
            <h2>Personal Details</h2>
            {!isEditing ? (
              <>
                <p><b>Name:</b> {student.name}</p>
                <p><b>Email:</b> {student.email || "-"}</p>
                <p><b>Registration No:</b> {student.regno || "-"}</p>
                <p><b>Branch:</b> {student.branch || "-"}</p>
                <p><b>Degree:</b> {student.degree || "-"}</p>
                <p><b>Passout Year:</b> {student.year || "-"}</p>
                <p><b>UG CGPA:</b> {student.ug || "-"}</p>
                <p><b>10th Percentage:</b> {student.tenth || "-"}</p>
                <p><b>12th Percentage:</b> {student.twelfth || "-"}</p>
                <p><b>PG CGPA:</b> {student.pg || "-"}</p>
                <p>
                  <b>Resume:</b>{" "}
                  {student.resumeUrl ? (
                    <a href={student.resumeUrl} target="_blank" rel="noreferrer">
                      {student.resumeOriginalName || student.resumeFileName}
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </p>
                <p><b>Placed:</b> {student.placed ? "Yes" : "No"}</p>
                <p><b>Blacklisted:</b> {student.blacklist ? "Yes" : "No"}</p>
                <button onClick={() => setIsEditing(true)}>Edit Details</button>
              </>
            ) : (
              <form className="form" onSubmit={handleProfileUpdate}>
                <input name="name" placeholder="Full Name" value={editForm.name} onChange={handleEditChange} required />
                <input name="email" type="email" placeholder="College Email" value={editForm.email} onChange={handleEditChange} required />
                <input name="regno" placeholder="Registration Number" value={editForm.regno} onChange={handleEditChange} required />
                <input name="year" placeholder="Passout Year" value={editForm.year} onChange={handleEditChange} required />
                <input name="branch" placeholder="Branch" value={editForm.branch} onChange={handleEditChange} required />
                <select name="degree" value={editForm.degree} onChange={handleEditChange} required>
                  <option value="">Select Degree</option>
                  {STUDENT_DEGREE_OPTIONS.map((degreeOption) => (
                    <option key={degreeOption} value={degreeOption}>
                      {degreeOption}
                    </option>
                  ))}
                </select>
                <input name="tenth" placeholder="10th Percentage" value={editForm.tenth} onChange={handleEditChange} />
                <input name="twelfth" placeholder="12th Percentage" value={editForm.twelfth} onChange={handleEditChange} />
                <input name="ug" placeholder="UG CGPA" value={editForm.ug} onChange={handleEditChange} />
                <input name="pg" placeholder="PG CGPA" value={editForm.pg} onChange={handleEditChange} />
                <input name="password" type="password" placeholder="New Password (optional)" value={editForm.password} onChange={handleEditChange} />
                <input name="resume" type="file" onChange={handleEditChange} />
                <div className="action-row">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        ) : null}

        {!isLoading && active === "drives" ? (
          <div>
            <h2>Available Drives</h2>
            {visibleDrives.length === 0 ? (
              <p className="dashboard-empty">No placement drives available for your degree yet.</p>
            ) : (
              visibleDrives.map((drive) => (
                <div key={drive._id} className="drive-card">
                  <h3>{drive.company}</h3>
                  <p>Minimum CGPA: {drive.minCgpa}</p>
                  <p>Eligible Degree: {drive.degree || "All Degrees"}</p>
                  <p>Deadline: {drive.deadline}</p>
                  <p>
                    JD File:{" "}
                    {drive.jdUrl ? (
                      <a href={drive.jdUrl} target="_blank" rel="noreferrer">
                        {drive.jdOriginalName || drive.jdFileName}
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </p>
                  <p>Posted By: {drive.createdBy || "Coordinator"}</p>
                  {(() => {
                    const minCgpa = parseFloat(drive.minCgpa || "0");
                    const studentCgpa = getStudentCgpa();
                    const meetsCgpa = !Number.isFinite(minCgpa) || studentCgpa >= minCgpa;
                    const alreadyApplied = (drive.applications || []).some(
                      (application) => application.studentId === authUser.id || application.studentId === student?.id
                    );
                    const applicationFrozen = student?.placed || student?.blacklist;
                    let statusText = "";

                    if (student?.placed) {
                      statusText = "Application frozen: you are marked as placed.";
                    } else if (student?.blacklist) {
                      statusText = "Application frozen: you are blacklisted.";
                    } else if (meetsCgpa) {
                      statusText = "Eligible";
                    } else {
                      statusText = `Not eligible. Your CGPA: ${studentCgpa}`;
                    }

                    return (
                      <div className="action-row">
                        <span>{statusText}</span>
                        <button
                          type="button"
                          disabled={!meetsCgpa || alreadyApplied || applicationFrozen}
                          onClick={() => handleApply(drive._id)}
                        >
                          {alreadyApplied ? "Applied" : "Apply"}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              ))
            )}
          </div>
        ) : null}

        {!isLoading && active === "hub" ? (
          <div>
            <h2>Knowledge Hub</h2>
            {materials.length === 0 ? (
              <p className="dashboard-empty">No study materials available yet.</p>
            ) : (
              materials.map((material) => (
                <div key={material._id} className="drive-card">
                  <h3>{material.title}</h3>
                  <p>
                    File:{" "}
                    {material.fileUrl ? (
                      <a href={material.fileUrl} target="_blank" rel="noreferrer">
                        {material.fileOriginalName || material.fileName}
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </p>
                  <p>Posted By: {material.createdBy || "Coordinator"}</p>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StudentDashboardDb;
