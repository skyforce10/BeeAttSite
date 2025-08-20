import React, { useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Container,
  Divider,
  Fab,
  Snackbar,
  Alert,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { NavLink, useNavigate, Routes, Route } from "react-router-dom";
import FingerprintScanner from "../components/FingerprintScanner";
import AttendanceHistory from "../components/AttendanceHistory";
import HomeIcon from "@mui/icons-material/Home";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";
import ListItemIcon from "@mui/material/ListItemIcon";
import SyncIcon from "@mui/icons-material/Sync";
import axios from "axios";
import db from "../db";
import { keyframes } from "@emotion/react";
import { handleSync } from "../utils/global_functions";
import DoneIcon from '@mui/icons-material/Done';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DrawerContent from "../components/DrawerContent";
import HistoryDropdown from "../components/HistoryDropdown";
import HeaderAppBar from "../components/HeaderAppBar";
import MyAttPage from "../pages/MyAttPage";

export default function HomePage() {
  const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;
  const navigate = useNavigate();
  const fullName = localStorage.getItem("shared_fullname") || "User";

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [drawerOpen, setDrawerOpen] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const attendanceRef = useRef(null);

  const handleSyncClick = async () => {

    setSyncing(true);

    const entries = await db.attendance
  .where("recordstatusid")
  .equals(1)
  .toArray();

    const transformed = entries.map((entry) => ({
      mobileNumber: entry.mobileNumber,
      full_name: entry.full_name,
      device_name: entry.device_name,
      latitude: entry.latitude,
      longitude: entry.longitude,
      address: entry.address,
      street: "",
      building: "",
      nearby: entry.address,
      confirm_date: entry.confirm_date,
      confirm_time: entry.confirm_time,
      ip: entry.ip,
    }));

    const result = await handleSync(transformed, 0);

    if (result.success) {
      await db.attendance.clear();
      attendanceRef.current?.clearHistory();
    }

    setSyncStatus({
      open: true,
      message: result.message,
      severity: result.success ? "success" : "error",
    });

    setSyncing(false);
  };
  const handleLogout = () => {
    localStorage.removeItem("remember_me");
    /*const savedSettUsername = localStorage.getItem("saved_username");
    const savedSettPassword = localStorage.getItem("saved_password");
    const savedApiUrl = localStorage.getItem("saved_sett_api_url");
    const savedFullName = localStorage.getItem("saved_sett_fullname");
    const savedmobileNumber = localStorage.getItem("saved_sett_mobilenumber");
    localStorage.clear();
    localStorage.setItem("saved_username", savedSettUsername);
    localStorage.setItem("saved_password", savedSettPassword);
    localStorage.setItem("saved_sett_api_url", savedApiUrl);
    localStorage.setItem("saved_sett_fullname", savedFullName);
    localStorage.setItem("saved_sett_mobilenumber", savedmobileNumber);*/
    navigate("/");
  };

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };



  return (
    <>
      <HeaderAppBar
        fullName={fullName}
        handleLogout={handleLogout}
        toggleDrawer={toggleDrawer}
      />

      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <DrawerContent onLogout={handleLogout} onClose={toggleDrawer(false)} />
      </Drawer>

      <Container sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<FingerprintScanner />} />
          <Route
            path="history"
            element={<AttendanceHistory ref={attendanceRef} />}
          />
          <Route path="calendar" element={<MyAttPage />} />
        </Routes>
      </Container>

      <Fab
        color="primary"
        size="medium"
        sx={{
          position: "fixed", // <- fixed instead of absolute
          bottom: 16,
          right: 16,
          zIndex: 1300, // ensure it's above content
        }}
        onClick={handleSyncClick}
      >
        <SyncIcon
          sx={{
            animation: syncing ? `${spin} 1s linear infinite` : "none",
          }}
        />
      </Fab>

      <Snackbar
        open={syncStatus.open}
        autoHideDuration={4000}
        onClose={() => setSyncStatus((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={syncStatus.severity}
          onClose={() => setSyncStatus((prev) => ({ ...prev, open: false }))}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {syncStatus.message}
        </Alert>
      </Snackbar>
    </>
  );
}
