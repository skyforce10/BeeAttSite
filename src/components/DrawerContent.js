// src/components/DrawerContent.js
import React from "react";
import {
  Box,
  Divider,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import DoneIcon from "@mui/icons-material/Done";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LogoutIcon from "@mui/icons-material/Logout";
import EventIcon from "@mui/icons-material/Event";

export default function DrawerContent({ onLogout, onClose }) {
  return (
    <Box
      sx={{
        width: 280,
        height: "100%",
        background: "linear-gradient(180deg, #f1fdfb 0%, #e0f2f1 100%)",
        px: 2,
        py: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      role="presentation"
      onClick={onClose}
    >
      {/* Header */}
      <Box>
        <Stack alignItems="center" spacing={1}>
          <Avatar
            sx={{
              bgcolor: "#00838f",
              width: 56,
              height: 56,
              boxShadow: 3,
            }}
          >
            <FingerprintIcon />
          </Avatar>
          <Typography
            variant="h6"
            sx={{ color: "#00695c", fontWeight: 800, letterSpacing: 0.4 }}
          >
            Bee Attendance
          </Typography>
          <Chip
            label="v1.0"
            size="small"
            sx={{ bgcolor: "#e0f7fa", color: "#006064", fontWeight: 700 }}
          />
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* Navigation */}
        <List sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/home/"
              sx={navButtonSx}
            >
              <ListItemIcon>
                <FingerprintIcon sx={{ color: "#00796b" }} />
              </ListItemIcon>
              <ListItemText
                primary="Finger Print"
                secondary="Capture attendance"
                primaryTypographyProps={{ sx: { fontWeight: 600, color: "#004d40" } }}
                secondaryTypographyProps={{ sx: { color: "text.secondary" } }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/home/calendar/"
              sx={navButtonSx}
            >
              <ListItemIcon>
                <EventIcon sx={{ color: "#00796b" }} />
              </ListItemIcon>
              <ListItemText
                primary="My Attendance"
                secondary="Calendar overview"
                primaryTypographyProps={{ sx: { fontWeight: 600, color: "#004d40" } }}
                secondaryTypographyProps={{ sx: { color: "text.secondary" } }}
              />
            </ListItemButton>
          </ListItem>

          <Divider sx={{ my: 1.5, mx: 1 }} />

          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/home/history?type=posted"
              sx={navButtonSx}
            >
              <ListItemIcon>
                <DoneIcon sx={{ color: "#00838f" }} />
              </ListItemIcon>
              <ListItemText
                primary="Posted History"
                secondary="Synced entries"
                primaryTypographyProps={{ sx: { fontWeight: 600, color: "#004d40" } }}
                secondaryTypographyProps={{ sx: { color: "text.secondary" } }}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/home/history?type=pending"
              sx={navButtonSx}
            >
              <ListItemIcon>
                <ScheduleIcon sx={{ color: "#00838f" }} />
              </ListItemIcon>
              <ListItemText
                primary="Pending History"
                secondary="Not yet synced"
                primaryTypographyProps={{ sx: { fontWeight: 600, color: "#004d40" } }}
                secondaryTypographyProps={{ sx: { color: "text.secondary" } }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Footer */}
      <Box>
        <Divider sx={{ my: 2 }} />
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout} sx={logoutButtonSx}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: "#d32f2f" }} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ sx: { color: "#b71c1c", fontWeight: 600 } }}
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );
}

/** Styles */
const navButtonSx = {
  borderRadius: 2,
  px: 2,
  py: 1.25,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "#b2ebf2",
    transform: "translateX(4px)",
  },
  // highlight active NavLink (NavLink adds `active` className)
  "&.active": {
    backgroundColor: "rgba(0, 121, 107, 0.15)",
    outline: "1px solid rgba(0, 121, 107, 0.25)",
  },
};

const logoutButtonSx = {
  borderRadius: 2,
  px: 2,
  py: 1.25,
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    backgroundColor: "#ffcdd2",
    transform: "translateX(4px)",
  },
};
