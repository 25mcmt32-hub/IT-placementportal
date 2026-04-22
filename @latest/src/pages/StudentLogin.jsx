import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { apiRequest } from "../config/api";
import { saveAuthUser } from "../config/auth";

function StudentLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      setIsSubmitting(true);

      const data = await apiRequest("/auth/student/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      saveAuthUser(data.user);
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login">
      <h2>Student Login</h2>
      {error ? <p className="form-message error-message">{error}</p> : null}

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="College Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <ForgotPasswordForm
        title="Forgot Student Password?"
        endpoint="/auth/student/forgot-password"
        fields={[
          { name: "email", type: "email", placeholder: "Registered Email" },
          { name: "newPassword", type: "password", placeholder: "New Password" },
        ]}
      />
      <p>
        Don't have an account?{" "}
        <span onClick={() => navigate("/register")} style={{ color: "blue", cursor: "pointer" }}>
          Register
        </span>
      </p>
      
    </div>
  );
}

export default StudentLogin;
