import { Box, Paper } from "@mui/material";
import type { ReactNode } from "react";
import backgroundImage from "../../assets/auth-background.jpg";

type AuthLayoutProps = {
  children: ReactNode;
  leftContent?: ReactNode; 
};

export default function AuthLayout({ children, leftContent }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Box
        sx={{
          minHeight: { xs: "30vh", md: "100%" },
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          color: "white",
          p: 4,
        }}
      >
        {leftContent && (
          <Box
            sx={{
              position: "absolute",
              zIndex: 1,
              textAlign: "center",
              maxWidth: "80%",
              fontWeight: "bold",
              textShadow: "2px 2px 6px rgba(0,0,0,0.6)", 
            }}
          >
            {leftContent}
          </Box>
        )}
      </Box>


      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 3, sm: 4, md: 5 },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: { xs: 420, sm: 500, md: 600 },
            padding: { xs: 3, sm: 4, md: 6 },
            borderRadius: { xs: 3, md: 2 },
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

