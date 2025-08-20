import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useNavigate } from "react-router-dom";

export default function HistoryDropdown() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (path) => {
    setAnchorEl(null);
    if (path) navigate(path);
  };

  return (
    <>
      <Button
        color="inherit"
        startIcon={<ArrowDropDownIcon />}
        onClick={handleClick}
      >
        History
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => handleClose()}>
        <MenuItem onClick={() => handleClose("/home/history?type=posted")}>
          <ListItemIcon>
            <DoneIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Posted History</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleClose("/home/history?type=pending")}>
          <ListItemIcon>
            <ScheduleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pending History</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
