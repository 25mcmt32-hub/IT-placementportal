import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../config/api";
import { clearAuthUser } from "../config/auth";

function FacultyDashboardDb() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        setIsLoading(true);
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

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    clearAuthUser();
    navigate("/faculty");
  };

  const updateStudent = async (studentId, changes) => {
    try {
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

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Faculty Panel</h3>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
        <p>Student Details</p>
      </div>

      <div className="content">
        <h2>Registered Students</h2>
        {error ? <p className="form-message error-message dashboard-message">{error}</p> : null}

        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px", marginBottom: "15px" }}
        />

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
      </div>
    </div>
  );
}

export default FacultyDashboardDb;
