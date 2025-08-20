import React, { useState, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Stack,
  IconButton,
  TextField,
  Button,
  Divider,
  Chip,
  Tooltip,
  Snackbar,
} from "@mui/material";
import { Table, TableBody, TableRow, TableCell } from "@mui/material";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import RoomIcon from "@mui/icons-material/Room";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { LoadingButton } from "@mui/lab";
// import DeviceDetector from "device-detector-js"; // not used in snippet
import db from "../db";
import {
  getBrowserAndOS,
  getPublicIP,
  fetchAddressFromCoordinates,
  handleSync,
  pingServer,
} from "../utils/global_functions";

export default function FingerprintScanner() {
  const API_BASE_URL =
    localStorage.getItem("saved_sett_api_url") || "http://localhost:5100";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [showCameraFallback, setShowCameraFallback] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [comment, setComment] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const fileInputRef = useRef(null);

  const handleFingerprintClick = async () => {
    const now = new Date();

    setError("");
    setLoading(true);
    setLocation(null);
    setCapturedImage(null);
    setShowCameraFallback(false);

    // Fallback in 60 seconds if GPS/address fails
    const fallbackTimeout = setTimeout(() => {
      setShowCameraFallback(true);
      setLoading(false);
    }, 60000);

    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      setShowCameraFallback(true);
      setLoading(false);
      clearTimeout(fallbackTimeout);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(fallbackTimeout);

        const { latitude, longitude } = position.coords;
        let address = "Unknown location";

        try {
          if (navigator.onLine) {
            address = await fetchAddressFromCoordinates(latitude, longitude);
          }
        } catch (e) {
          setError("Online, but failed to fetch address.");
          setShowCameraFallback(true);
          setLoading(false);
          return;
        }

        const confirm_date = now.toISOString().split("T")[0];
        const confirm_time = now.toTimeString().split(" ")[0];
        const mobileNumber = localStorage.getItem("saved_sett_mobilenumber");
        const full_name = localStorage.getItem("saved_sett_fullname");
        const device_name = getBrowserAndOS();
        const ip = await getPublicIP();

        const transformed = [
          {
            mobileNumber,
            full_name,
            device_name,
            latitude,
            longitude,
            address,
            street: "",
            building: "",
            nearby: address,
            confirm_date,
            confirm_time,
            ip,
            filename: "",
            recordstatusid: 1,
            comment,
          },
        ];

        const fallbackData = { ...transformed[0] };

        const isOnline = await pingServer(API_BASE_URL);
        try {
          if (isOnline) {
            const id = await db.attendance.add(fallbackData);
            await handleSync(transformed, id);
            setSnack({ open: true, message: "Attendance submitted.", severity: "success" });
          } else {
            await db.attendance.add(fallbackData);
            setSnack({ open: true, message: "Saved offline. Will sync later.", severity: "info" });
          }
        } catch (e) {
          setSnack({ open: true, message: "Failed to save submission.", severity: "error" });
        }

        setLocation({
          latitude,
          longitude,
          address,
          confirm_date,
          confirm_time,
          ip,
        });

        setLoading(false);
      },
      () => {
        clearTimeout(fallbackTimeout);
        setError("Failed to get GPS location.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 45000, maximumAge: 0 }
    );
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const now = new Date();
    const confirm_date = now.toISOString().split("T")[0];
    const confirm_time = now.toTimeString().split(" ")[0];

    const mobileNumber = localStorage.getItem("saved_sett_mobilenumber");
    const full_name = localStorage.getItem("saved_sett_fullname");
    const device_name = getBrowserAndOS();
    const ip = await getPublicIP();

    const latitude = "";
    const longitude = "";
    const address = "Camera-based entry";

    const uniqueId = now.toISOString().replace(/[-:.TZ]/g, "");
    const filename = `${mobileNumber}_${uniqueId}.jpg`;

    // Read file as base64
    const imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const transformed = [
      {
        mobileNumber,
        full_name,
        device_name,
        latitude,
        longitude,
        address,
        street: "",
        building: "",
        nearby: address,
        confirm_date,
        confirm_time,
        ip,
        comment,
        confirm_type: "image",
        filename,
        file_base64: imageData,
      },
    ];

    const fallbackData = { ...transformed[0] };

    const isOnline = await pingServer(API_BASE_URL);
    try {
      if (isOnline) {
        await handleSync(transformed);
        setSnack({ open: true, message: "Image submitted.", severity: "success" });
      } else {
        await db.attendance.add(fallbackData);
        setSnack({ open: true, message: "Image saved offline. Will sync later.", severity: "info" });
      }
    } catch {
      setSnack({ open: true, message: "Failed to save image submission.", severity: "error" });
    }

    setCapturedImage(URL.createObjectURL(file));
    setLoading(false);
  };

  const header = (
    <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: "#004d40" }}>
        Quick Attendance
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Tap to capture GPS and time. If GPS is slow, you can use camera fallback.
      </Typography>
    </Stack>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        p: 2,
        pt: 4,
        background: {
          xs: "linear-gradient(180deg, #e0f2f1 0%, #ffffff 40%)",
          md: "linear-gradient(135deg, #e0f2f1 0%, #ffffff 55%)",
        },
      }}
    >
      <Card
        elevation={12}
        sx={{
          width: "100%",
          maxWidth: 720,
          borderRadius: 4,
          bgcolor: "rgba(255,255,255,0.95)",
          boxShadow: "0 20px 60px rgba(0,0,0,.12)",
          p: { xs: 2, md: 3 },
        }}
      >
        {header}

        <Stack alignItems="center" spacing={2}>
          <Tooltip title="Submit attendance">
            <LoadingButton
              onClick={handleFingerprintClick}
              loading={loading}
              loadingIndicator={<CircularProgress size={26} />}
              sx={{
                borderRadius: "50%",
                width: 160,
                height: 160,
                background:
                  "linear-gradient(135deg, #00838f 0%, #006064 100%)",
                boxShadow: "0 10px 30px rgba(0,0,0,.25)",
                "&:hover": { filter: "brightness(1.05)" },
              }}
            >
              <FingerprintIcon sx={{ fontSize: 86, color: "white" }} />
            </LoadingButton>
          </Tooltip>

          <TextField
            label="If comment needed, leave it before submit"
            multiline
            rows={3}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            variant="outlined"
            sx={{
              maxWidth: 520,
              "& .MuiInputBase-root": {
                backgroundColor: "#fafafa",
                borderRadius: 2,
              },
            }}
          />

          {showCameraFallback && (
            <Tooltip title="Use camera fallback">
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: "#e3f2fd",
                  "&:hover": { backgroundColor: "#bbdefb" },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraAltIcon sx={{ fontSize: 36 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          ref={fileInputRef}
          onChange={handleImageSelect}
        />

        {error && (
          <Alert
            icon={<ErrorOutlineRoundedIcon fontSize="inherit" />}
            severity="error"
            sx={{ mt: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Result card */}
        {location && (
          <Card
            elevation={0}
            sx={{
              mt: 3,
              borderRadius: 3,
              border: "1px solid #e0f2f1",
              background: "linear-gradient(180deg, #ffffff 0%, #f8fffe 100%)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <CheckCircleRoundedIcon color="success" />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Entry captured
                </Typography>
                <Chip
                  label={navigator.onLine ? "Online" : "Offline"}
                  size="small"
                  color={navigator.onLine ? "success" : "warning"}
                  sx={{ ml: "auto", fontWeight: 700 }}
                />
              </Stack>

              {capturedImage ? (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <img
                    src={capturedImage}
                    alt="Captured"
                    style={{ width: "48%", borderRadius: 12 }}
                    onLoad={() => {
                      // free blob url (optional)
                      URL.revokeObjectURL(capturedImage);
                    }}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Image linked to this submission.
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: 180 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <PublicIcon fontSize="small" />
                          IP Address
                        </Stack>
                      </TableCell>
                      <TableCell>{location.ip}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <RoomIcon fontSize="small" />
                          Latitude
                        </Stack>
                      </TableCell>
                      <TableCell>{location.latitude}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <RoomIcon fontSize="small" />
                          Longitude
                        </Stack>
                      </TableCell>
                      <TableCell>{location.longitude}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
                      <TableCell>{location.address}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccessTimeIcon fontSize="small" />
                          Confirm Date
                        </Stack>
                      </TableCell>
                      <TableCell>{location.confirm_date}</TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccessTimeIcon fontSize="small" />
                          Confirm Time
                        </Stack>
                      </TableCell>
                      <TableCell>{location.confirm_time}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          message={snack.message}
        />
      </Card>
    </Box>
  );
}
