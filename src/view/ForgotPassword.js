import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { Box, Card, TextField, Button, Typography } from "@mui/material";
import useToast from "../utils/useToast";
import api from "../services/api";

const ForgotPassword = () => {
  const { userId, userEmail } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState({
    password: "",
    confPass: "",
  });

  const handleSubmit = async () => {
    setError({
      password: "",
      confPass: "",
    });

    if (!password)
      return setError((prev) => ({ ...prev, password: "Password required" }));

    if (password.length < 8)
      return setError((prev) => ({
        ...prev,
        password: "Minimum 8 characters required",
      }));

    if ((password.match(/[a-z]/g) || []).length < 2)
      return setError((prev) => ({
        ...prev,
        password: "At least 2 lowercase letters required",
      }));

    if ((password.match(/[A-Z]/g) || []).length < 2)
      return setError((prev) => ({
        ...prev,
        password: "At least 2 uppercase letters required",
      }));

    if ((password.match(/\d/g) || []).length < 1)
      return setError((prev) => ({
        ...prev,
        password: "At least 1 digit required",
      }));

    if ((password.match(/[^A-Za-z0-9]/g) || []).length < 1)
      return setError((prev) => ({
        ...prev,
        password: "At least 1 special character required",
      }));

    if (/\s/.test(password))
      return setError((prev) => ({
        ...prev,
        password: "Spaces are not allowed",
      }));

    if (!confirmPassword)
      return setError((prev) => ({
        ...prev,
        confPass: "Confirm Password required",
      }));

    if (password !== confirmPassword)
      return setError((prev) => ({
        ...prev,
        confPass: "Passwords do not match",
      }));

    try {
      const res = await api.post("/forgot_pass", {
        identity: userEmail,
        password,
        id: userId,
      });

      if (res.data === 1) {
        toast.success("Password Reset Successfully!");
        navigate("/Auth");
      } else {
        setError("Invalid user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#f2f2f2",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        sx={{
          width: 360,
          p: 3,
          textAlign: "center",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <img
            src="https://biov3.s3.ap-south-1.amazonaws.com/vximage/kc.png"
            alt="logo"
            style={{ width: 140 }}
          />
        </Box>

        <Typography
          sx={{
            bgcolor: "#f5e6c8",
            py: 1,
            mb: 2,
            fontWeight: 500,
          }}
        >
          Forgot Password
        </Typography>

        <Typography
          variant="body2"
          sx={{ textAlign: "left", mb: 2, color: "#555" }}
        >
          <b>Please Note:</b>
          <br />
          <span style={{ fontSize: "9px" }}>
            Password must be at least 8 characters and include at least 2
            lowercase letters, 2 uppercase letters, 1 digit, and 1 special
            character (no spaces).
          </span>
        </Typography>

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => {
            const onlyText = e.target.value.replace(/\s+/g, "");
            setPassword(onlyText);
          }}
          error={!!error.password}
          helperText={error.password}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => {
            const onlyText = e.target.value.replace(/\s+/g, "");
            setConfirmPassword(onlyText);
          }}
          error={!!error.confPass}
          helperText={error.confPass}
          sx={{ mb: 2 }}
        />

        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: "#3c8dbc",
            "&:hover": { bgcolor: "#367fa9" },
          }}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </Card>
    </Box>
  );
};

export default ForgotPassword;
