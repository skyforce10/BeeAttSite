// components/AttendanceHistory.js
import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Avatar,
  Chip,
  Divider,
  Grid,
  Tooltip,
  Skeleton,
  Paper,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import ScheduleIcon from "@mui/icons-material/Schedule";
import db from "../db"; // Dexie DB instance
import { useLocation } from "react-router-dom";

function formatDateTime(dateStr, timeStr) {
  if (!dateStr && !timeStr) return "";
  try {
    const date = new Date(`${dateStr} ${timeStr || "00:00:00"}`);
    const d = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
    const t = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `${d} • ${t}`;
  } catch {
    return `${dateStr || ""} ${timeStr || ""}`.trim();
  }
}

const StatusChip = ({ id }) => (
  <Chip
    size="small"
    label={id === 3 ? "Posted" : "Pending"}
    color={id === 3 ? "success" : "warning"}
    variant={id === 3 ? "filled" : "outlined"}
    sx={{ fontWeight: 600 }}
  />
);

const AttendanceHistory = forwardRef((props, ref) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const type = params.get("type"); // 'posted' or 'pending'

  const title = useMemo(
    () => (type === "posted" ? "Posted History" : "Pending History"),
    [type]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const statusFilter = type === "posted" ? 3 : 1;
        // If confirm_date isn't indexed, sort in-memory
        const filteredRecords = await db.attendance
          .where("recordstatusid")
          .equals(statusFilter)
          .sortBy("confirm_date");
        if (isMounted) setHistory(filteredRecords.reverse()); // newest first
      } catch (e) {
        console.error(e);
        if (isMounted) setHistory([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [location.search, type]);

  // Allow parent to clear list
  useImperativeHandle(ref, () => ({
    clearHistory: () => setHistory([]),
  }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Avatar sx={{ bgcolor: "#00838f" }}>
          <FingerprintIcon />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 800, color: "#004d40" }}>
          {title}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Card key={i} elevation={4} sx={{ p: 2 }}>
              <Skeleton variant="rectangular" height={18} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={18} sx={{ mb: 1 }} />
              <Skeleton variant="rectangular" height={18} width="60%" />
            </Card>
          ))}
        </Stack>
      ) : history.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            borderStyle: "dashed",
            bgcolor: "#fafafa",
          }}
        >
          <Avatar sx={{ mx: "auto", mb: 1, bgcolor: "#e0f2f1", color: "#004d40" }}>
            <ScheduleIcon />
          </Avatar>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            No attendance data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any {type === "posted" ? "posted" : "pending"} records yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {history.map((entry) => (
            <Card
              key={entry.id}
              elevation={6}
              sx={{
                overflow: "hidden",
                borderRadius: 3,
                background: "linear-gradient(180deg, #ffffff 0%, #f8fffe 100%)",
                boxShadow: "0 10px 30px rgba(0,0,0,.08)",
              }}
            >
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: "#00838f" }}>
                    <FingerprintIcon />
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700}>
                        Attendance Record
                      </Typography>
                      <StatusChip id={entry.recordstatusid} />
                    </Stack>

                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Latitude
                        </Typography>
                        <Tooltip title={entry.latitude || ""} placement="top">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.latitude || "—"}
                          </Typography>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                          Longitude
                        </Typography>
                        <Tooltip title={entry.longitude || ""} placement="top">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {entry.longitude || "—"}
                          </Typography>
                        </Tooltip>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {entry.address || "—"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">
                          Confirmed At
                        </Typography>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatDateTime(entry.confirm_date, entry.confirm_time) || "—"}
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>

                    {entry.map_link && (
                      <Box sx={{ mt: 1.5 }}>
                        <Chip
                          icon={<RoomIcon />}
                          label="Open in Maps"
                          component="a"
                          href={entry.map_link}
                          target="_blank"
                          clickable
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
});

export default AttendanceHistory;
