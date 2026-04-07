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
import { QRCodeCanvas } from "qrcode.react";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import SalesTrekimg from "../assets/kc.png";
import otpIcon from "../assets/otp_icon.png";
import useToast from "../utils/useToast";

function Login() {
  const backgroundImage =
    "https://biov3.s3.ap-south-1.amazonaws.com/vximage/bg1.jpg";

  const navigate = useNavigate();

  const [step, setStep] = useState("login"); // login | otp | qr
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sessionId, setSessionId] = useState("");
  const [timer, setTimer] = useState(120);

  const toast = useToast();

  const [otpInput, setOtpInput] = useState("");
  const [userId, setUserId] = useState("");
  const [emailMob, setEmailMob] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const createQr = async () => {
    const res = await api.post("/createQrSession");
    setSessionId(res.data.sessionId);
    setTimer(120);
  };

  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setSessionId("");
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const poll = setInterval(async () => {
      const res = await api.get(`/checkQrSession/${sessionId}`);
      if (res.data.status === "authenticated") {
        localStorage.setItem("session-token", res.data.token);
        navigate("/dashboard");
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [sessionId]);

  const handleLogin = async () => {
    try {
      if (!email) {
        toast.error("Please Enter User Name");
        return;
      }

      if (!password) {
        toast.error("Please Enter Password");
        return;
      }

      const res = await api.post("/login", {
        identity: email,
        password: password,
      });

      const data = res.data;

      if (data.success) {
        if (data.success_login) {
          toast.success("Login Successful");
          localStorage.setItem("session-token", data.token || "");
          navigate("/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error("Username / Password incorrect!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleSendOtp = async () => {
    try {
      if (!emailMob) {
        toast.error("Enter Email / Mobile");
        return;
      }

      let mob_stat = 0;
      let email_stat = 0;

      if (isNaN(emailMob)) {
        email_stat = 1;
      } else {
        mob_stat = 1;
      }

      const res = await api.post("/send_otp", {
        mob_stat: btoa(mob_stat),
        email_stat: btoa(email_stat),
        email_mob: btoa(emailMob),
      });

      let data = atob(res.data);
      data = JSON.parse(data);

      if (data.stat === 200) {
        toast.success("OTP Sent Successfully");
        setUserId(data.user_id);
        setOtpSent(true);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await api.post("/verify_otp", {
        user_id: btoa(userId),
        otp: btoa(otpInput),
      });

      const data = res.data;

      if (data.stat === 200 && data.success) {
        localStorage.setItem("session-token", data.token);
        navigate("/dashboard");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
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
        {/* 🔹 LOGO */}
        <Box
          component="img"
          src={SalesTrekimg}
          alt="logo"
          sx={{ height: 40, mb: 2, pl: 5 }}
        />

        {/* 🔹 TITLE */}
        <Typography variant="h4" sx={{ fontWeight: 500 }}>
          WELCOME
        </Typography>

        <Typography color="gray" mb={2}>
          Log in to your SALESTRAK account
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* ================= LOGIN ================= */}
        {step === "login" && (
          <>
            <Box>
              <TextField
                variant="outlined"
                fullWidth
                size="small"
                sx={{ mb: 1.5 }}
                label="User Name"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                size="small"
                sx={{ mb: 1.5 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Box>

            <Button
              variant="contained"
              color="success"
              fullWidth
              onClick={handleLogin}
            >
              LOGIN
            </Button>

            <Link
              component="button"
              sx={{ display: "block", mt: 0.5 }}
              onClick={() => setStep("forgot")}
            >
              Forgot Password
            </Link>

            <Box
              sx={{ display: "flex", mt: 2, justifyContent: "space-around" }}
            >
              <Typography>
                <Link component="button" onClick={() => setStep("otp")}>
                  Log in via OTP
                  {/* <Box
                    component="img"
                    src={otpIcon}
                    alt="logo"
                    sx={{ height: 40 }}
                  /> */}
                </Link>
              </Typography>

              <Typography>
                <Link
                  component="button"
                  onClick={() => setStep("qr")}
                  sx={{ display: "flex" }}
                >
                  Login via QR
                  <MdOutlineQrCodeScanner
                    color="black"
                    style={{ fontSize: "20px" }}
                  />
                </Link>
              </Typography>
            </Box>
          </>
        )}

        {/* ================= FORGOT PASSWORD ================= */}
        {step === "forgot" && (
          <>
            <Typography sx={{ textAlign: "left", fontWeight: 600, mb: 1 }}>
              Forgot Password
            </Typography>

            <TextField
              fullWidth
              label="Register Email Id"
              type="text"
              variant="outlined"
              size="small"
              sx={{ mt: 1, mb: 1 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="contained"
                color="success"
                sx={{ width: "45%" }}
                onClick={() => setStep("login")}
              >
                BACK
              </Button>

              <Button
                variant="contained"
                color="success"
                sx={{ width: "45%" }}
                onClick={() => {
                  // call your forgot API here
                  console.log("Submit forgot password");
                }}
              >
                SUBMIT
              </Button>
            </Box>
          </>
        )}

        {/* ================= OTP ================= */}
        {step === "otp" && (
          <>
            {!otpSent ? (
              <>
                <TextField
                  fullWidth
                  label="Email / Mobile"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, mb: 1 }}
                  value={emailMob}
                  onChange={(e) => setEmailMob(e.target.value)}
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  sx={{ mt: 1 }}
                  onClick={handleSendOtp}
                >
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1, mb: 1 }}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  sx={{ mt: 1 }}
                  onClick={handleVerifyOtp}
                >
                  Verify OTP
                </Button>
              </>
            )}

            <Button sx={{ mt: 1 }} onClick={() => setStep("login")}>
              Back
            </Button>
          </>
        )}

        {/* ================= QR ================= */}
        {step === "qr" && (
          <>
            <Typography variant="h6">Scan QR</Typography>

            {!sessionId ? (
              <Button variant="contained" sx={{ mt: 2 }} onClick={createQr}>
                Generate QR
              </Button>
            ) : (
              <>
                <Box mt={2}>
                  <QRCodeCanvas value={sessionId} size={200} />
                </Box>
                <Typography mt={2}>Expires in: {timer}s</Typography>
                <Button sx={{ mt: 2 }} onClick={() => setStep("login")}>
                  Back
                </Button>
              </>
            )}

            <Button sx={{ mt: 2 }} onClick={() => setStep("login")}>
              Back
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default Login;
