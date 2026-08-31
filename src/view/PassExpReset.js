import React, { useState } from "react";
import {
    Button,
    Box,
    Typography,
    TextField,
    Paper,
    Divider,
} from "@mui/material";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import SalesTrekimg from "../assets/kc.png";
import useToast from "../utils/useToast";

function PassExpReset() {
    const backgroundImage =
        "https://biov3.s3.ap-south-1.amazonaws.com/vximage/bg1.jpg";
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [oldpass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        if (!email || !oldpass || !newPass) {
            toast.error("All fields are required");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post("/reset_expired_password", {
                email,
                old: oldpass,
                new: newPass,
            });

            if (res.data.success) {
                toast.success(res.data.message || "Password reset successfully");
                navigate("/login");
            } else {
                toast.error(res.data.message || "Something went wrong");
            }
        } catch (err) {
            console.error("reset password error:", err);
            toast.error(
                err?.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Paper
                elevation={5}
                sx={{
                    width: 400,
                    p: 4,
                    borderRadius: "16px",
                    textAlign: "center",
                    background: "#fff",
                }}
            >
                <Box
                    component="img"
                    src={SalesTrekimg}
                    alt="logo"
                    sx={{ height: 40, mb: 2, pl: 5 }}
                />
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    RESET PASSWORD
                </Typography>
                <Typography color="gray" mb={2}>
                    Your password has expired. Please reset it to continue.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Box>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        sx={{ mb: 1.5 }}
                        label="Enter Email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                    />
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        type="password"
                        sx={{ mb: 1.5 }}
                        label="Enter Old Password"
                        onChange={(e) => setOldPass(e.target.value)}
                        value={oldpass}
                    />
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        type="password"
                        sx={{ mb: 1.5 }}
                        label="Enter New Password"
                        onChange={(e) => setNewPass(e.target.value)}
                        value={newPass}
                    />
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ mt: 1, mb: 2 }}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Submitting..." : "Submit"}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default PassExpReset;