import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../config/api";
import { clearAuthUser, getAuthUser, saveAuthUser } from "../config/auth";

const COLLEGE_NAME = "University of Hyderabad";
const STUDENT_APPLICATION_FIELD_VALUES = {
  name: (student) => student?.name || "",
  email: (student) => student?.email || "",
  regno: (student) => student?.regno || "",
  year: (student) => student?.year || "",
  branch: (student) => student?.branch || "",
  degree: (student) => student?.degree || "",
  tenth: (student) => student?.tenth || "",
  twelfth: (student) => student?.twelfth || "",
  ug: (student) => student?.ug || "",
  pg: (student) => student?.pg || "",
  collegeName: () => COLLEGE_NAME,
  resumeUrl: (student) => student?.resumeUrl || "",
};

function isDriveVisibleForDegree(driveDegree, studentDegree) {
  if (!driveDegree || driveDegree === "All Degrees") {
    return true;
  }

  return driveDegree === studentDegree;
}

function getCompanyApplicationFields(drive, student) {
  return [...(drive.applicationFields || [])]
    .sort((firstField, secondField) => (firstField.order || 1) - (secondField.order || 1))
    .map((field) => ({
      ...field,
      value: field.source === "student" ? STUDENT_APPLICATION_FIELD_VALUES[field.key]?.(student) || "" : "",
      isAutoFilled: field.source === "student",
    }));
}

function StudentDashboardDb() {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const authUserId = authUser?.id;
  const [active, setActive] = useState("profile");
  const [student, setStudent] = useState(null);
  const [drives, setDrives] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [applicationForms, setApplicationForms] = useState({});
  const [cgpaForm, setCgpaForm] = useState("");
  const [editForm, setEditForm] = useState({
    resumeUrl: "",
  });

  const getStudentCgpa = () => {
    const value = parseFloat(student?.degree === "IMTech" ? student?.ug || "0" : student?.pg || "0");
    return Number.isFinite(value) ? value : 0;
  };

  const getEditableCgpaLabel = () => (student?.degree === "IMTech" ? "UG CGPA" : "PG CGPA");

  useEffect(() => {
    if (!authUserId) {
      setError("Student session not found.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadStudent(showLoading = true) {
      try {
        if (showLoading) {
        setIsLoading(true);
        }
        const [studentData, driveData, materialData] = await Promise.all([
          apiRequest(`/students/${authUserId}`),
          apiRequest("/drives"),
          apiRequest("/materials"),
        ]);

        if (isMounted) {
          setStudent(studentData.user);
          const currentAuthUser = getAuthUser();
          saveAuthUser({
            ...currentAuthUser,
            ...studentData.user,
          });
          setDrives(driveData.drives);
          setMaterials(materialData.materials);
          setEditForm({
            resumeUrl: studentData.user.resumeUrl || "",
          });
          setCgpaForm(studentData.user.degree === "IMTech" ? studentData.user.ug || "" : studentData.user.pg || "");
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
    const refreshTimer = window.setInterval(() => {
      loadStudent(false);
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [authUserId]);

  const handleLogout = () => {
    clearAuthUser();
    navigate("/student");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleProfileUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      if (!editForm.resumeUrl.trim()) {
        setError("Please enter a public resume URL.");
        return;
      }

      const data = await apiRequest(`/students/${authUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          resumeUrl: editForm.resumeUrl,
        }),
      });

      setStudent(data.user);
      saveAuthUser({
        ...authUser,
        ...data.user,
      });
      setEditForm((currentForm) => ({
        ...currentForm,
        resumeUrl: data.user.resumeUrl || "",
      }));
      setIsEditing(false);
      setMessage("Resume updated successfully.");
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleCgpaUpdate = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await apiRequest(`/students/${authUser.id}/cgpa`, {
        method: "PATCH",
        body: JSON.stringify({ cgpa: cgpaForm }),
      });

      setStudent(data.user);
      saveAuthUser({
        ...authUser,
        ...data.user,
      });
      setMessage(data.message);
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const handleApplicationFieldChange = (driveId, fieldName, value) => {
    setApplicationForms((currentForms) => ({
      ...currentForms,
      [driveId]: {
        ...(currentForms[driveId] || {}),
        [fieldName]: value,
      },
    }));
  };

  const handleApply = async (drive) => {
    try {
      setError("");
      setMessage("");

      const applicationDetails = {};
      const missingFields = [];
      getCompanyApplicationFields(drive, student).forEach((field) => {
        if (field.isAutoFilled) {
          return;
        }

        const fieldValue = applicationForms[drive._id]?.[field.key] || "";
        applicationDetails[field.key] = fieldValue;

        if (field.required !== false && !fieldValue.trim()) {
          missingFields.push(field.label);
        }
      });

      if (missingFields.length > 0) {
        setError(`Please fill these company fields: ${missingFields.join(", ")}.`);
        return;
      }

      const data = await apiRequest(`/drives/${drive._id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          studentId: authUser.id,
          applicationDetails,
        }),
      });

      setDrives((currentDrives) =>
        currentDrives.map((currentDrive) => (currentDrive._id === drive._id ? data.drive : currentDrive))
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
                <p><b>CGPA Verification:</b> {student.academicVerificationStatus || "approved"}</p>
                {student.cgpaEditAccess ? (
                  <form className="form cgpa-edit-form" onSubmit={handleCgpaUpdate}>
                    <label>{getEditableCgpaLabel()}</label>
                    <input
                      min="0"
                      max="10"
                      step="0.01"
                      type="number"
                      value={cgpaForm}
                      onChange={(event) => setCgpaForm(event.target.value)}
                      required
                    />
                    <button type="submit">Submit CGPA For Verification</button>
                  </form>
                ) : null}
                <p>
                  <b>Resume:</b>{" "}
                  {student.resumeUrl ? (
                    <a href={student.resumeUrl} target="_blank" rel="noreferrer">
                      {student.resumeUrl}
                    </a>
                  ) : (
                    "Not uploaded"
                  )}
                </p>
                <p><b>Placed:</b> {student.placed ? "Yes" : "No"}</p>
                <p><b>Blacklisted:</b> {student.blacklist ? "Yes" : "No"}</p>
                <button onClick={() => setIsEditing(true)}>Update Resume</button>
              </>
            ) : (
              <form className="form" onSubmit={handleProfileUpdate}>
                <input
                  name="resumeUrl"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={editForm.resumeUrl}
                  onChange={handleEditChange}
                  required
                />
                <div className="action-row">
                  <button type="submit">Save Resume</button>
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
                    const academicsVerified = (student?.academicVerificationStatus || "approved") === "approved";
                    const alreadyApplied = (drive.applications || []).some(
                      (application) => application.studentId === authUser.id || application.studentId === student?.id
                    );
                    const applicationFrozen = student?.placed || student?.blacklist;
                    let statusText = "";

                    if (student?.placed) {
                      statusText = "Application frozen: you are marked as placed.";
                    } else if (student?.blacklist) {
                      statusText = "Application frozen: you are blacklisted.";
                    } else if (!academicsVerified) {
                      statusText = "CGPA pending faculty verification.";
                    } else if (meetsCgpa) {
                      statusText = "Eligible";
                    } else {
                      statusText = `Not eligible. Your CGPA: ${studentCgpa}`;
                    }

                    return (
                      <div>
                        <div className="application-summary">
                          {getCompanyApplicationFields(drive, student)
                            .filter((field) => field.source === "student")
                            .map((field) => (
                              <p key={field.key}>
                                <b>{field.label}:</b> {field.value || "-"}
                              </p>
                            ))}
                        </div>

                        {getCompanyApplicationFields(drive, student)
                          .filter((field) => field.source === "custom")
                          .map((field) => (
                          <label key={field.key} className="application-field">
                            <span>{field.label}</span>
                            <input
                              value={applicationForms[drive._id]?.[field.key] || ""}
                              onChange={(event) =>
                                handleApplicationFieldChange(drive._id, field.key, event.target.value)
                              }
                              placeholder={`Enter ${field.label}`}
                            />
                          </label>
                        ))}

                        <div className="action-row">
                          <span>{statusText}</span>
                          <button
                            type="button"
                            disabled={!meetsCgpa || !academicsVerified || alreadyApplied || applicationFrozen}
                            onClick={() => handleApply(drive)}
                          >
                            {alreadyApplied ? "Applied" : "Register"}
                          </button>
                        </div>
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
