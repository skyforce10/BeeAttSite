// utils/attendanceUtils.js
import dayjs from "dayjs";

const arabicDays = [
  "الأحد",     // Sunday (0)
  "الإثنين",   // Monday (1)
  "الثلاثاء",  // Tuesday (2)
  "الأربعاء",  // Wednesday (3)
  "الخميس",    // Thursday (4)
  "الجمعة",    // Friday (5)
  "السبت",     // Saturday (6)
];

export const generateMonthDates = (date) => {
  const daysInMonth = date.daysInMonth();
  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = date.date(day).format("YYYY-MM-DD");
    dates.push(fullDate);
  }
  return dates;
};

export const mapAttendanceRows = (dates, rows, acceptedLeave) => {
  return dates.map((date) => {
    const match = rows.find(
      (row) => dayjs(row.datein).isValid() && dayjs(row.datein).format("YYYY-MM-DD") === date
    );

    const clean = (value) => (value && value !== "N/A" ? value : "");

    const day = dayjs(date).day();
    const day_arabic = arabicDays[day];
    const isWeekend = day === 0 || day === 6;

    const time = clean(match?.timein);
    const address = clean(match?.addressin);

    let status = match?.status || "Pending";

    if (isWeekend) status = "Weekend";
    else if (!time) status = "";

    const leaveMatch = acceptedLeave.find(
      (leave) => dayjs(date).isBetween(leave.FromDate, leave.ToDate, "day", "[]")
    );

    if (leaveMatch) status = "Vacation";

    return {
      id: date,
      date,
      day_arabic,
      time,
      address,
      status,
    };
  });
};

export const calculateTotalHours = (rows) => {
  return rows.reduce((sum, row) => {
    const timeRanges = row.time.split("~").map((s) => s.trim());

    if (timeRanges.length !== 2) return sum;
    if (timeRanges[0] === "00:00" && timeRanges[1] === "00:00") return sum + 8;

    const start = dayjs(`2025-01-01 ${timeRanges[0]}`);
    const end = dayjs(`2025-01-01 ${timeRanges[1]}`);
    const diff = end.diff(start, "minute");

    return sum + (diff > 0 ? diff / 60 : 0);
  }, 0);
};
