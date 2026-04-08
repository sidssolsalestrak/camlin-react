import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { Box, Card, TextField, Button, Typography } from "@mui/material";
import useToast from "../utils/useToast";

const ForgotPassword = () => {
  const { userId, userEmail } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!password) return setError("Password required");
    if (password.length < 8) return setError("Minimum 8 characters required");
    if (!/\d/.test(password)) return setError("At least one number required");
    if (password !== confirmPassword) return setError("Passwords do not match");

    try {
      const res = await axios.post("/forgot_pass", {
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
          Password must be 8–32 characters and include at least one number
        </Typography>

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

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
