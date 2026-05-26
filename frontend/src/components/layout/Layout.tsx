import { useState } from "react";
import { Box, Drawer } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Sidebar from "../menu/Sidebar";
import TopBar from "../common-components/TopBar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", width: "100%" }}>
      {isDesktop ? (
        <Sidebar />
      ) : (
        <Drawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          ModalProps={{ keepMounted: true }}
          anchor="left"
          variant="temporary"
          SlideProps={{ mountOnEnter: true, unmountOnExit: true }}
          PaperProps={{ sx: { width: 280, maxWidth: "85vw", bgcolor: "transparent", boxShadow: "none" } }}
        >
          <Sidebar mobile onNavigate={() => setMobileMenuOpen(false)} />
        </Drawer>
      )}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "#f5f5f5",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 0, pb: 0 }}>
          <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
        </Box>
        <Box sx={{ minHeight: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
