import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Tooltip,
} from "@mui/material";
import {
  Dashboard,
  Category,
  Inventory,
  ShoppingCart,
  AccountBalance,
  PieChart,
  Notifications,
  BarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";

import logo from "../../assets/logo.png";

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setCollapsed(!collapsed);

  const menuItems = [
    { label: "Dashboard", icon: <Dashboard fontSize="small" />, path: "/dashboard" },
    { label: "Productos", icon: <Category fontSize="small" />, path: "/products" },
    { label: "Inventario", icon: <Inventory fontSize="small" />, path: "/inventory" },
    { label: "Ventas", icon: <ShoppingCart fontSize="small" />, path: "/sales" },
    { label: "Contabilidad", icon: <AccountBalance fontSize="small" />, path: "/accounting" },
    { label: "Presupuesto", icon: <PieChart fontSize="small" />, path: "/budget-goals" },
    { label: "Alertas", icon: <Notifications fontSize="small" />, path: "/alertas" },
    { label: "Reportes", icon: <BarChart fontSize="small" />, path: "/reports" },
    { label: "Configuración", icon: <Settings fontSize="small" />, path: "/configuracion" },
  ];

  useEffect(() => {
    const current = menuItems.find((item) => location.pathname.startsWith(item.path));
    if (current) setActive(current.label);
  }, [location]);

  return (
    <Box
      sx={{
        width: mobile ? 280 : collapsed ? 72 : 240,
        maxWidth: "100%",
        transition: "width 0.3s",
        bgcolor: "#1e1e2f",
        height: mobile ? "100%" : "100dvh",
        minHeight: mobile ? "100%" : "100dvh",
        color: "white",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        alignSelf: "stretch",
        position: mobile ? "relative" : "sticky",
        top: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: mobile ? "flex-start" : collapsed ? "center" : "flex-start",
          px: 2,
          py: 2,
        }}
      >
        <img
          src={logo}
          alt="Logo Empresa"
          style={{
            width: mobile || !collapsed ? "48px" : "32px",
            transition: "width 0.3s",
            marginRight: mobile || !collapsed ? "10px" : 0,
          }}
        />
        {(mobile || !collapsed) && (
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "white" }}
          >
            Papelería Betty
          </Typography>
        )}
      </Box>

      <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />

      <List disablePadding sx={{ flexGrow: 1, pt: 1, overflowY: "auto", pb: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.label} title={collapsed ? item.label : ""} placement="right">
            <ListItemButton
              selected={active === item.label}
              onClick={() => {
                navigate(item.path);
                onNavigate?.();
              }}
              sx={{
                justifyContent: mobile ? "flex-start" : collapsed ? "center" : "flex-start",
                borderRadius: "10px",
                mx: 1,
                mb: 0.8,
                "&.Mui-selected": {
                  bgcolor: "#3f83f5",
                  boxShadow: "0 0 8px rgba(63,131,245,0.6)",
                  "& .MuiListItemIcon": { color: "white" },
                  "& .MuiListItemText-primary": {
                    color: "white",
                    fontWeight: "bold",
                  },
                },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 0 6px rgba(255,255,255,0.2)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "white",
                  minWidth: mobile ? 40 : collapsed ? "auto" : 40,
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {(mobile || !collapsed) && (
                <ListItemText primary={item.label} sx={{ color: "white" }} />
              )}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      {!mobile && (
        <Box sx={{ flexShrink: 0 }}>
          <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          <List disablePadding>
          <ListItemButton
            onClick={toggleSidebar}
            sx={{
              justifyContent: collapsed ? "center" : "flex-start",
              mx: 1,
              borderRadius: "10px",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.08)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "white",
                minWidth: collapsed ? "auto" : 40,
                justifyContent: "center",
              }}
            >
              {collapsed ? (
                <ChevronRight fontSize="small" />
              ) : (
                <ChevronLeft fontSize="small" />
              )}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText primary="Colapsar" sx={{ color: "white" }} />
            )}
          </ListItemButton>
          </List>
        </Box>
      )}
    </Box>
  );
}
