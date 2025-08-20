import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Snackbar, Backdrop } from "@mui/material";
import LoginForm from "./pages/LoginForm";
import HomePage from "./pages/HomePage";

export default function App() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    const handleSWUpdate = (event) => {
      const registration = event.detail;
      setNewVersionAvailable(true);
      setWaitingWorker(registration.waiting || registration.installing);
    };

    window.addEventListener("swUpdated", handleSWUpdate);
    return () => window.removeEventListener("swUpdated", handleSWUpdate);
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      waitingWorker.addEventListener("statechange", (e) => {
        if (e.target.state === "activated") {
          window.location.reload();
        }
      });
    }
  };

  // When snackbar appears, immediately trigger update
  useEffect(() => {
    if (newVersionAvailable) {
      handleUpdate();
    }
  }, [newVersionAvailable]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/home/*" element={<HomePage />} />
      </Routes>

      {/* Dim background while snackbar is visible */}
      <Backdrop open={newVersionAvailable} sx={{ zIndex: 1300, color: "#fff" }} />

      <Snackbar
        open={newVersionAvailable}
        message="Updating to the latest version..."
        autoHideDuration={5000}
        onClose={() => setNewVersionAvailable(false)}
      />
    </Router>
  );
}
