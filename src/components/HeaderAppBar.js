import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import LogoutIcon from "@mui/icons-material/Logout";
import { NavLink } from "react-router-dom";
import HistoryDropdown from "./HistoryDropdown"; 
import EventIcon from '@mui/icons-material/Event';


const HeaderAppBar = ({ fullName, handleLogout, toggleDrawer }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static" sx={{ backgroundColor: "#004d40" }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: isMobile ? "row" : "row",
        }}
      >
        {/* Full Name with Home Icon */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <HomeIcon />
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {fullName}
          </Typography>
        </Box>

        {/* Right Section */}
        {isMobile ? (
          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              color="inherit"
              component={NavLink}
              to="/home/"
              startIcon={<FingerprintIcon />}
            >
              Finger Print
            </Button>

            <Button
              color="inherit"
              component={NavLink}
              to="/home/calendar/"
              startIcon={<EventIcon />}
            >
              My Attendance
            </Button>

            <HistoryDropdown />

            <Button
              color="inherit"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
            >
              Logout
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default HeaderAppBar;
