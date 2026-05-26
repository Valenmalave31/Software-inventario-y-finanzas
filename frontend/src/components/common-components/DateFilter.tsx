import { Box, Button } from "@mui/material";
import type { SxProps } from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import { useState } from "react";

interface DateRangeFilterProps {
  onChange: (start: string, end: string) => void;
  sx?: SxProps;
}

export default function DateRangeFilter({ onChange, sx }: DateRangeFilterProps) {
  const [start, setStart] = useState<Dayjs | null>(null);
  const [end, setEnd] = useState<Dayjs | null>(null);

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", ...sx }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Fecha inicio"
          value={start}
          slotProps={{
            textField: {
              size: "small",
              sx: {
                "& .MuiInputBase-root": {
                  height: 32, 
                },
                "& .MuiInputLabel-root": {
                  fontSize: 13,
                },
                "& input": {
                  fontSize: 13,
                  padding: "2px 2px",
                },
              },
            },
          }}
          onChange={(newValue) => {
            setStart(newValue);
            if (newValue && end) {
              onChange(newValue.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
            }
          }}
        />
        <DatePicker
          label="Fecha fin"
          value={end}
          slotProps={{
            textField: {
              size: "small",
              sx: {
                "& .MuiInputBase-root": {
                  height: 32,
                },
                "& .MuiInputLabel-root": {
                  fontSize: 13,
                },
                "& input": {
                  fontSize: 13,
                  padding: "2px 2px",
                },
              },
            },
          }}
          onChange={(newValue) => {
            setEnd(newValue);
            if (start && newValue) {
              onChange(start.format("YYYY-MM-DD"), newValue.format("YYYY-MM-DD"));
            }
          }}
        />
      </LocalizationProvider>
      <Button
        variant="contained"
        size="small"
        startIcon={<CalendarToday fontSize="small" />}
        onClick={() => {
          if (start && end) {
            onChange(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
          }
        }}
        sx={{ height: 32, fontSize: 13 }}
      >
        Aplicar
      </Button>
    </Box>
  );
}
