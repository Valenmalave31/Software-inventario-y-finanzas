import { TextField } from "@mui/material";

type EmailFieldProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: string;
};

export default function EmailField({
  value,
  onChange,
  onBlur,
  error = false,
  helperText = "",
}: EmailFieldProps) {
  return (
    <TextField
      label="Correo electrónico"
      name="email"
      type="email"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      helperText={helperText}
      fullWidth
      size="small"
      margin="normal"
      sx={{
        "& .MuiInputBase-root": {
          borderRadius: 2,
        },
      }}
    />
  );
}
