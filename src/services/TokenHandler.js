import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function TokenHandler() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      localStorage.setItem("session-token", token);
    }

    navigate("/");
  }, [token, navigate]);

  return null;
}