import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiBaseUrl, apiRequest } from "../config/api";
import { clearAuthUser, getAuthUser } from "../config/auth";

const DRIVE_DEGREE_OPTIONS = ["All Degrees", "IMTech", "MTech(CS)", "MTech(AI)"];
const STUDENT_APPLICATION_FIELDS = [
  { key: "name", label: "Name", order: 1 },
  { key: "email", label: "Email", order: 2 },
  { key: "regno", label: "Registration Number", order: 3 },
  { key: "year", label: "Passout Year", order: 4 },
  { key: "branch", label: "Branch", order: 5 },
  { key: "degree", label: "Degree", order: 6 },
  { key: "tenth", label: "10th Percentage", order: 7 },
  { key: "twelfth", label: "12th Percentage", order: 8 },
  { key: "ug", label: "UG CGPA", order: 9 },
  { key: "pg", label: "PG CGPA", order: 10 },
  { key: "collegeName", label: "College Name", order: 11 },
  { key: "resumeUrl", label: "Resume URL", order: 12 },
];
const DEFAULT_APPLICATION_FIELDS = STUDENT_APPLICATION_FIELDS.map((field) => ({
  ...field,
  source: "student",
  required: true,
}));

function normalizeCustomFieldKey(label) {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function currentMaxOrder(fields) {
  return fields.reduce((maxOrder, field) => {
    const fieldOrder = Number.parseInt(field.order, 10);
    return Number.isFinite(fieldOrder) && fieldOrder > maxOrder ? fieldOrder : maxOrder;
  }, 0);
}

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
    jd: null,
    applicationFields: DEFAULT_APPLICATION_FIELDS,
  });
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [customFieldOrder, setCustomFieldOrder] = useState("");

  const [material, setMaterial] = useState({
    title: "",
    file: null
  });
  const [drives, setDrives] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [driveData, materialData] = await Promise.all([
          apiRequest("/drives"),
          apiRequest("/materials"),
        ]);
        if (isMounted) {
          setDrives(driveData.drives);
          setMaterials(materialData.materials);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    };

    loadData();
    const refreshTimer = window.setInterval(loadData, 8000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
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
      payload.append("applicationFields", JSON.stringify(drive.applicationFields));

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
        applicationFields: DEFAULT_APPLICATION_FIELDS,
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
      applicationFields: savedDrive.applicationFields?.length
        ? savedDrive.applicationFields
        : DEFAULT_APPLICATION_FIELDS,
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
          applicationFields: DEFAULT_APPLICATION_FIELDS,
        });
      }
      setMessage("Drive deleted successfully.");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleExportApplicants = (driveId) => {
    window.open(`${apiBaseUrl}/drives/${driveId}/applications/export`, "_blank");
  };

  const toggleStudentApplicationField = (field) => {
    setDrive((currentDrive) => {
      const exists = currentDrive.applicationFields.some(
        (applicationField) => applicationField.source === "student" && applicationField.key === field.key
      );

      return {
        ...currentDrive,
        applicationFields: exists
          ? currentDrive.applicationFields.filter(
              (applicationField) =>
                !(applicationField.source === "student" && applicationField.key === field.key)
            )
          : [
              ...currentDrive.applicationFields,
              {
                ...field,
                source: "student",
                required: true,
                order: field.order,
              },
            ],
      };
    });
  };

  const updateApplicationFieldOrder = (fieldKey, source, order) => {
    const nextOrder = Number.parseInt(order, 10);

    setDrive((currentDrive) => ({
      ...currentDrive,
      applicationFields: currentDrive.applicationFields.map((field) =>
        field.key === fieldKey && field.source === source
          ? {
              ...field,
              order: Number.isFinite(nextOrder) && nextOrder > 0 ? nextOrder : "",
            }
          : field
      ),
    }));
  };

  const addCustomApplicationField = () => {
    const label = customFieldLabel.trim();
    const key = normalizeCustomFieldKey(label);

    if (!key) {
      return;
    }
    const parsedOrder = Number.parseInt(customFieldOrder, 10);
    const nextOrder =
      Number.isFinite(parsedOrder) && parsedOrder > 0
        ? parsedOrder
        : currentMaxOrder(drive.applicationFields) + 1;

    setDrive((currentDrive) => {
      const exists = currentDrive.applicationFields.some(
        (applicationField) => applicationField.key === key
      );

      if (exists) {
        return currentDrive;
      }

      return {
        ...currentDrive,
        applicationFields: [
          ...currentDrive.applicationFields,
          {
            key,
            label,
            source: "custom",
            required: true,
            order: nextOrder,
          },
        ],
      };
    });
    setCustomFieldLabel("");
    setCustomFieldOrder("");
  };

  const removeCustomApplicationField = (fieldKey) => {
    setDrive((currentDrive) => ({
      ...currentDrive,
      applicationFields: currentDrive.applicationFields.filter(
        (applicationField) => !(applicationField.source === "custom" && applicationField.key === fieldKey)
      ),
    }));
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

              <div className="field-builder">
                <h3>Excel Fields</h3>
                <div className="field-option-grid">
                  {STUDENT_APPLICATION_FIELDS.map((field) => {
                    const checked = drive.applicationFields.some(
                      (applicationField) =>
                        applicationField.source === "student" && applicationField.key === field.key
                    );

                    return (
                      <label key={field.key} className="field-option">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudentApplicationField(field)}
                        />
                        <span>{field.label}</span>
                        {checked ? (
                          <input
                            aria-label={`${field.label} column number`}
                            className="field-order-input"
                            min="1"
                            type="number"
                            value={
                              drive.applicationFields.find(
                                (applicationField) =>
                                  applicationField.source === "student" && applicationField.key === field.key
                              )?.order || ""
                            }
                            onChange={(event) =>
                              updateApplicationFieldOrder(field.key, "student", event.target.value)
                            }
                          />
                        ) : null}
                      </label>
                    );
                  })}
                </div>

                <div className="custom-field-row">
                  <input
                    value={customFieldLabel}
                    onChange={(event) => setCustomFieldLabel(event.target.value)}
                    placeholder="Add extra company column"
                  />
                  <input
                    min="1"
                    type="number"
                    value={customFieldOrder}
                    onChange={(event) => setCustomFieldOrder(event.target.value)}
                    placeholder="Column no."
                  />
                  <button type="button" onClick={addCustomApplicationField}>
                    Add Field
                  </button>
                </div>

                {drive.applicationFields.filter((field) => field.source === "custom").length ? (
                  <div className="selected-field-list">
                    {drive.applicationFields
                      .filter((field) => field.source === "custom")
                      .sort((firstField, secondField) => (firstField.order || 1) - (secondField.order || 1))
                      .map((field) => (
                        <span key={field.key}>
                          #{field.order || "-"} {field.label}
                          <input
                            aria-label={`${field.label} column number`}
                            className="field-order-input"
                            min="1"
                            type="number"
                            value={field.order || ""}
                            onChange={(event) =>
                              updateApplicationFieldOrder(field.key, "custom", event.target.value)
                            }
                          />
                          <button type="button" onClick={() => removeCustomApplicationField(field.key)}>
                            Remove
                          </button>
                        </span>
                      ))}
                  </div>
                ) : null}
              </div>

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
                      applicationFields: DEFAULT_APPLICATION_FIELDS,
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
                  <p>Excel Fields: {savedDrive.applicationFields?.length || 0}</p>
                  {savedDrive.applicationFields?.length ? (
                    <div className="selected-field-list">
                      {[...savedDrive.applicationFields]
                        .sort((firstField, secondField) => (firstField.order || 1) - (secondField.order || 1))
                        .map((field) => (
                          <span key={`${field.source}-${field.key}`}>
                            #{field.order || "-"} {field.label}
                          </span>
                        ))}
                    </div>
                  ) : null}
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
