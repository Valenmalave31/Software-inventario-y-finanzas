import { Box, TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
}

export default function SearchBar({ placeholder = "Buscar...", onSearch }: SearchBarProps) {
  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: "text.secondary", fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          bgcolor: "white",
          borderRadius: "10px",
          "& .MuiOutlinedInput-root": {
            borderRadius: "10px",
            transition: "all 0.3s ease",
            "& fieldset": {
              borderColor: "#e0e0e0",
            },
            "&:hover fieldset": {
              borderColor: "#bdbdbd",
            },
            "&.Mui-focused": {
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
              "& fieldset": {
                borderWidth: "1px",
                borderColor: "#1976d2",
              },
            },
          },
          "& .MuiInputBase-input": {
            fontSize: "0.9rem",
            py: 1.2,
          },
        }}
      />
    </Box>
  );
}