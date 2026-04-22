import { useEffect, useState } from "react";
import { apiRequest } from "../config/api";

function ForgotPasswordForm({ title, fields, endpoint }) {
  const initialForm = fields.reduce((accumulator, field) => {
    accumulator[field.name] = "";
    return accumulator;
  }, {});

  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      setIsSubmitting(true);
      await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setMessage("Password updated. You can log in with the new password.");
      setForm(initialForm);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setError("");
    setMessage("");
    setForm(initialForm);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button type="button" className="forgot-password-link" onClick={openModal}>
        Forgot Password?
      </button>

      {isOpen ? (
        <div className="forgot-password-overlay" onClick={closeModal}>
          <div className="forgot-password-card" onClick={(event) => event.stopPropagation()}>
            <div className="forgot-password-header">
              <h3>{title}</h3>
              <button type="button" className="forgot-password-close" onClick={closeModal}>
                Close
              </button>
            </div>
            {error ? <p className="form-message error-message">{error}</p> : null}
            {message ? <p className="form-message success-message">{message}</p> : null}
            <form onSubmit={handleSubmit}>
              {fields.map((field) => (
                <input
                  key={field.name}
                  type={field.type || "text"}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                  required
                />
              ))}
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ForgotPasswordForm;
