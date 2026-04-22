import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../config/api";

const STUDENT_DEGREE_OPTIONS = ["IMTech", "MTech(CS)", "MTech(AI)"];

function StudentRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    regno: "",
    year: "",
    branch: "",
    degree: "",
    password: "",
    confirmPassword: "",
    tenth: "",
    twelfth: "",
    ug: "",
    pg: "",
    resume: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("regno", form.regno);
      payload.append("year", form.year);
      payload.append("branch", form.branch);
      payload.append("degree", form.degree);
      payload.append("password", form.password);
      payload.append("tenth", form.tenth);
      payload.append("twelfth", form.twelfth);
      payload.append("ug", form.ug);
      payload.append("pg", form.pg);

      if (form.resume) {
        payload.append("resume", form.resume);
      }

      await apiRequest("/students/register", {
        method: "POST",
        body: payload,
      });

      setMessage("Registration successful. You can log in now.");
      setForm({
        name: "",
        email: "",
        regno: "",
        year: "",
        branch: "",
        degree: "",
        password: "",
        confirmPassword: "",
        tenth: "",
        twelfth: "",
        ug: "",
        pg: "",
        resume: null,
      });

      setTimeout(() => {
        navigate("/student");
      }, 1000);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-card" onSubmit={handleSubmit}>
        <h2>Student Registration</h2>
        {error ? <p className="form-message error-message">{error}</p> : null}
        {message ? <p className="form-message success-message">{message}</p> : null}

        {/* SECTION 1 */}
        <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
        <input
          name="email"
          placeholder="College Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="regno"
          placeholder="Registration Number"
          value={form.regno}
          onChange={handleChange}
          required
        />
        <input name="year" placeholder="Passout Year" value={form.year} onChange={handleChange} required />
        <input name="branch" placeholder="Branch" value={form.branch} onChange={handleChange} required />

        {/* DEGREE DROPDOWN */}
        <select name="degree" value={form.degree} onChange={handleChange} required>
          <option value="">Select Degree</option>
          {STUDENT_DEGREE_OPTIONS.map((degreeOption) => (
            <option key={degreeOption} value={degreeOption}>
              {degreeOption}
            </option>
          ))}
        </select>

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
        />

        <h3>Education Details</h3>

        {/* SECTION 2 */}
        <input name="tenth" placeholder="10th Percentage" value={form.tenth} onChange={handleChange} />
        <input
          name="twelfth"
          placeholder="12th Percentage"
          value={form.twelfth}
          onChange={handleChange}
        />
        <input name="ug" placeholder="UG CGPA" value={form.ug} onChange={handleChange} />
        <input name="pg" placeholder="PG CGPA" value={form.pg} onChange={handleChange} />

        {/* RESUME */}
        <label>Upload Resume</label>
        <input type="file" name="resume" onChange={handleChange} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default StudentRegister;
