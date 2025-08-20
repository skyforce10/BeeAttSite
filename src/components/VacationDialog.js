import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import axios from "axios";

export default function VacationDialog({ open, onClose, onSave, setError }) {
  const [fromDate, setFromDate] = useState(dayjs());
  const [toDate, setToDate] = useState(dayjs());
  const [timeFrom, setTimeFrom] = useState(dayjs("08:00", "HH:mm"));
  const [timeTo, setTimeTo] = useState(dayjs("16:00", "HH:mm"));
  const [remark, setRemark] = useState("");
  const [vacationTypes, setVacationTypes] = useState([]);
  const [selectedVacationCode, setSelectedVacationCode] = useState("");

  // Fetch vacation types when dialog opens
  useEffect(() => {
    if (open) {
      const today = dayjs();
      setFromDate(today);
      setToDate(today);
      setTimeFrom(dayjs("08:00", "HH:mm"));
      setTimeTo(dayjs("16:00", "HH:mm"));
      setRemark("");
      setSelectedVacationCode("");

      const apiUrl = localStorage.getItem("saved_sett_api_url");
      if (apiUrl) {
        axios
          .get(`https://${apiUrl}/api/vacation-types`)
          .then((res) => {
            setVacationTypes(res.data || []);
           if (res.data.length > 0) {
      setSelectedVacationCode(res.data[0].Code); 
    }
          })
          .catch((error) => {
            console.error("Error fetching vacation types:", error); // log full error
            setVacationTypes([]);
            if (setError) {
              // show a more helpful message if available
              setError(error.response?.data?.message || "Failed to load vacation types.");
            }
          });
      }
    }
  }, [open, setError]);

  const handleSubmit = async () => {
    const androidId = localStorage.getItem("saved_sett_mobilenumber");
    const payload = {
      androidId: androidId,
      vacationType: selectedVacationCode,
      fromDate: fromDate.format("YYYY-MM-DD"),
      toDate: toDate.format("YYYY-MM-DD"),
      timeFrom: timeFrom.format("HH:mm"),
      timeTo: timeTo.format("HH:mm"),
      remark,
      date: fromDate.format("YYYY-MM-DD"),
    };

    if (navigator.onLine) {
      try {
        const apiUrl = localStorage.getItem("saved_sett_api_url");
        const empId = localStorage.getItem("saved_sett_empid") || 123;
        const operCode = localStorage.getItem("saved_sett_username") || "admin";

        await axios.post(`https://${apiUrl}/api/save-vacation`, {
          ...payload,
          EmpID: empId,
          OperCode: operCode,
        });
      } catch (error) {
        if (setError) setError("Offline mode: Failed to submit online. Saved locally.");
        if (onSave) onSave(payload);
      }
    } else {
      if (onSave) onSave(payload);
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          backgroundColor: "#f1fdfb",
          boxShadow: 6,
          px: 2,
          py: 1.5,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          color: "#004d40",
          textAlign: "center",
          fontSize: "1.2rem",
          pb: 0,
        }}
      >
        Add Vacancy Request
      </DialogTitle>

      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Vacation Type Combobox */}
            <FormControl size="small" fullWidth sx={{ backgroundColor: "white", borderRadius: 2 }}>
              <InputLabel>Vacation Type</InputLabel>
              <Select
                value={selectedVacationCode}
                onChange={(e) => setSelectedVacationCode(e.target.value)}
              >
                {vacationTypes.map((type) => (
                  <MenuItem key={type.Code} value={type.Code}>
                    {type.ArbStringValue}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  variant: "outlined",
                  sx: { backgroundColor: "white", borderRadius: 2 },
                },
              }}
            />
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  variant: "outlined",
                  sx: { backgroundColor: "white", borderRadius: 2 },
                },
              }}
            />
            <TimePicker
              label="Time From"
              value={timeFrom}
              onChange={(newValue) => setTimeFrom(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  variant: "outlined",
                  sx: { backgroundColor: "white", borderRadius: 2 },
                },
              }}
            />
            <TimePicker
              label="Time To"
              value={timeTo}
              onChange={(newValue) => setTimeTo(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  variant: "outlined",
                  sx: { backgroundColor: "white", borderRadius: 2 },
                },
              }}
            />
            <TextField
              label="Remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              size="small"
              InputProps={{ sx: { backgroundColor: "white", borderRadius: 2 } }}
            />
          </Stack>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: "#00796b", fontWeight: "bold" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            backgroundColor: "#00796b",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#004d40" },
          }}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}
