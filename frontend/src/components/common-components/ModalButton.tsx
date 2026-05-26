import { Button, type ButtonProps } from "@mui/material";

interface ModalTriggerButtonProps {
  label: string;
  onClick: () => void;
  sx?: ButtonProps["sx"];
}

export default function ModalTriggerButton({ label, onClick, sx }: ModalTriggerButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      sx={sx}
    >
      {label}
    </Button>
  );
}
