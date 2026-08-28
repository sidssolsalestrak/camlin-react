import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Box
} from "@mui/material";

export default function CommonAppSelect({
  label,
  value,
  onChange,
  options = [],
  valueKey = "id",
  labelKey = "name",
  size = "small",
  multiple = false,
  error = false,
  sx = {},
  required = false,
  disabled = false
}) {
  const [open, setOpen] = useState(false);

  return (
    <FormControl
      fullWidth
      size={size}
      error={Boolean(error)}
      required={required}
      sx={{
        "& .MuiInputLabel-root": {
          color: Boolean(error) ? "#d32f2f" : "inherit",
        },
        "& .MuiOutlinedInput-root.Mui-error fieldset": {
          borderColor: "#d32f2f !important",
        },
        "& .MuiInputLabel-root.Mui-error": {
          color: "#d32f2f !important",
        },
        "& .MuiFormLabel-asterisk": {
          color: Boolean(error) ? "#d32f2f !important" : "inherit",
        },
        ...(disabled && {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#EEEEEE",
          },
          "& .MuiSelect-select": {
            backgroundColor: "#EEEEEE",
          },
          "& .MuiInputLabel-root.Mui-disabled": {
            color: "rgba(0, 0, 0, 0.6)",
          },
        }),
        ...sx,
      }}
    >
      <InputLabel>{label}</InputLabel>

      <Select
        multiple={multiple}
        value={value}
        label={label}
        disabled={disabled}
        open={disabled ? false : open}
        onOpen={() => !disabled && setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={(e) => {
          if (multiple && Array.isArray(e.target.value)) {
            const normalized = [...new Set(e.target.value.map(String))];
            onChange({ target: { value: normalized } });
          } else {
            onChange(e);
          }
        }}
        // SHOW CHIPS
        renderValue={(selected) =>
          multiple ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((val) => {
                const item = options.find(
                  (o) => String(o[valueKey]) === String(val)
                );
                return (
                  <Chip
                    key={val}
                    label={item ? item[labelKey] : ""}
                    onMouseDown={(e) => e.stopPropagation()} // Stop dropdown opening on chip click
                    onDelete={() => {
                      const newValue = value.filter((v) => v !== val);
                      onChange({ target: { value: newValue } });
                    }}
                    size="small"
                  />
                );
              })}
            </Box>
          ) : (
            options.find((o) => String(o[valueKey]) === String(value))?.[
            labelKey
            ] || ""
          )
        }
        MenuProps={{
          PaperProps: {
            sx: {
              maxHeight: 300,
              width: "auto",
              maxWidth: 300,
            },
          },
        }}
      >
        {options.map((item) => (
          <MenuItem
            key={item[valueKey]}
            value={String(item[valueKey])}
            onClick={() => setOpen(false)}
          >
            <ListItemText primary={item[labelKey]} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}