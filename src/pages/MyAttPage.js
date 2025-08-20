import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,

} from "@mui/material";
import axios from "axios";
import EventIcon from "@mui/icons-material/Event";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import duration from "dayjs/plugin/duration";
import CancelIcon from "@mui/icons-material/Cancel";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";

import AddIcon from "@mui/icons-material/Add";
import { IconButton, Tooltip } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import db from "../db";
import VacationDialog from "../components/VacationDialog";
import {
  generateMonthDates,
  mapAttendanceRows,
  calculateTotalHours
} from "../utils/attendanceUtils";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";


dayjs.extend(duration);



export default function MyAttPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [vacationDate, setVacationDate] = useState(null);
  const [timeFrom, setTimeFrom] = useState(dayjs("08:00", "HH:mm"));
  const [timeTo, setTimeTo] = useState(dayjs("16:00", "HH:mm"));
  const [remark, setRemark] = useState("");
  const [requestedDates, setRequestedDates] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [acceptedLeave, setAcceptedLeave] = useState([]);

  const today = dayjs();
  const [selectedDate, setSelectedDate] = useState(dayjs(`${today.year()}-${today.month() + 1}-01`));
  const [filterBy, setFilterBy] = useState("all");


  const vacancyCount = filteredRows.filter((row) => row.status === "Vacation").length;

  useEffect(() => {
    const loadRequestedVacancies = async () => {
      const all = await db.vacationRequests.toArray();
      const dates = all.map((v) => v.date);
      setRequestedDates(dates);
    };

    loadRequestedVacancies();
  }, [rows]);

  useEffect(() => {
    const API_BASE_URL =
      localStorage.getItem("saved_sett_api_url");
    const androidId = localStorage.getItem("saved_sett_mobilenumber");
    const month = selectedDate.month() + 1; // JS months are 0-indexed
    const year = selectedDate.year();

    setLoading(true);
    axios
      .get(`https://${API_BASE_URL}/api/attendance`, {
        params: { androidId, month, year },
      })
      .then(async (res) => {
        const { data, AcceptedLeave } = res.data;

        // Store in Dexie
        try {
          await db.transaction('rw', db.myattendance, db.acceptedLeave, async () => {
            await db.myattendance.clear();
            await db.acceptedLeave.clear();

            await db.myattendance.bulkAdd(data.map((item) => ({
              datein: item.datein,
              timein: item.timein,
              addressin: item.addressin,
              status: item.status
            })));

            await db.acceptedLeave.bulkAdd(AcceptedLeave.map((leave) => ({
              EmpId: leave.EmpId,
              JobNo: leave.JobNo,
              FromDate: leave.FromDate,
              ToDate: leave.ToDate,
              FromTime: leave.FromTime,
              ToTime: leave.ToTime,
              LeaveStatus: leave.LeaveStatus,
              Remark: leave.Remark
            })));
          });
        } catch (e) {
          console.error("Dexie storage error:", e);
        }

        // Set state for rendering
        setRows(data);
        setAcceptedLeave(AcceptedLeave);
        setLoading(false);
      })
      .catch(async () => {
        setError("Offline mode: showing last saved data.");
        const cachedDataRaw = await db.myattendance.toArray();
        const cachedData = cachedDataRaw.map(({ addressin, datein, status, timein }) => ({
          addressin,
          datein,
          status,
          timein,
        }));
        const cachedLeave = await db.acceptedLeave.toArray();
        setRows(cachedData);
        setAcceptedLeave(cachedLeave);
        setLoading(false);
      });
  }, [selectedDate]);

  useEffect(() => {
    const monthDates = generateMonthDates(selectedDate);
    const mappedRows = mapAttendanceRows(monthDates, rows, acceptedLeave);

    const statusValueMap = {
      posted: 1,
      machine: 2,
      site: 3,
      weekend: "Weekend",
      vacation: "Vacation",
    };

    const filtered =
      filterBy === "all"
        ? mappedRows
        : mappedRows.filter((row) => row.status === statusValueMap[filterBy]);

    setFilteredRows(filtered);
    setTotalHours(calculateTotalHours(filtered));
  }, [rows, acceptedLeave, selectedDate, filterBy]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        pt: 4,
        px: 2,
        background: {
          xs: "linear-gradient(180deg, #e0f2f1 0%, #ffffff 40%)",
          md: "linear-gradient(135deg, #e0f2f1 0%, #ffffff 55%)",
        },
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: "100%",
          maxWidth: 1200,
          p: 3,
          borderRadius: 4,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, #ffffff 0%, #fbfffe 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,.12)",
          border: "1px solid #b2dfdb",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
          spacing={1.5}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <EventIcon sx={{ color: "#00796b" }} />
            <Typography variant="h6" fontWeight={800} color="#004d40">
              Attendance Records
            </Typography>
          </Stack>

          <Chip
            icon={<AccessTimeFilledIcon />}
            label={`Total: ${totalHours.toFixed(2)} hrs`}
            color="success"
            variant="filled"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* Filters */}
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            bgcolor: "#f1fdfb",
            border: "1px solid #b2dfdb",
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ color: "#00796b", mb: 1 }}>
            Filter by Month & Category
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  views={["year", "month"]}
                  label="Select Month"
                  minDate={dayjs("2022-01-01")}
                  maxDate={dayjs("2026-12-31")}
                  value={selectedDate}
                  onChange={(newValue) => newValue && setSelectedDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      variant: "outlined",
                      sx: { backgroundColor: "white", borderRadius: 2 },
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl size="small" fullWidth>
                <InputLabel id="filter-label">Filter</InputLabel>
                <Select
                  labelId="filter-label"
                  value={filterBy}
                  label="Filter"
                  onChange={(e) => setFilterBy(e.target.value)}
                  sx={{
                    backgroundColor: "#f1fdfb",
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="posted">Posted</MenuItem>
                  <MenuItem value="machine">Machine</MenuItem>
                  <MenuItem value="site">Site</MenuItem>
                  <MenuItem value="weekend">Weekend</MenuItem>
                  <MenuItem value="vacation">Vacation</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Table Section */}
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#00796b" }}>

                  <TableCell
                    sx={{
                      width: 120,
                      fontWeight: "bold",
                      color: "white",
                      fontSize: { xs: 10, sm: 13, md: 14 },
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #004d40",
                      py: 1,
                      px: 1,
                      textAlign: "center",
                    }}
                  >

                    Date
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 100,
                      fontWeight: "bold",
                      color: "white",
                      fontSize: { xs: 10, sm: 13, md: 14 },
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #004d40",
                      py: 1,
                      px: 1,
                      textAlign: "center",
                    }}
                  >

                    Day
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 140,
                      fontWeight: "bold",
                      color: "white",
                      fontSize: { xs: 10, sm: 13, md: 14 },
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #004d40",
                      py: 1,
                      px: 1,
                      textAlign: "center",
                    }}
                  >
                    Time In/Out
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 300,
                      fontWeight: "bold",
                      color: "white",
                      fontSize: { xs: 10, sm: 13, md: 14 },
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #004d40",
                      py: 1,
                      px: 1,
                      display: { xs: "none", sm: "table-cell" },
                      textAlign: "center",
                    }}
                  >
                    Address
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 120,
                      fontWeight: "bold",
                      color: "white",
                      fontSize: { xs: 10, sm: 13, md: 14 },
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #004d40",
                      py: 1,
                      px: 1,
                      textAlign: "center",
                    }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    sx={{
                      width: 60,
                      fontWeight: "bold",
                      color: "white",
                      fontSize: { xs: 10, sm: 13, md: 14 },
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderBottom: "1px solid #004d40",
                      py: 1,
                      px: 1,
                      textAlign: "center",
                    }}
                  >

                  </TableCell>
                </TableRow>

              </TableHead>

              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onMouseEnter={() => setHoveredRow(row.date)}
                    onMouseLeave={() => setHoveredRow(null)}
                    sx={{
                      position: "relative",
                      "&:nth-of-type(odd)": { backgroundColor: "#f1fdfb" },
                      "& td": {
                        fontSize: { xs: 8, sm: 14 },
                        py: 0.5,
                        px: 1,
                        verticalAlign: "top",
                      },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: 8, sm: 12 }, }}>{row.date || ""}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: 8, sm: 12 }, }}>{row.day_arabic}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: 8, sm: 12 }, }}>
                      {row.time ? row.time : "–"}
                    </TableCell>
                    <TableCell
                      sx={{
                        display: { xs: "none", sm: "table-cell" },
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        textAlign: "center",
                      }}
                    >
                      {row.address || ""}
                    </TableCell>
                    <TableCell>
                      {row.status ? (
                        <Chip
                          label={
                            row.status === 1
                              ? "Posted"
                              : row.status === 2
                                ? "Machine"
                                : row.status === 3
                                  ? "Site"
                                  : row.status === "Weekend"
                                    ? "Weekend"
                                    : row.status === "Vacation"
                                      ? "Vacation"
                                      : row.status
                          }
                          color={
                            row.status === 1
                              ? "success"
                              : row.status === 2
                                ? "info"
                                : row.status === 3
                                  ? "warning"
                                  : row.status === "Weekend"
                                    ? "default"
                                    : row.status === "Vacation"
                                      ? "error"
                                      : "default"
                          }
                          size="small"
                          sx={{
                            fontSize: { xs: 8, sm: 12 },
                            height: 20,
                            fontWeight: "bold",
                            width: { xs: 50, sm: 80, md: 80 },
                            textAlign: "center",
                            display: "flex",
                            justifyContent: "center"
                          }}
                        />
                      ) : (
                        ""
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ textAlign: "center", fontSize: { xs: 8, sm: 12 }, }}>
                      {row.status !== "Weekend" && (
                        requestedDates.includes(row.date) ? (
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "bold",
                                color: "#f57c00",
                                transition: "padding-right 0.3s",
                                pr: hoveredRow === row.date ? 3 : 0,
                              }}
                            >
                              Requested
                            </Typography>

                            <IconButton
                              onClick={async () => {
                                await db.vacationRequests.where("date").equals(row.date).delete();
                                setRequestedDates((prev) => prev.filter((d) => d !== row.date));
                              }}
                              size="small"
                              sx={{
                                position: "absolute",
                                right: 4,
                                top: "50%",
                                transform: "translateY(-50%)",
                                backgroundColor: "#ffebee",
                                color: "#d32f2f",
                                transition: "opacity 0.3s ease-in-out, right 0.3s",
                                opacity: hoveredRow === row.date ? 1 : 0,
                                pointerEvents: hoveredRow === row.date ? "auto" : "none",
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Tooltip title="Add Vacation">
                            <IconButton
                              onClick={() => {
                                setVacationDate(row.date);
                                setTimeFrom(dayjs("08:00", "HH:mm"));
                                setTimeTo(dayjs("16:00", "HH:mm"));
                                setRemark("");
                                setOpenDialog(true);
                              }}
                              size="small"
                              sx={{
                                backgroundColor: "#e8f5e9",
                                color: "#388e3c",
                                "&:hover": { backgroundColor: "#c8e6c9" },
                                p: 1,
                              }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

        )}

        <Box
          sx={{
            mt: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 2,
            borderRadius: 2,
            backgroundColor: "#e0f2f1",
            borderLeft: "6px solid #00796b",
          }}
        >
          <AccessTimeFilledIcon sx={{ color: "#00796b" }} />
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#004d40" }}>
            Total Hours: {totalHours.toFixed(2)} hrs
          </Typography>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, opacity: 0.3 }} />

          <BeachAccessIcon sx={{ color: "#d32f2f" }} />
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#d32f2f" }}>
            Vacancy: {vacancyCount}
          </Typography>

          {/* Optional: open address in maps if you keep a selected row later */}
          {/* <Chip icon={<RoomIcon />} label=\"Open Map\" clickable variant=\"outlined\" /> */}
        </Box>
      </Paper>

      <VacationDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        setError={setError}
        vacationDate={vacationDate} // pass the clicked date
        onSave={async ({ fromDate, toDate, timeFrom, timeTo, remark }) => {
          try {
            await db.vacationRequests.add({
              fromDate,
              toDate,
              timeFrom,
              timeTo,
              remark,
              date: vacationDate, // save the clicked row's date
            });
            setRequestedDates((prev) => [...prev, vacationDate]);
          } catch (error) {
            setError("Failed to save vacation request locally.");
          }
        }}
      />
    </Box>


  );
}
