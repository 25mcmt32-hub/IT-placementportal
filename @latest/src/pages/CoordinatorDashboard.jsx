import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../config/api";
import { clearAuthUser, getAuthUser } from "../config/auth";

const DRIVE_DEGREE_OPTIONS = ["All Degrees", "IMTech", "MTech(CS)", "MTech(AI)"];

function CoordinatorDashboard() {
  const navigate = useNavigate();
  const authUser = getAuthUser();
  const [active, setActive] = useState("drive");
  const [editingDriveId, setEditingDriveId] = useState("");

  const [drive, setDrive] = useState({
    company: "",
    minCgpa: "",
    deadline: "",
    degree: "All Degrees",
    jd: null
  });

  const [material, setMaterial] = useState({
    title: "",
    file: null
  });
  const [drives, setDrives] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [driveData, materialData] = await Promise.all([
          apiRequest("/drives"),
          apiRequest("/materials"),
        ]);
        setDrives(driveData.drives);
        setMaterials(materialData.materials);
      } catch (loadError) {
        setError(loadError.message);
      }
    };

    loadData();
  }, []);

  const handleDriveChange = (e) => {
    const { name, value, files } = e.target;
    setDrive((currentDrive) => ({
      ...currentDrive,
      [name]: files ? files[0] : value
    }));
  };

  const handleMaterialChange = (e) => {
    const { name, value, files } = e.target;
    setMaterial({
      ...material,
      [name]: files ? files[0] : value
    });
  };

  const submitDrive = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("company", drive.company);
      payload.append("minCgpa", drive.minCgpa);
      payload.append("deadline", drive.deadline);
      payload.append("degree", drive.degree);
      payload.append("createdBy", authUser?.username || authUser?.email || "student coordinator");
      if (drive.jd) {
        payload.append("jd", drive.jd);
      }

      const data = await apiRequest(editingDriveId ? `/drives/${editingDriveId}` : "/drives", {
        method: editingDriveId ? "PATCH" : "POST",
        body: payload,
      });

      setDrives((currentDrives) => {
        if (editingDriveId) {
          return currentDrives.map((currentDrive) =>
            currentDrive._id === editingDriveId ? data.drive : currentDrive
          );
        }

        return [data.drive, ...currentDrives];
      });
      setDrive({
        company: "",
        minCgpa: "",
        deadline: "",
        degree: "All Degrees",
        jd: null,
      });
      setEditingDriveId("");
      setMessage(editingDriveId ? "Drive updated successfully." : "Drive uploaded successfully.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const submitMaterial = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("title", material.title);
      payload.append("createdBy", authUser?.username || authUser?.email || "student coordinator");
      if (material.file) {
        payload.append("file", material.file);
      }

      const data = await apiRequest("/materials", {
        method: "POST",
        body: payload,
      });

      setMaterials((currentMaterials) => [data.material, ...currentMaterials]);
      setMaterial({
        title: "",
        file: null,
      });
      setMessage("Material uploaded successfully.");
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  const handleLogout = () => {
    clearAuthUser();
    navigate("/coordinator");
  };

  const handleEditDrive = (savedDrive) => {
    setEditingDriveId(savedDrive._id);
    setDrive({
      company: savedDrive.company,
      minCgpa: savedDrive.minCgpa,
      deadline: savedDrive.deadline,
      degree: savedDrive.degree || "All Degrees",
      jd: null,
    });
    setActive("drive");
    setMessage("");
    setError("");
  };

  const handleDeleteDrive = async (driveId) => {
    try {
      setMessage("");
      setError("");
      await apiRequest(`/drives/${driveId}`, { method: "DELETE" });
      setDrives((currentDrives) => currentDrives.filter((savedDrive) => savedDrive._id !== driveId));
      if (editingDriveId === driveId) {
        setEditingDriveId("");
        setDrive({
          company: "",
          minCgpa: "",
          deadline: "",
          degree: "All Degrees",
          jd: null,
        });
      }
      setMessage("Drive deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleExportApplicants = (driveId) => {
    window.open(`http://localhost:5000/api/drives/${driveId}/applications/export`, "_blank");
  };

  const handleDeleteMaterial = async (materialId) => {
    try {
      setMessage("");
      setError("");
      await apiRequest(`/materials/${materialId}`, { method: "DELETE" });
      setMaterials((currentMaterials) =>
        currentMaterials.filter((savedMaterial) => savedMaterial._id !== materialId)
      );
      setMessage("Material deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <div className="sidebar">
        <h3>Coordinator Panel</h3>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>

        <p 
          onClick={() => setActive("drive")}
          style={{
            background: active==="drive" ? "white" : "",
            color: active==="drive" ? "#b30000" : ""
          }}
        >
          Upload Drive
        </p>

        <p 
          onClick={() => setActive("hub")}
          style={{
            background: active==="hub" ? "white" : "",
            color: active==="hub" ? "#b30000" : ""
          }}
        >
          Knowledge Hub
        </p>
      </div>

      {/* CONTENT */}
      <div className="content">
        {error ? <p className="form-message error-message dashboard-message">{error}</p> : null}
        {message ? <p className="form-message success-message dashboard-message">{message}</p> : null}

        {/* DRIVE FORM */}
        {active === "drive" && (
          <div>
            <h2>{editingDriveId ? "Edit Drive" : "Upload Drive"}</h2>

            <form onSubmit={submitDrive} className="form">
              <input name="company" placeholder="Company Name" value={drive.company} onChange={handleDriveChange} required />
              <input name="minCgpa" placeholder="Minimum CGPA" value={drive.minCgpa} onChange={handleDriveChange} required />
              <input type="date" name="deadline" value={drive.deadline} onChange={handleDriveChange} required />
              <select name="degree" value={drive.degree} onChange={handleDriveChange} required>
                {DRIVE_DEGREE_OPTIONS.map((degreeOption) => (
                  <option key={degreeOption} value={degreeOption}>
                    {degreeOption}
                  </option>
                ))}
              </select>

              <label>Upload JD (PDF)</label>
              <input type="file" name="jd" onChange={handleDriveChange} required={!editingDriveId} />

              <button type="submit">{editingDriveId ? "Save Drive" : "Upload"}</button>
              {editingDriveId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDriveId("");
                    setDrive({
                      company: "",
                      minCgpa: "",
                      deadline: "",
                      degree: "All Degrees",
                      jd: null,
                    });
                  }}
                >
                  Cancel Edit
                </button>
              ) : null}
            </form>

            <h2>Stored Drives</h2>
            {drives.length === 0 ? (
              <p className="dashboard-empty">No placement drives saved yet.</p>
            ) : (
              drives.map((savedDrive) => (
                <div key={savedDrive._id} className="drive-card">
                  <h3>{savedDrive.company}</h3>
                  <p>Minimum CGPA: {savedDrive.minCgpa}</p>
                  <p>Eligible Degree: {savedDrive.degree || "All Degrees"}</p>
                  <p>Deadline: {savedDrive.deadline}</p>
                  <p>
                    JD File:{" "}
                    {savedDrive.jdUrl ? (
                      <a href={savedDrive.jdUrl} target="_blank" rel="noreferrer">
                        {savedDrive.jdOriginalName || savedDrive.jdFileName}
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </p>
                  <p>Applicants: {savedDrive.applications?.length || 0}</p>
                  {savedDrive.applications?.length ? (
                    <div className="applicant-list">
                      {savedDrive.applications.map((application) => (
                        <div key={application._id}>
                          {application.name} ({application.regno})
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div className="action-row">
                    <button type="button" onClick={() => handleEditDrive(savedDrive)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteDrive(savedDrive._id)}>
                      Delete
                    </button>
                    <button type="button" onClick={() => handleExportApplicants(savedDrive._id)}>
                      Download Excel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* KNOWLEDGE HUB */}
        {active === "hub" && (
          <div>
            <h2>Upload Study Material</h2>

            <form onSubmit={submitMaterial} className="form">
              <input name="title" placeholder="Material Title" value={material.title} onChange={handleMaterialChange} required />

              <label>Upload PDF</label>
              <input type="file" name="file" onChange={handleMaterialChange} required />

              <button type="submit">Upload</button>
            </form>

            <h2>Stored Materials</h2>
            {materials.length === 0 ? (
              <p className="dashboard-empty">No materials saved yet.</p>
            ) : (
              materials.map((savedMaterial) => (
                <div key={savedMaterial._id} className="drive-card">
                  <h3>{savedMaterial.title}</h3>
                  <p>
                    File:{" "}
                    {savedMaterial.fileUrl ? (
                      <a href={savedMaterial.fileUrl} target="_blank" rel="noreferrer">
                        {savedMaterial.fileOriginalName || savedMaterial.fileName}
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </p>
                  <div className="action-row">
                    <button type="button" onClick={() => handleDeleteMaterial(savedMaterial._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default CoordinatorDashboard;
