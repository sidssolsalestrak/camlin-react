import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, TextField, Button, Typography } from "@mui/material";
import useToast from "../utils/useToast";
import Layout from "../layout";
import api from "../services/api";

const ChangePassword = () => {
  const toast = useToast();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [newPasswordConfirmError, setNewPasswordConfirmError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("session-token");
      toast.success("Logout Successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong Try again!!");
    }
  };

  const handleSubmit = async () => {
    setOldPasswordError("");
    setNewPasswordError("");
    setNewPasswordConfirmError("");

    let hasError = false;

    if (!oldPassword) {
      setOldPasswordError("Old password is required");
      hasError = true;
    }

    if (!newPassword) {
      setNewPasswordError("New password is required");
      hasError = true;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Minimum 8 characters required");
      hasError = true;
    } else if (!/\d/.test(newPassword)) {
      setNewPasswordError("At least one number required");
      hasError = true;
    }

    if (!newPasswordConfirm) {
      setNewPasswordConfirmError("Confirm password is required");
      hasError = true;
    } else if (newPassword && newPasswordConfirm !== newPassword) {
      setNewPasswordConfirmError("Passwords do not match");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await api.post("/change_password", {
        old: oldPassword,
        new: newPassword,
        new_confirm: newPasswordConfirm,
      });

      if (res.data.stat === 200) {
        toast.success(res.data.message);
        setOldPassword("");
        setNewPassword("");
        setNewPasswordConfirm("");
        setTimeout(() => {
          handleLogout();
        }, 2000);
      } else {
        toast.error(res.data.message);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <Layout breadcrumb={[
            { label: "Home", path: "/" },
            { label: "Change Password", path:"/change_password"}
            ]}>
    <Box sx={{ p: 3 }}>

      <Card sx={{ p: 3,width:'60%' }}>
        <Box  sx={{width:'90%'}}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Change Password
        </Typography>

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          error={!!oldPasswordError}
          helperText={oldPasswordError}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          size="small"
          type="password"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={!!newPasswordError}
          helperText={newPasswordError}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          size="small"
          type="password"
          label="Confirm New Password"
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
          error={!!newPasswordConfirmError}
          helperText={newPasswordConfirmError}
          sx={{ mb: 2 }}
          required
        />

        <Box sx={{ textAlign: "right" }}>
          <Button variant="contained" disabled={loading} onClick={handleSubmit}>
            {loading ? "Changing..." : "Change"}
          </Button>
        </Box>
        </Box>
      </Card>
    </Box>
    </Layout>
  );
};

export default ChangePassword;