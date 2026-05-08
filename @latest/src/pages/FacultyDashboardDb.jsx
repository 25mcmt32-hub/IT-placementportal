import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../config/api";
import { clearAuthUser } from "../config/auth";

function FacultyDashboardDb() {
  const navigate = useNavigate();
  const [active, setActive] = useState("details");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudents(showLoading = true) {
      try {
        if (showLoading) {
          setIsLoading(true);
        }
        const data = await apiRequest("/students");

        if (isMounted) {
          setStudents(data.students);
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

    loadStudents();
    const refreshTimer = window.setInterval(() => {
      loadStudents(false);
    }, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );
  const pendingStudents = filteredStudents.filter(
    (student) => (student.verificationStatus || "pending") !== "approved"
  );

  const handleLogout = () => {
    clearAuthUser();
    navigate("/faculty");
  };

  const updateStudent = async (studentId, changes) => {
    try {
      setMessage("");
      const data = await apiRequest(`/students/${studentId}/status`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });

      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === studentId ? data.user : student
        )
      );
      setError("");
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const updateStudentVerification = async (studentId, verificationStatus) => {
    try {
      setMessage("");
      setError("");

      const data = await apiRequest(`/students/${studentId}/verification`, {
        method: "PATCH",
        body: JSON.stringify({ verificationStatus }),
      });

      if (verificationStatus === "rejected") {
        setStudents((currentStudents) =>
          currentStudents.filter((student) => student.id !== studentId)
        );
        setMessage("Student registration rejected and deleted.");
        return;
      }

      setStudents((currentStudents) =>
        currentStudents.map((student) =>
          student.id === studentId ? data.user : student
        )
      );
      setMessage("Student registration approved.");
    } catch (verificationError) {
      setError(verificationError.message);
    }
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Faculty Panel</h3>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
        <p
          onClick={() => setActive("details")}
          style={{
            background: active === "details" ? "white" : "",
            color: active === "details" ? "#b30000" : "",
          }}
        >
          Student Details
        </p>
        <p
          onClick={() => setActive("verification")}
          style={{
            background: active === "verification" ? "white" : "",
            color: active === "verification" ? "#b30000" : "",
          }}
        >
          Student Verification
        </p>
      </div>

      <div className="content">
        {error ? <p className="form-message error-message dashboard-message">{error}</p> : null}
        {message ? <p className="form-message success-message dashboard-message">{message}</p> : null}

        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", marginBottom: "15px" }}
        />

        {active === "details" ? (
          <>
            <h2>Registered Students</h2>
            {isLoading ? (
              <p className="dashboard-empty">Loading students from MongoDB...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="dashboard-empty">No student records found in MongoDB.</p>
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reg No</th>
                    <th>Degree</th>
                    <th>Year</th>
                    <th>Verification</th>
                    <th>CGPA</th>
                    <th>CGPA Status</th>
                    <th>CGPA Edit</th>
                    <th>Placed</th>
                    <th>Blacklist</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.regno}</td>
                      <td>{student.degree}</td>
                      <td>{student.year}</td>
                      <td>{student.verificationStatus || "pending"}</td>
                      <td>{student.degree === "IMTech" ? student.ug || "-" : student.pg || "-"}</td>
                      <td>{student.academicVerificationStatus || "approved"}</td>
                      <td>
                        <div className="table-action-stack">
                          <button
                            onClick={() => updateStudent(student.id, { cgpaEditAccess: true })}
                            disabled={student.cgpaEditAccess}
                          >
                            {student.cgpaEditAccess ? "Access Given" : "Give Access"}
                          </button>
                          <button
                            onClick={() =>
                              updateStudent(student.id, { academicVerificationStatus: "approved" })
                            }
                            disabled={(student.academicVerificationStatus || "approved") === "approved"}
                          >
                            Verify CGPA
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            updateStudent(student.id, { placed: !student.placed })
                          }
                        >
                          {student.placed ? "Placed" : "Not Placed"}
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() =>
                            updateStudent(student.id, { blacklist: !student.blacklist })
                          }
                        >
                          {student.blacklist ? "Yes" : "No"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : null}

        {active === "verification" ? (
          <div>
            <h2>Student Verification</h2>
            {isLoading ? (
              <p className="dashboard-empty">Loading student registrations...</p>
            ) : pendingStudents.length === 0 ? (
              <p className="dashboard-empty">No pending student registrations.</p>
            ) : (
              pendingStudents.map((student) => (
                <div key={student.id} className="drive-card">
                  <h3>{student.name}</h3>
                  <p><b>Email:</b> {student.email}</p>
                  <p><b>Registration No:</b> {student.regno}</p>
                  <p><b>Branch:</b> {student.branch}</p>
                  <p><b>Degree:</b> {student.degree}</p>
                  <p><b>Passout Year:</b> {student.year}</p>
                  <p><b>10th Percentage:</b> {student.tenth || "-"}</p>
                  <p><b>12th Percentage:</b> {student.twelfth || "-"}</p>
                  <p><b>UG CGPA:</b> {student.ug || "-"}</p>
                  <p><b>PG CGPA:</b> {student.pg || "-"}</p>
                  <p><b>CGPA Verification:</b> {student.academicVerificationStatus || "approved"}</p>
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
                  <div className="action-row">
                    <button
                      type="button"
                      onClick={() => updateStudentVerification(student.id, "approved")}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStudentVerification(student.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FacultyDashboardDb;
