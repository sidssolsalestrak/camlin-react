import React, { useState, useEffect } from "react";
import {
    Button,
    Box,
    Typography,
    TextField,
    Paper,
    Divider,
    Link,
    CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import SalesTrekimg from "../assets/kc.png";
import useToast from "../utils/useToast";

function OtpTwoStepValidate() {
    const backgroundImage =
        "https://biov3.s3.ap-south-1.amazonaws.com/vximage/bg1.jpg";
    const navigate = useNavigate();
    const toast = useToast();
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("otp-token");
        if (!token) {
            navigate("/auth/login", { replace: true });
        }
    }, [navigate]);

    const handleSubmitOtp = async () => {
        if (otp.length !== 4) {
            toast.error("Please enter the 4 digit OTP");
            return;
        }

        setIsLoading(true);
        try {
            const otpToken = localStorage.getItem("otp-token");

            const { data } = await api.post(
                `/otp_validate`,
                { otp },
                {
                    headers: {
                        Authorization: `Bearer ${otpToken}`,
                    },
                }
            );

            if (data.success) {
                localStorage.setItem("session-token", data.token);
                localStorage.removeItem("otp-token");
                toast.success("Login Successful");
                navigate("/dashboard", { replace: true });
            } else {
                toast.error(data.message || "Invalid OTP");
            }
        } catch (err) {
            console.log("otp submission err", err);
            const errMessage =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Something went wrong. Please try again!";
            toast.error(errMessage);

            // account blocked / OTP expired — send back to login
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                const lowerMsg = errMessage.toLowerCase();
                if (lowerMsg.includes("blocked") || lowerMsg.includes("expired")) {
                    localStorage.removeItem("otp-token");
                    setTimeout(() => navigate("/auth/login", { replace: true }), 1500);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && otp.length === 4 && !isLoading) {
            handleSubmitOtp();
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
                <Typography variant="h4" sx={{ fontWeight: 500 }}>
                    WELCOME
                </Typography>
                <Typography
                   color="gray" 
                   sx={{ paddingTop: "1rem", fontSize: "1.1rem", opacity: "0.9"}}

                >
                    Enter 4 digit Assigned OTP
                </Typography>
                <TextField
                    variant="outlined"
                    size="small"
                    fullWidth
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    inputProps={{
                        pattern: "[0-9]*",
                        maxLength: 4,
                    }}
                    value={otp}
                    onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setOtp(value);
                    }}
                    onKeyDown={handleKeyDown}
                    sx={{
                        "& .MuiInputBase-input": {
                            fontSize: "1.5rem",
                            textAlign: "center",
                            letterSpacing: "0.5rem",
                            height: "1.8rem",
                        },
                        "& .MuiInputLabel-root": {
                            fontSize: "1.2rem",
                        },
                        "& .MuiOutlinedInput-root": {
                            backgroundColor: "white",
                            borderRadius: "0px",
                            "& fieldset": {
                                border: "none",
                            },
                            "&:hover fieldset": {
                                border: "none",
                            },
                        },
                        border: "1.5px solid rgba(27, 159, 166, 1)",
                        mb: 2,
                        mt: 1,
                        backgroundColor: "white",
                    }}

                />
                <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    color="success"
                    disabled={isLoading || otp.length !== 4}
                    onClick={handleSubmitOtp}
                    sx={{
                        marginTop: 3,
                        marginBottom: 2,
                        height: "30px",
                        fontSize: "1.15rem",
                    }}
                >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : "SUBMIT"}
                </Button>

            </Paper>

        </Box>

    )
}

export default OtpTwoStepValidate