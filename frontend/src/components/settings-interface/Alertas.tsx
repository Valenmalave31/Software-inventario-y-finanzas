import * as React from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CircleIcon from '@mui/icons-material/Circle';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import AssessmentIcon from '@mui/icons-material/Assessment';
import api from '../../services/api';

interface AlertaCard {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  filtros: string[];
}

interface NotificacionFalsa {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: "Alta" | "Media" | "Baja";
  tiempo: string;
  tipo: string;
  leida: boolean;
}

export default function Alertas() {
  const [filtroTipo, setFiltroTipo] = React.useState<string[]>(["Todas"]);

  const [anchorElDelete, setAnchorElDelete] = React.useState<HTMLElement | null>(null);

  const openDeleteMenu: boolean = Boolean(anchorElDelete);

  const [notificaciones, setNotificaciones] = React.useState<NotificacionFalsa[]>([]);

  React.useEffect(() => {
    const obtenerAlertas = async () => {
      try {
        const response = await api.get('/planning/alerts-overview');
        const data = Array.isArray(response.data) ? response.data : [];

        const dataFormateada = data.map((alerta: any) => ({
          id: alerta.id_alerta, 
          titulo: alerta.tipo,
          descripcion: alerta.mensaje,
          prioridad: determinarPrioridad(alerta.tipo),
          tiempo: formatearTiempo(alerta.fecha),
          tipo: alerta.tipo,
          leida: alerta.leida
        }));
        setNotificaciones(dataFormateada);
      } catch (error) {
        console.error("Error cargando alertas:", error);
      }
    };

    obtenerAlertas();
  }, []);

const determinarPrioridad = (tipo: string): "Alta" | "Media" | "Baja" => {
  if (tipo === "Stock" || tipo === "Vencimiento" || tipo === "Pagos") return "Alta";
  return "Media";
};

const formatearTiempo = (fecha: string): string => {
  const diff = Math.floor((new Date().getTime() - new Date(fecha).getTime()) / 60000);

  if (diff < 1) return "Hace un momento";
  if (diff < 60) return `Hace ${diff} min`;
  const horas = Math.floor(diff / 60);
  return `Hace ${horas} hora${horas > 1 ? "s" : ""}`;
};

  const handleOpenDeleteMenu = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorElDelete(event.currentTarget);
  };

  const handleCloseDeleteMenu = (): void => {
    setAnchorElDelete(null);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("¿Eliminar TODAS las alertas?")) return;
    try {
      await api.delete('/planning/alerts');
      setNotificaciones([]); 
      handleCloseDeleteMenu();
    } catch (error) { console.error(error); }
  };

  const handleDeleteRead = async () => {
    if (!window.confirm("¿Eliminar alertas leídas?")) return;
    try {
      await api.delete('/planning/alerts/read');
      setNotificaciones(prev => prev.filter(n => !n.leida));
      handleCloseDeleteMenu();
    } catch (error) { console.error(error); }
  };

  const handleDeleteUnread = async () => {
    if (!window.confirm("¿Eliminar alertas no leídas?")) return;
    try {
      await api.delete('/planning/alerts/unread');
      setNotificaciones(prev => prev.filter(n => n.leida));
      handleCloseDeleteMenu();
    } catch (error) { console.error(error); }
  };

  const data: AlertaCard[] = [
    {
      label: "Total alertas",
      value: notificaciones.length,
      color: "#1976d2",
      icon: <NotificationsIcon />,
      filtros: ["Todas"]
    },

    {
      label: "Sin leer",
      value: notificaciones.filter(n => !n.leida).length,
      color: "#f59e0b",
      icon: <AccessTimeIcon />,
      filtros: ["Sin leer"]
    },

    {
      label: "Prioridad alta",
      value: notificaciones.filter(n => n.prioridad === "Alta").length,
      color: "#ef4444",
      icon: <WarningAmberIcon />,
      filtros: ["Pagos", "Vencimiento"]
    },

    {
      label: "Stock bajo",
      value: notificaciones.filter(n => n.tipo === "Stock").length,
      color: "#10b981",
      icon: <Inventory2Icon />,

      filtros: ["Stock"]
    }
  ];

  const toggleFiltro = (item: string): void => {
    const filtrosIndividuales = ["Sin leer", "Stock", "Pagos", "Vencimiento", "Metas", "Resumen"];   
     
      setFiltroTipo((prev) => {
          if (item === "Todas") return ["Todas"];
          let nuevosFiltros = prev.filter(f => f !== "Todas");
          
          if (nuevosFiltros.includes(item)) {
            nuevosFiltros = nuevosFiltros.filter(f => f !== item);
          } else {
            nuevosFiltros = [...nuevosFiltros, item];
          }

          if (filtrosIndividuales.every(f => nuevosFiltros.includes(f)) || nuevosFiltros.length === 0) {
            return ["Todas"];
          }

          return nuevosFiltros;
        });
      };

  const notificacionesFiltradas = notificaciones.filter(n => {
    if (filtroTipo.includes("Todas")) return true;

    const tipoNotif = n.tipo || "General";
    const cumpleSinLeer = filtroTipo.includes("Sin leer") ? !n.leida : false;
    const cumpleTipo = filtroTipo.includes(tipoNotif);

    if (filtroTipo.includes("Sin leer") && filtroTipo.length > 1) {
        return (!n.leida && filtroTipo.includes(tipoNotif));
    }

    return cumpleSinLeer || cumpleTipo;
  });

  const marcarComoLeida = async (id: number) => {
    try {
      await api.patch(`/planning/alerts/${id}/read`);
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    } catch (error) { console.error(error); }
  };

  const eliminarAlerta = async (id: number) => {
    const confirmar = window.confirm("¿Seguro que deseas eliminar esta alerta?");
    if (!confirmar) return;

    try {
      await api.delete(`/planning/alerts/${id}`);

      setNotificaciones(prev => prev.filter(n => n.id !== id));

    } catch (error) {
      console.error("Error al eliminar alerta:", error);
      alert("Hubo un error al intentar eliminar la alerta de la base de datos.");
    }
  };

  return (

    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 1, gap: 1.5, flexDirection: { xs: "column", md: "row" } }}>
        <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: "1.35rem", md: "1.5rem" } }}>Alertas</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
          <Button
            variant="text"
            startIcon={<CheckCircleIcon />}
            sx={{ textTransform: "none", color: "#1976d2", fontSize: { xs: "0.72rem", md: "0.875rem" }, px: { xs: 1, md: 1.5 } }}
            onClick={async () => {
              const confirmar = window.confirm("¿Marcar todas como leídas?");
              if (!confirmar) return;

              try {
                  await api.patch('/planning/alerts/read-all');

                setNotificaciones(prev =>
                  prev.map(n => ({ ...n, leida: true }))
                );

              } catch (error) {
                console.error("Error al marcar todas como leídas:", error);
                alert("No se pudieron marcar las alertas como leídas.");
              }
            }}
          >
            Marcar todas como leídas
          </Button>

          <Button variant="text" startIcon={<DeleteOutlineIcon />} onClick={handleOpenDeleteMenu} sx={{ textTransform: "none", color: "#ef4444", fontSize: { xs: "0.72rem", md: "0.875rem" }, px: { xs: 1, md: 1.5 } }}>
            Eliminar
          </Button>

          <Menu anchorEl={anchorElDelete} open={openDeleteMenu} onClose={handleCloseDeleteMenu}>
            <MenuItem onClick={handleDeleteAll}>Eliminar todo</MenuItem>
            <MenuItem onClick={handleDeleteRead}>Eliminar leídos</MenuItem>
            <MenuItem onClick={handleDeleteUnread}>Eliminar no leídos</MenuItem>
          </Menu>

        </Box>
      </Box>

      <Typography sx={{ fontSize: { xs: 12, md: 14 }, color: "#6b7280", mb: 4 }}>
        Notificaciones importantes sobre tu negocio
      </Typography>

      <Box
        sx={{
          display: { xs: "grid", md: "flex" },
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))" },
          gap: { xs: 1.5, md: 3 },
          flexWrap: "wrap",
        }}
      >
        {data.map((item, index) => {
          const activa = item.filtros.some(f => filtroTipo.includes(f));

          return (

            <Box key={index} sx={{
              flex: { md: "1 1 200px" }, maxWidth: { xs: "none", md: 350 }, minWidth: { xs: 0, md: 180 }, p: 1.5, borderRadius: 2,
              border: `1px solid ${activa ? item.color : "#e5e7eb"}`,
              backgroundColor: activa ? item.color : "#fff",
              display: "flex", alignItems: "center", gap: { xs: 1.25, md: 2 }
            }}>

              <Box sx={{ color: activa ? "#fff" : item.color }}>{item.icon}</Box>
              <Box>
                <Typography sx={{ fontSize: { xs: 16, md: 20 }, fontWeight: "bold", color: activa ? "#fff" : item.color }}>{item.value}</Typography>
                <Typography sx={{ fontSize: { xs: 11, md: 13 }, color: activa ? "#fff" : "#6b7280" }}>{item.label}</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 4 }}>
        <Box sx={{ p: 2, borderRadius: 3, backgroundColor: "#fff", border: "1px solid #e5e7eb", display: "flex", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          <FilterListIcon sx={{ color: "#9ca3af" }} />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {["Todas", "Sin leer", "Stock", "Metas", "Resumen", "Vencimiento", "Pagos"].map((item) => {
              const activo = filtroTipo.includes(item);

              return (
                <Box key={item} onClick={() => toggleFiltro(item)} sx={{
                  px: { xs: 1.8, md: 2.5 }, py: 0.8, borderRadius: "20px", cursor: "pointer", fontSize: { xs: 12, md: 14 }, fontWeight: 500,
                  backgroundColor: activo ? "#1976d2" : "#f3f4f6", color: activo ? "#fff" : "#4b5563"
                }}>
                  {item}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

     <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        {notificacionesFiltradas.map((notif) => (
          <Box
            key={notif.id}
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", md: "center" },
              p: 2,
              backgroundColor: notif.leida ? "#f9fafb" : "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 2,
              opacity: notif.leida ? 0.6 : 1,
              gap: { xs: 1.25, md: 0 },
              flexDirection: { xs: "column", md: "row" },
              "&:hover": { boxShadow: "0px 4px 12px rgba(0,0,0,0.05)" }
            }}
          >
            <Avatar sx={{
              bgcolor:
                notif.tipo === "Metas" ? "#dcfce7" :
                notif.tipo === "Resumen" ? "#eff6ff" :
                notif.tipo === "Stock" ? "#fee2e2" :
                notif.tipo === "Vencimiento" ? "#fff7ed" : "#fef3c7",
              color:
                notif.tipo === "Metas" ? "#16a34a" :
                notif.tipo === "Resumen" ? "#3b82f6" :
                notif.tipo === "Stock" ? "#ef4444" :
                notif.tipo === "Vencimiento" ? "#f97316" : "#f59e0b",
              borderRadius: 2,
              mr: { xs: 0, md: 2 },
              width: { xs: 34, md: 40 },
              height: { xs: 34, md: 40 }
            }}>
              {notif.tipo === "Metas" && <CheckCircleIcon />}
              {notif.tipo === "Resumen" && <AssessmentIcon />}
              {notif.tipo === "Stock" && <Inventory2Icon />}
              {notif.tipo === "Vencimiento" && <WarningAmberIcon />}
              {!["Metas", "Resumen", "Stock", "Vencimiento"].includes(notif.tipo) && <NotificationsIcon />}
            </Avatar>

            <Box sx={{ flexGrow: 1, width: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="subtitle2"
                  fontWeight={notif.leida ? 400 : "bold"}
                  color={notif.leida ? "#9ca3af" : "#1f2937"}
                  sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}
                >
                  {notif.titulo}
                </Typography>
                {!notif.leida && <CircleIcon sx={{ fontSize: 8, color: "#3b82f6" }} />}
              </Box>
              <Typography
                variant="body2"
                color={notif.leida ? "#9ca3af" : "#6b7280"}
                sx={{ fontSize: { xs: "0.78rem", md: "0.875rem" } }}
              >
                {notif.descripcion}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mt: 1, flexWrap: "wrap" }}>
                <Chip
                  label={notif.prioridad}
                  size="small"
                  sx={{
                    bgcolor: notif.prioridad === "Alta" ? "#fee2e2" : "#fef3c7",
                    color: notif.prioridad === "Alta" ? "#b91c1c" : "#b45309",
                    fontWeight: "bold", fontSize: 10
                  }}
                />
                <Typography variant="caption" color="#9ca3af" sx={{ fontSize: { xs: "0.68rem", md: "0.75rem" } }}>{notif.tiempo}</Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignSelf: { xs: "flex-end", md: "center" } }}>
              <IconButton size="small" onClick={() => marcarComoLeida(notif.id)}>
                <CheckIcon sx={{ fontSize: 18, color: "#d1d5db" }} />
              </IconButton>
              <IconButton size="small" onClick={() => eliminarAlerta(notif.id)}>
                <CloseIcon sx={{ fontSize: 18, color: "#d1d5db" }} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box> 
    </Box> 
  );
}