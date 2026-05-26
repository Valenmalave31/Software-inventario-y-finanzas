import { Box, Typography } from "@mui/material";

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  change?: string;
  color?: string; 
}

export default function MetricCard({
  icon,
  value,
  label,
  change,
  color = "#ededfa",
}: MetricCardProps) {
  return (
    <Box
      sx={{
        bgcolor: color,
        borderRadius: "8px",
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        color: "black",
      }}
    >
      <Box sx={{ fontSize: 32 }}>{icon}</Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1rem", sm: "1.25rem" } }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: "0.72rem", sm: "0.875rem" } }}>{label}</Typography>
        {change && (
          <Typography
            variant="caption"
            sx={{ color: change.startsWith("-") ? "red" : "lightgreen", fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
          >
            {change}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
