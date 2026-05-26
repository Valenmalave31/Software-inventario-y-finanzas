import { Button } from "@mui/material";

type AuthButtonProps = {
  label: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
};

export default function AuthButton({
  label,
  type = "submit",
  onClick,
  disabled = false,
}: AuthButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      type={type}
      onClick={onClick}
      disabled={disabled}
      sx={{
        mt: { xs: 3, sm: 4 },
        width: "100%",       
        maxWidth: "100%",       
        alignSelf: "center",
        py: { xs: 1.2, sm: 1.4 },
        borderRadius: 2,
        fontWeight: 700,
      }}
    >
      {label}
    </Button>
  );
}
