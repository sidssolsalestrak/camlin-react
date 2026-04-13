import React from "react";
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
}) {
  return (
    <FormControl
      fullWidth
      size={size}
      error={Boolean(error)}
      sx={{
        "& .MuiInputLabel-root": {
          color: Boolean(error) ? "red" : "inherit",
        },
        "& .MuiOutlinedInput-root.Mui-error fieldset": {
          borderColor: "red !important",
        },
        "& .MuiInputLabel-root.Mui-error": {
          color: "red !important",
        },
        ...sx,
      }}
    >
      <InputLabel>{label}</InputLabel>

      <Select
        multiple={multiple}
        value={value}
        label={label}
        onChange={onChange}
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
          <MenuItem key={item[valueKey]} value={String(item[valueKey])}>
            <ListItemText primary={item[labelKey]} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
