// src/db.js
import Dexie from "dexie";

const db = new Dexie("AttendanceDB");
/*Dexie.delete("AttendanceDB").then(() => {
  console.log("Database deleted successfully");
  
}).catch((err) => {
  console.error("Failed to delete database:", err);
});*/
db.version(6).stores({
  attendance: "++id,mobileNumber,recordstatusid,full_name,username,device_name,latitude,longitude,address,comment,confirm_date,confirm_time,ip,confirm_type,filename",
  vacationRequests: "++id, date, timeFrom, timeTo, remark,vacation_type",
  myattendance: '++id, datein, timein, addressin, status',
  acceptedLeave: '++id, EmpId, JobNo, FromDate, ToDate, FromTime, ToTime, LeaveStatus, Remark',
});


export default db;
