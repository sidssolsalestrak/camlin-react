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
  const [isLoading,setIsLoading] =useState(false)

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setEmailMob("");
    setOtpInput("");
    setOtpSent(false);
    setUserId("");
    setSessionId("");
  };

  const goToStep = (newStep) => {
    resetFields();
    setStep(newStep);
  };

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
        } 
        else if(data.otp_verify){
         toast.success("Please Enter assigned OTP");
         localStorage.setItem("otp-token",data.otptoken)
         navigate('/otp_validate')
        }
        else {
          navigate("/dashboard");
        }
      } else {
        toast.error(data.message || "Username / Password incorrect!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  const handleForgotSubmit = async () => {
    if (!email) {
      toast.error("Please Enter Register Email Id");
      return;
    }

    try {
      const res = await api.post("/check_email_id", {
        email: email,
      });

      if (String(res.data).trim() !== "") {
        toast.success("An email was sent to the Registered email address");
        navigate("/Auth");
      } else {
        toast.error("Email Id Not Registered");
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

  const handleKeyDown = (e) => {
      if (e.key === "Enter" && otpInput.length === 4 && !isLoading) {
      handleVerifyOtp();
  }
    };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 4) {
      toast.error("Please Enter a Valid 4-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/verify_otp", {
        user_id: btoa(userId),
        otp: btoa(otpInput),
      });

      const data = res.data;

      if (data.stat === 200 && data.success) {
        localStorage.setItem("session-token", data.token);
        navigate("/dashboard");
        return;
      }

      // account blocked — no point letting them retry here
      if (data.message?.toLowerCase().includes("blocked")) {
        toast.error(data.message);
        goToStep("login");
        return;
      }

      // wrong OTP — clear the field so they can re-enter cleanly
      toast.error(data.message || "Invalid OTP");
      setOtpInput("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
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
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/^\s+/, "");
                  setEmail(onlyText);
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                size="small"
                sx={{ mb: 1.5 }}
                value={password}
                onChange={(e) => {
                  const onlyText = e.target.value.replace(/\s+/g, "");
                  setPassword(onlyText);
                }}
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
              onClick={() => goToStep("forgot")}
            >
              Forgot Password
            </Link>

            <Box
              sx={{ display: "flex", mt: 2, justifyContent: "space-around" }}
            >
              <Typography>
                <Link component="button" 
                onClick={() => goToStep("otp")}>
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
                  onClick={() => goToStep("qr")}
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
              onChange={(e) => {
                const onlyText = e.target.value.replace(/\s+/g, "");
                setEmail(onlyText);
              }}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="contained"
                color="success"
                sx={{ width: "45%" }}
                onClick={() => goToStep("login")}
              >
                BACK
              </Button>

              <Button
                variant="contained"
                color="success"
                sx={{ width: "45%" }}
                onClick={() => handleForgotSubmit()}
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
                  onChange={(e) => {
                    const onlyText = e.target.value.replace(/\s+/g, "");
                    setEmailMob(onlyText);
                  }}
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
               <Typography
                 color="gray" 
                 sx={{ paddingTop: "0.5rem", fontSize: "1.1rem", opacity: "0.9"}}
                >
                Enter 4 digit Assigned OTP
                </Typography>
              <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  inputMode="numeric"
                  autoFocus
                  inputProps={{
                    pattern: "[0-9]*",
                    maxLength: 4,
                  }}
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
                    mb: 1.5,
                    mt: 1,
                    backgroundColor: "white",
                  }}
                  value={otpInput}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setOtpInput(value);
                  }}
                  onKeyDown={handleKeyDown}
                />

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  sx={{ mt: 1 }}
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}

            <Button sx={{ mt: 1 }} onClick={() => goToStep("login")}>
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
              </>
            )}

            <Button sx={{ mt: 2 }} onClick={() => goToStep("login")}>
              Back
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default Login;
