import { jwtDecode } from "jwt-decode";

export const getProjectCode = () => {
  const token = localStorage.getItem("session-token");

  if (!token) return null;

  try {
    const decoded = jwtDecode(token);

    return decoded.project_code;
  } catch (err) {
    console.error("JWT decode error:", err);
    return null;
  }
};
