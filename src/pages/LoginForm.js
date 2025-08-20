import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Avatar,
  Stack,
  FormControlLabel,
  Checkbox,
  Alert,
  Fab,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
  IconButton,
  Snackbar,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Optional: If you have a custom password component, you can swap it in.
// import PasswordField from "../components/PasswordField";

export default function LoginForm() {
  // ---------- STATE ----------
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openSettings, setOpenSettings] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setmobileNumber] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isActivated, setIsActivated] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  const navigate = useNavigate();

  // ---------- HELPERS ----------
  const normalizeBaseUrl = (val) => {
    if (!val) return "";
    const trimmed = val.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
    return `https://${trimmed.replace(/\/$/, "")}`; // default to https
  };

  const SAVED_API = useMemo(
    () => localStorage.getItem("saved_sett_api_url") || "http://localhost:5100",
    []
  );

  // ---------- EFFECTS ----------
  useEffect(() => {
    // One-time download of a certificate (if present in /public)
    const downloadOnce = () => {
      const a = document.createElement("a");
      a.href = "/beeattcertificate.crt"; // must be relative to public/
      a.download = "beeattcertificate.crt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    if (!localStorage.getItem("folderDownloaded")) {
      downloadOnce();
      localStorage.setItem("folderDownloaded", "true");
    }
  }, []);

  useEffect(() => {
    const savedUsername = localStorage.getItem("saved_sett_mobilenumber");
    const savedPassword = localStorage.getItem("saved_password");
    const savedApiUrl = localStorage.getItem("saved_sett_api_url");
    const savedFullName = localStorage.getItem("saved_sett_fullname");

    if (savedApiUrl) setApiBaseUrl(savedApiUrl);
    if (savedFullName) setFullName(savedFullName);
    if (savedUsername) setmobileNumber(savedUsername);

    // Pre-fill login if user chose remember me previously
    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      if (localStorage.getItem("remember_me")) {
        navigate("/home");
      }
    }
  }, [navigate]);

  // ---------- ACTIONS ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const storedUsername = localStorage.getItem("saved_mobilenumber");
      const storedPassword = localStorage.getItem("saved_password");

      if (!storedUsername || !storedPassword) {
        setErrorMessage("No saved credentials. Please configure settings first.");
        setOpenSettings(true);
        return;
      }

      if (username === storedUsername && password === storedPassword) {
        if (rememberMe) {
          localStorage.setItem("saved_mobilenumber", username);
          localStorage.setItem("saved_password", password);
          localStorage.setItem("remember_me", "1");
        }
        localStorage.setItem("sessionToken", "local-auth");
        localStorage.setItem("shared_username", username);
        localStorage.setItem(
          "shared_fullname",
          localStorage.getItem("saved_sett_fullname") || ""
        );
        localStorage.setItem("userrole", "local");
        navigate("/home");
      } else {
        setErrorMessage("Invalid username or password.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const recoveryCredential = async () => {
    try {
      const userObj = localStorage.getItem("saved_sett_mobilenumber");
      const base = normalizeBaseUrl(localStorage.getItem("saved_sett_api_url"));
      if (!base) throw new Error("API URL not set");

      const { data } = await axios.get(`${base}/api/recovery-credential`, {
        params: { userObj },
      });

      const { username, password } = data;
      localStorage.setItem("saved_mobilenumber", username);
      localStorage.setItem("saved_password", password);
      setUsername(username);
      setPassword(password);
      setIsActivated(true);
      setSnack({ open: true, message: "Credentials recovered.", severity: "success" });
    } catch (error) {
      console.error("Failed to recover credentials:", error);
      setSnack({ open: true, message: "Recovery failed. Check server.", severity: "error" });
    }
  };

  const activateDevice = async () => {
    const savedApiUrl = localStorage.getItem("saved_sett_api_url");
    if (!savedApiUrl) {
      setSnack({ open: true, message: "API URL not set. Please configure settings.", severity: "error" });
      setOpenSettings(true);
      return;
    }

    try {
      setIsActivating(true);
      const base = normalizeBaseUrl(savedApiUrl);
      const { data } = await axios.get(`${base}/api/generate-android-id`, {
        params: { mobilenumber: mobileNumber },
      });

      const { mobilenumber, password } = data;
      localStorage.setItem("saved_mobilenumber", mobilenumber);
      localStorage.setItem("saved_password", password);
      setUsername(mobilenumber);
      setPassword(password);
      setIsActivated(true);
      setSnack({ open: true, message: "Device activated successfully.", severity: "success" });
    } catch (error) {
      setSnack({ open: true, message: "Activation failed. Check server or network.", severity: "error" });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveSettings = () => {
    if (!fullName || !mobileNumber || !apiBaseUrl) {
      setSettingsError("Please fill in all required fields.");
      return;
    }
    setSettingsError("");
    localStorage.setItem("saved_sett_fullname", fullName);
    localStorage.setItem("saved_sett_mobilenumber", mobileNumber);
    localStorage.setItem("saved_sett_api_url", apiBaseUrl);
    setOpenSettings(false);
    setSnack({ open: true, message: "Settings saved.", severity: "success" });
  };

  const clearPWAData = () => {
    try {
      sessionStorage.clear();
      if (indexedDB?.databases) {
        indexedDB.databases().then((dbs) => {
          dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
        });
      }
      if ("caches" in window) {
        caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
      }
      setTimeout(() => window.location.reload(true), 400);
    } catch (e) {
      console.error(e);
    }
  };

  // ---------- UI ----------
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        // Subtle gradient + image overlay for a premium feel
        background: {
          xs: `linear-gradient(135deg, rgba(0,77,64,.85), rgba(0,131,143,.75)), url('/bg-texture.svg')`,
          md: `linear-gradient(135deg, rgba(0,77,64,.75), rgba(0,131,143,.65)), url('/bg-texture.svg')`,
        },
        backgroundSize: "cover",
        backgroundPosition: "center",
        p: 2,
      }}
    >
      <Card
        elevation={12}
        sx={{
          width: 420,
          maxWidth: "92vw",
          borderRadius: 4,
          overflow: "hidden",
          backdropFilter: "blur(10px)",
          bgcolor: "rgba(255,255,255,0.9)",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: "#00838f", width: 64, height: 64 }}>
              <FingerprintIcon fontSize="large" />
            </Avatar>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: "#004d40", fontFamily: `"Times New Roman", serif` }}
            >
              Bee Attendance
            </Typography>
            {isActivated ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CheckCircleRoundedIcon fontSize="small" color="success" />
                <Typography variant="caption" color="success.main">
                  Device Activated
                </Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <ErrorOutlineRoundedIcon fontSize="small" color="warning" />
                <Typography variant="caption" color="warning.main">
                  Activation Required
                </Typography>
              </Stack>
            )}
          </Stack>

          {errorMessage && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Mobile Number"
              margin="normal"
              variant="outlined"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\D/g, ""))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Replace with your PasswordField if preferred */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              margin="normal"
              variant="outlined"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label="toggle password visibility">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" />}
                label="Remember me"
              />
              <Link
                href="#"
                underline="hover"
                onClick={(e) => {
                  e.preventDefault();
                  recoveryCredential();
                }}
              >
                Forgot password?
              </Link>
            </Stack>

            <LoadingButton
              fullWidth
              loading={isSubmitting}
              type="submit"
              variant="contained"
              sx={{
                mt: 2,
                py: 1.2,
                fontWeight: 700,
                letterSpacing: 0.3,
                bgcolor: "#004d40",
                ":hover": { bgcolor: "#003d33" },
              }}
            >
              Log In
            </LoadingButton>

            <LoadingButton
              fullWidth
              loading={isActivating}
              onClick={activateDevice}
              variant="outlined"
              sx={{
                mt: 1.5,
                py: 1.1,
                borderWidth: 2,
                ":hover": { borderWidth: 2 },
              }}
            >
              Activate My Device
            </LoadingButton>

            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Password recovery only works when the app is connected to server.
            </Typography>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
              <Button size="small" color="inherit" onClick={clearPWAData}>Reset App Data</Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog
  open={openSettings}
  onClose={() => setOpenSettings(false)}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: {
      borderRadius: 3,
      background: "linear-gradient(135deg, #ffffff, #e0f7fa)",
    },
  }}
>
  {settingsError && (
    <Alert severity="error" sx={{ m: 2, mb: 0 }}>
      {settingsError}
    </Alert>
  )}

  <DialogTitle sx={{ mb: 1.5 }}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Avatar sx={{ bgcolor: "#00838f", width: 44, height: 44 }}>
        <FingerprintIcon />
      </Avatar>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#004d40" }}>
          App Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Fill App Settings
        </Typography>
      </Box>
    </Stack>
  </DialogTitle>

  <DialogContent>
    <Stack spacing={3}>
      <TextField
        fullWidth
        label="Full Name"
        value={fullName}
        required
        onChange={(e) => setFullName(e.target.value)}
        variant="outlined"
      />

      <TextField
        fullWidth
        label="Mobile Number"
        value={mobileNumber}
        required
        onChange={(e) => setmobileNumber(e.target.value.replace(/\D/g, ""))}
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        variant="outlined"
      />

      <TextField
        fullWidth
        label="API Base URL (IP:PORT or full URL)"
        value={apiBaseUrl}
        required
        onChange={(e) => setApiBaseUrl(e.target.value)}
        helperText="Examples: 10.0.0.12:5100  •  https://api.example.com"
        variant="outlined"
      />
    </Stack>
  </DialogContent>

  <DialogActions sx={{ justifyContent: "space-between", p: 3, pt: 1 }}>
    <Button onClick={() => setOpenSettings(false)} variant="text" color="inherit">
      Cancel
    </Button>
    <Button
      onClick={handleSaveSettings}
      variant="contained"
      sx={{ bgcolor: "#00838f", ":hover": { bgcolor: "#006064" } }}
    >
      Save
    </Button>
  </DialogActions>
</Dialog>

      {/* Floating Settings Button */}
      <Fab
        color="primary"
        size="medium"
        sx={{ position: "absolute", bottom: 16, right: 16, boxShadow: 8 }}
        onClick={() => setOpenSettings(true)}
        aria-label="open settings"
      >
        <SettingsIcon />
      </Fab>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.message}
      />
    </Box>
  );
}
