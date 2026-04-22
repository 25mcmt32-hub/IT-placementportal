import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { coordinatorCredentials } from "../config/adminAuth";
import { apiRequest } from "../config/api";
import { saveAuthUser } from "../config/auth";

function CoordinatorLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    try {
      setIsSubmitting(true);

      const data = await apiRequest("/auth/coordinator/login", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      saveAuthUser(data.user);
      navigate("/coordinator-dashboard");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login">
      <h2>Student Coordinator Login</h2>
      {error ? <p className="form-message error-message">{error}</p> : null}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          autoComplete="username"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <ForgotPasswordForm
        title="Forgot Coordinator Password?"
        endpoint="/auth/coordinator/forgot-password"
        fields={[
          { name: "username", placeholder: "Username" },
          { name: "email", type: "email", placeholder: "Registered Email" },
          { name: "newPassword", type: "password", placeholder: "New Password" },
        ]}
      />
      <p>Demo username: {coordinatorCredentials.username}</p>
      <p>Demo password: {coordinatorCredentials.password}</p>
      <p>Demo email: coordinator_admin@portal.local</p>
      
    </div>
  );
}

export default CoordinatorLogin;
