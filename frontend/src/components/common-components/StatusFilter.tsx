import { useState } from "react";
import { Box, Button, Menu, MenuItem } from "@mui/material";
import { FilterList } from "@mui/icons-material";

interface StatusFilterButtonProps {
  options: string[]; 
  onChange: (value: string) => void;
}

export default function StatusFilterButton({ options, onChange }: StatusFilterButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (value?: string) => {
    setAnchorEl(null);
    if (value) {
      onChange(value);
    }
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<FilterList />}
        onClick={handleClick}
      >
        Filtrar
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => handleClose()}>
        {options.map((opt) => (
          <MenuItem key={opt} onClick={() => handleClose(opt)}>
            {opt}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
