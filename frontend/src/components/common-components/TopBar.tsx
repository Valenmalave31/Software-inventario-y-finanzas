import { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Menu, MenuItem, Avatar, Typography, Divider, Badge, Paper } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import NotificationsIcon from "@mui/icons-material/Notifications";
import api from "../../services/api";

interface Notification {
  id: number;
  text: string;
  date: string;
  day: string;
  read: boolean;
  type: string;
}

interface TopBarProps {
  onLogout?: () => void;
  onNotificationsClick?: () => void; 
  onMenuClick?: () => void;
}

export default function TopBar({
  onLogout,
  onNotificationsClick,
  onMenuClick,
}: TopBarProps) {
  const [anchorProfile, setAnchorProfile] = useState<null | HTMLElement>(null);
  const [anchorNotifications, setAnchorNotifications] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [userName, setUserName] = useState("");

  const openProfile = Boolean(anchorProfile);
  const openNotifications = Boolean(anchorNotifications);

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await api.get("/planning/alerts-overview");
      const alerts = Array.isArray(response.data) ? response.data : [];

      const mappedNotifications = alerts.map((alert: any) => {
        const dateValue = alert.fecha ? new Date(alert.fecha) : new Date();
        const dayLabel = dateValue.toLocaleDateString("es-CO", {
          weekday: "long",
          day: "2-digit",
          month: "short",
        });

        return {
          id: alert.id_alerta,
          text: alert.tipo === "Stock"
            ? alert.mensaje
            : `${alert.tipo}: ${alert.mensaje}`,
          date: dateValue.toLocaleString("es-CO", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
          day: dayLabel,
          read: Boolean(alert.leida),
          type: alert.tipo || "General",
        } as Notification;
      });

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const fullName = [parsedUser?.nombre, parsedUser?.apellido].filter(Boolean).join(" ").trim();
        if (fullName) {
          setUserName(fullName);
        } else if (parsedUser?.nombre) {
          setUserName(parsedUser.nombre);
        }
      } catch (error) {
        console.error("Error leyendo usuario guardado:", error);
      }
    }

    loadNotifications();
  }, []);

  const handleOpenProfile = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorProfile(event.currentTarget);
  const handleCloseProfile = () => setAnchorProfile(null);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorNotifications(event.currentTarget);
    onNotificationsClick?.(); 
    loadNotifications();
  };
  const handleCloseNotifications = () => setAnchorNotifications(null);

  const handleLogout = async () => {
    try {
      handleCloseProfile(); 
      
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout'); 
      }
    } catch (error) {
      console.error("Sesión ya inválida en server o error de red");
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/';
      }
    }
  };

  const handleRemoveNotification = async (id: number) => {
    try {
      await api.delete(`/planning/alerts/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.patch(`/planning/alerts/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
    }
  };

  const notificationsByDay = useMemo(() => {
    return notifications.reduce<Record<string, Notification[]>>((acc, notification) => {
      if (!acc[notification.day]) acc[notification.day] = [];
      acc[notification.day].push(notification);
      return acc;
    }, {});
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 0.5,
        py: { xs: 0, sm: 0.5 },
        gap: { xs: 0.5, sm: 1.25 },
        flexWrap: "wrap",
      }}
    >
      <IconButton
        onClick={onMenuClick}
        sx={{
          display: { xs: "inline-flex", md: "none" },
          width: 32,
          height: 32,
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        }}
      >
        <MenuIcon sx={{ color: "#0f172a", fontSize: 18 }} />
      </IconButton>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.25 }, width: { xs: "auto", md: "100%" }, justifyContent: "flex-end" }}>
        <IconButton
          size="small"
          onClick={handleOpenNotifications}
          sx={{
            mr: 0.25,
            width: { xs: 30, sm: 42 },
            height: { xs: 30, sm: 42 },
            borderRadius: 2,
            border: "1px solid #e2e8f0",
            background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.06)",
            transition: "all 0.2s ease",
            "&:hover": {
              background: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
              borderColor: "#fdba74",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                fontWeight: 700,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
              },
            }}
          >
            <NotificationsNoneIcon sx={{ color: "#0f172a", fontSize: { xs: 18, sm: 20 } }} />
          </Badge>
        </IconButton>

        <Box sx={{ borderLeft: "1px solid #e2e8f0", height: 28, mx: { xs: 0.25, sm: 0.5 } }} />

        <Box
          sx={{
            textAlign: "right",
            mr: 0.5,
            cursor: "pointer",
            px: { xs: 0.5, sm: 1.25 },
            py: { xs: 0.4, sm: 0.75 },
            borderRadius: 2,
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#f8fafc",
            },
          }}
          onClick={handleOpenProfile}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.1, fontSize: { xs: "0.75rem", sm: "0.875rem" }, display: { xs: "none", sm: "block" } }}>
            {userName || ""}
          </Typography>
          <Typography variant="caption" sx={{ color: "#64748b", letterSpacing: 0.2, display: { xs: "none", sm: "block" } }}>
            Administrador
          </Typography>
        </Box>

        <Avatar
          sx={{
            bgcolor: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            width: { xs: 30, sm: 40 },
            height: { xs: 30, sm: 40 },
            cursor: "pointer",
            boxShadow: "0 8px 18px rgba(37, 99, 235, 0.25)",
            border: "2px solid #fff",
          }}
          onClick={handleOpenProfile}
        >
          <AccountCircleIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
        </Avatar>

        <Menu
          anchorEl={anchorProfile}
          open={openProfile}
          onClose={handleCloseProfile}
          PaperProps={{
            sx: {
              minWidth: { xs: 220, sm: 260 },
              maxWidth: "calc(100vw - 24px)",
              p: 1.25,
              borderRadius: 4,
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.14)",
            },
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 3,
              mb: 1,
              background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
              border: "1px solid #dbeafe",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {userName || ""}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b" }}>Administrador</Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
            <MenuItem
              onClick={handleLogout} 
              sx={{
                color: "#b91c1c",
                border: "1px solid #fecaca",
                backgroundColor: "#fef2f2",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                transition: "all 0.2s ease",
                "&:hover": { backgroundColor: "#fee2e2" },
              }}
            >
              <ExitToAppIcon sx={{ mr: 1, fontSize: 18 }} /> Cerrar sesión
            </MenuItem>
        </Menu>

        <Menu
          anchorEl={anchorNotifications}
          open={openNotifications}
          onClose={handleCloseNotifications}
          PaperProps={{
            sx: {
              minWidth: { xs: 280, sm: 360 },
              maxHeight: { xs: 420, sm: 520 },
              maxWidth: "calc(100vw - 24px)",
              p: { xs: 0.75, sm: 1.5 },
              borderRadius: 4,
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent",
              "&::-webkit-scrollbar": {
                width: 8,
              },
              "&::-webkit-scrollbar-track": {
                background: "transparent",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#cbd5e1",
                borderRadius: 999,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#94a3b8",
              },
            },
          }}
        >
          <Box sx={{ px: 0.75, pt: 0.15, pb: { xs: 0.85, sm: 1.5 } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a", fontSize: { xs: "0.82rem", sm: "1rem" } }}>
              Notificaciones
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>
              {unreadCount} pendientes de revisar
            </Typography>
          </Box>

          {loadingNotifications ? (
            <Box sx={{ py: 3, px: 1, display: "grid", placeItems: "center" }}>
              <Typography variant="body2" color="text.secondary">Cargando notificaciones...</Typography>
            </Box>
          ) : Object.keys(notificationsByDay).length === 0 ? (
            <Box sx={{ py: 3, px: 1, display: "grid", placeItems: "center" }}>
              <Paper
                elevation={0}
                sx={{
                  width: "100%",
                  p: 2,
                  borderRadius: 3,
                  textAlign: "center",
                  border: "1px dashed #cbd5e1",
                  backgroundColor: "#fff",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#334155" }}>
                  No hay notificaciones pendientes
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                  Todo está al día por ahora.
                </Typography>
              </Paper>
            </Box>
          ) : (
            Object.entries(notificationsByDay).map(([day, notifs]) => (
              <Box key={day} sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "#475569",
                    mb: 0.55,
                    display: "inline-flex",
                    px: 0.8,
                    py: 0.25,
                    borderRadius: 999,
                    backgroundColor: "#e2e8f0",
                    fontWeight: 700,
                    textTransform: "capitalize",
                    fontSize: { xs: "0.6rem", sm: "0.75rem" },
                  }}
                >
                  {day}
                </Typography>
                {notifs.map((notif) => (
                  <Paper
                    key={notif.id}
                    elevation={0}
                    sx={{
                      p: { xs: 0.85, sm: 1.4 },
                      mb: 0.65,
                      position: "relative",
                      bgcolor: notif.read ? "#f8fafc" : notif.type === "Stock" ? "#fff7ed" : "#eff6ff",
                      border: notif.read ? "1px solid #e2e8f0" : notif.type === "Stock" ? "1px solid #fdba74" : "1px solid #93c5fd",
                      borderRadius: 3,
                      overflow: "hidden",
                      boxShadow: notif.read ? "none" : "0 8px 20px rgba(15, 23, 42, 0.05)",
                      transition: "all 0.2s ease",
                      "&:hover": { transform: "translateY(-1px)", boxShadow: "0 12px 26px rgba(15, 23, 42, 0.08)" },
                    }}
                  >
                    <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: notif.type === "Stock" ? "#f97316" : "#2563eb" }} />
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 0.65, sm: 1.2 }, pr: { xs: 2.5, sm: 4 } }}>
                      <Avatar
                        sx={{
                          width: { xs: 22, sm: 34 },
                          height: { xs: 22, sm: 34 },
                          bgcolor: notif.type === "Stock" ? "#fed7aa" : notif.type === "Vencimiento" ? "#dbeafe" : "#e0f2fe",
                          color: notif.type === "Stock" ? "#9a3412" : notif.type === "Vencimiento" ? "#1d4ed8" : "#0369a1",
                          boxShadow: "0 6px 12px rgba(15, 23, 42, 0.08)",
                        }}
                      >
                        {notif.type === "Stock" ? <Inventory2Icon sx={{ fontSize: { xs: 11, sm: 16 } }} /> : notif.type === "Vencimiento" ? <WarningAmberIcon sx={{ fontSize: { xs: 11, sm: 16 } }} /> : <NotificationsIcon sx={{ fontSize: { xs: 11, sm: 16 } }} />}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: notif.read ? 400 : 800, color: notif.read ? "#64748b" : notif.type === "Stock" ? "#9a3412" : "#1d4ed8", lineHeight: 1.2, fontSize: { xs: "0.65rem", sm: "0.875rem" } }}>
                          {notif.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.1, fontSize: { xs: "0.56rem", sm: "0.75rem" } }}>
                          {notif.date}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ position: "absolute", top: 2, right: 2, display: "flex", gap: 0.25 }}>
                      {!notif.read && (
                        <IconButton
                          size="small"
                          sx={{
                            p: 0.15,
                            bgcolor: "#eef2ff",
                            border: "1px solid #c7d2fe",
                            "&:hover": { bgcolor: "#e0e7ff" },
                          }}
                          onClick={() => handleMarkAsRead(notif.id)}
                        >
                          <CheckCircleIcon sx={{ color: "#4f46e5", fontSize: { xs: 12, sm: 16 } }} />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        sx={{
                          p: 0.15,
                          bgcolor: "#fff1f2",
                          border: "1px solid #fecdd3",
                          "&:hover": { bgcolor: "#ffe4e6" },
                        }}
                        onClick={() => handleRemoveNotification(notif.id)}
                      >
                        <CloseIcon sx={{ color: "#e11d48", fontSize: { xs: 12, sm: 16 } }} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ))
          )}
        </Menu>
      </Box>
    </Box>
  );
}
