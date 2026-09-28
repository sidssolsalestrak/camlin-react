import React, { useState, useEffect } from "react";
import {
    Button,
    Box,
    Typography,
    TextField,
    Paper,
    Divider,
    Link,
} from "@mui/material";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import SalesTrekimg from "../assets/kc.png";
import useToast from "../utils/useToast";

function LoginProjCode() {
    const backgroundImage =
        "https://biov3.s3.ap-south-1.amazonaws.com/vximage/bg1.jpg";
    const navigate = useNavigate();
    const [projCode, setProjCode] = useState(null)
    const [projcodeErr, setProjCodeErr] = useState(null)
    const [loading, setLoading] = useState(false)
    const toast = useToast()

    let handleSubmit = async () => {
        try {
            if (!projCode || projCode === "") {
                toast.error("Please Enter Project Code")
                return
            }
            setLoading(true)
            let response = await api.post(
                `/projectCodeValidation`,
                {
                    app_version: "",
                    proj_code: projCode,
                    ver_stat: "",
                    email_id: "",
                    app_build: "",
                }
            );

            if (response?.data?.status && Number(response.data.status) === 200) {
                toast.success(response?.data?.message || "Success")
                navigate('/login')
            } else {
                toast.error(response?.data?.message || "Please Enter Valid Project Code")
            }
        }
        catch (err) {
            console.log("project code submit err", err)
            toast.error("Something went wrong Try again!")
        }
        finally {
            setLoading(false)
        }
    }

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
                <Typography color="gray" mb={2}>
                    Log in to your SALESTRAK account
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Box>
                    <TextField
                        variant="outlined"
                        fullWidth
                        size="small"
                        sx={{ mb: 1.5 }}
                        label="Enter Project Code"
                        onChange={(e) => setProjCode(e.target.value)}
                        value={projCode}

                    />
                    <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        sx={{ mt: 1, mb: 2 }}
                        onClick={() => handleSubmit()}
                        disabled={loading}
                    >
                        Submit
                    </Button>
                </Box>

            </Paper>

        </Box>
    )


}

export default LoginProjCode