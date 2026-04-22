import { Navigate } from "react-router-dom";
import { getAuthUser } from "../config/auth";

function ProtectedRoute({ allowedRoles, children }) {
  const user = getAuthUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
