import React, { useState } from "react";
import {
  TextField,
  IconButton,
  InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const PasswordField = ({ password, setPassword }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      fullWidth
      label="Password"
      type={showPassword ? "text" : "password"}
      margin="normal"
      variant="outlined"
      required
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={() => setShowPassword((prev) => !prev)}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        )
      }}
    />
  );
};

export default PasswordField;
