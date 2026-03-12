import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TokenHandler() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = atob(token);
        localStorage.setItem("session-token", decodedToken);
        navigate("/");
      } catch (err) {
        console.error("Invalid Base64 token", err);
      }
    }
  }, [token, navigate]);

  return null;
}