import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Divider, Button, List, ListItem, ListItemIcon, ListItemText, CircularProgress } from "@mui/material";
import { AttachMoney, Inventory, TrendingDown, Warning, MenuBook, OpenInNew, ErrorOutline, AccessTime, Person, LocalShipping } from "@mui/icons-material";
import MetricCard from "../common-components/MetricCard";
import DataTable from "../common-components/Table";
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import api from "../../services/api";

type SaleDetail = {
  quantity?: number;
  subtotal?: number;
  product?: { name?: string };
};

type Sale = {
  id: number;
  date: string;
  total?: number;
  discount?: number;
  details?: SaleDetail[];
};

type ProductMetrics = {
  total: number;
  stockBajo: number;
};

type Transaction = {
  date: string;
  amount: number;
  typeId: number;
};

type ApiAlert = {
  id_alerta: number;
  tipo: string;
  mensaje: string;
  fecha: string;
};

type DashboardAlert = {
  id: number;
  text: string;
  time: string;
  icon: ReactNode;
};

const WEEK_LABELS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

const formatCurrency = (value: number) =>
  `$${Number(value || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

const toNumber = (value: unknown) => Number(value) || 0;

const parseApiDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ymd = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatPercent = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
};

const relativeTime = (dateValue: string) => {
  const date = parseApiDate(dateValue);
  if (!date) return "Reciente";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes <= 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;

  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
};

const getAlertIcon = (tipo: string): ReactNode => {
  if (tipo === "Stock") return <ErrorOutline color="error" />;
  if (tipo === "Vencimiento") return <LocalShipping sx={{ color: "#1976d2" }} />;
  if (tipo === "Pagos") return <Person sx={{ color: "#d32f2f" }} />;
  if (tipo === "Resumen") return <MenuBook sx={{ color: "#1976d2" }} />;
  return <Warning sx={{ color: "#ed6c02" }} />;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [productMetrics, setProductMetrics] = useState<ProductMetrics>({ total: 0, stockBajo: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dashboard/overview");
        const data = response.data ?? {};

        setSales(Array.isArray(data.sales) ? data.sales : []);
        setProductMetrics({
          total: toNumber(data.productMetrics?.total),
          stockBajo: toNumber(data.productMetrics?.stockBajo),
        });
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        const backendAlerts = Array.isArray(data.alerts) ? (data.alerts as ApiAlert[]) : [];
        setAlerts(
          backendAlerts.map((alert) => ({
            id: Number(alert.id_alerta),
            text: alert.mensaje,
            time: relativeTime(alert.fecha),
            icon: getAlertIcon(alert.tipo),
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const computed = useMemo(() => {
    const now = new Date();
    const currentMonth = monthKey(now);
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = monthKey(previousDate);

    const salesMonth = sales
      .filter((s) => {
        const d = parseApiDate(s.date);
        return d ? monthKey(d) === currentMonth : false;
      })
      .reduce((sum, s) => sum + toNumber(s.total), 0);

    const salesPrevMonth = sales
      .filter((s) => {
        const d = parseApiDate(s.date);
        return d ? monthKey(d) === previousMonth : false;
      })
      .reduce((sum, s) => sum + toNumber(s.total), 0);

    const expensesMonth = transactions
      .filter((t) => {
        const d = parseApiDate(t.date);
        return d ? monthKey(d) === currentMonth && Number(t.typeId) === 2 : false;
      })
      .reduce((sum, t) => sum + toNumber(t.amount), 0);

    const expensesPrevMonth = transactions
      .filter((t) => {
        const d = parseApiDate(t.date);
        return d ? monthKey(d) === previousMonth && Number(t.typeId) === 2 : false;
      })
      .reduce((sum, t) => sum + toNumber(t.amount), 0);

    const metrics = [
      {
        icon: <AttachMoney color="success" />,
        value: formatCurrency(salesMonth),
        label: "Ventas del Mes",
        change: formatPercent(salesMonth, salesPrevMonth),
        color: "#e8f5e9",
      },
      {
        icon: <Inventory color="primary" />,
        value: productMetrics.total.toLocaleString("es-CO"),
        label: "Productos en Stock",
        change: `${productMetrics.stockBajo} con stock bajo`,
        color: "#e3f2fd",
      },
      {
        icon: <TrendingDown color="error" />,
        value: formatCurrency(expensesMonth),
        label: "Gastos Operativos",
        change: formatPercent(expensesMonth, expensesPrevMonth),
        color: "#ffebee",
      },
      {
        icon: <Warning sx={{ color: "#f57c00" }} />,
        value: String(alerts.length),
        label: "Alertas Activas",
        change: alerts.length > 0 ? `${alerts.length} críticas` : "Sin alertas críticas",
        color: "#fff3e0",
      },
    ];

    const salesByDay = new Map<string, number>();
    sales.forEach((sale) => {
      const d = parseApiDate(sale.date);
      if (!d) return;
      salesByDay.set(ymd(d), (salesByDay.get(ymd(d)) || 0) + toNumber(sale.total));
    });

    const weeklySales = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - idx));
      const key = ymd(date);
      return {
        day: WEEK_LABELS[date.getDay()],
        ventas: salesByDay.get(key) || 0,
      };
    });

    const sortedSales = [...sales].sort((a, b) => {
      const dateA = parseApiDate(a.date)?.getTime() || 0;
      const dateB = parseApiDate(b.date)?.getTime() || 0;
      if (dateB !== dateA) return dateB - dateA;
      return Number(b.id || 0) - Number(a.id || 0);
    });

    const recentSales = sortedSales.slice(0, 10).map((sale) => {
      const quantity = Array.isArray(sale.details)
        ? sale.details.reduce((sum, detail) => sum + toNumber(detail.quantity), 0)
        : 0;

      const productName =
        Array.isArray(sale.details) && sale.details.length > 0
          ? sale.details[0]?.product?.name || "Producto"
          : "Sin detalle";

      const date = parseApiDate(sale.date);
      const timeText = date ? date.toLocaleDateString("es-CO") : "-";

      return {
        id: `V-${String(sale.id).padStart(3, "0")}`,
        producto: productName,
        cantidad: quantity,
        total: formatCurrency(toNumber(sale.total)),
        tiempo: timeText,
      };
    });

    return { metrics, weeklySales, recentSales };
  }, [productMetrics.stockBajo, productMetrics.total, sales, transactions, alerts]);

  const salesColumns = [
    { field: "id", headerName: "ID" },
    { field: "producto", headerName: "Producto" },
    { field: "cantidad", headerName: "Cantidad" },
    { field: "total", headerName: "Total" },
    { field: "tiempo", headerName: "Tiempo" },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: "#f9fafc", minHeight: "calc(100dvh - 64px)", pb: { xs: 4, md: 6 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a2027", letterSpacing: "-0.5px", fontSize: { xs: "1.6rem", sm: "2rem", md: "2.125rem" } }}>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: { xs: "0.85rem", sm: "1rem" } }}>
            Bienvenido de vuelta, <b>Betty</b>. Aquí está el resumen de tu negocio.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<MenuBook />}
          href="https://drive.google.com/file/d/1CQVKG3YRnIY0NLijNx9TydDhaLSc_-x2/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ borderRadius: "12px", textTransform: "none", px: 3, fontWeight: 700, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: { xs: "0.78rem", sm: "0.875rem" } }}
        >
          Manual de Usuario
        </Button>
      </Box>

      <Box sx={{ display: "grid", gap: 2, flexWrap: "wrap", mb: 4, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
        {computed.metrics.map((m, i) => (
          <Box key={i} sx={{ minWidth: 0 }}>
            <MetricCard {...m} />
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", lg: "row" }, mb: 4 }}>
        <Paper sx={{ flex: { xs: "1 1 100%", lg: "2 1 600px" }, p: { xs: 2, md: 3 }, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" } }}>Ventas de la Semana</Typography>
          {loading ? (
            <Box sx={{ height: { xs: 240, sm: 280, md: 320 }, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={computed.weeklySales}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1976d2" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9e9e9e" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9e9e9e" }} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Area type="monotone" dataKey="ventas" stroke="#1976d2" strokeWidth={3} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper sx={{ 
          flex: { xs: "1 1 100%", lg: "1 1 320px" }, 
          borderRadius: "20px", 
          display: "flex", 
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #ffe0b2",
          boxShadow: "0 4px 20px rgba(255, 152, 0, 0.05)"
        }}>
          <Box sx={{ p: 2.5, bgcolor: "#fff3e0", display: "flex", alignItems: "center", gap: 1 }}>
            <Warning sx={{ color: "#f57c00" }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#e65100", fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" } }}>
              Notificaciones (local)
            </Typography>
          </Box>
          
          <List sx={{ p: 0, flexGrow: 1, overflowY: "auto", maxHeight: { xs: 320, lg: "none" } }}>
            {alerts.map((alert, i) => (
              <Box key={i}>
                <ListItem sx={{ py: 2, "&:hover": { bgcolor: "#fffbf2" }, cursor: "pointer" }}>
                  <ListItemIcon sx={{ minWidth: 45 }}>
                    {alert.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="body2" sx={{ fontWeight: 700, color: "#2d3748" }}>{alert.text}</Typography>}
                    secondary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <AccessTime sx={{ fontSize: 14, color: "text.disabled" }} />
                        <Typography variant="caption" color="text.disabled">{alert.time}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {i < alerts.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
              </Box>
            ))}
          </List>
          
          <Box sx={{ p: 2, bgcolor: "#fafafa", textAlign: "center" }}>
            <Button
              fullWidth
              size="small"
              sx={{ textTransform: "none", fontWeight: 700, color: "#f57c00" }}
              onClick={() => navigate("/alertas")}
            >
              Ver todas las alertas
            </Button>
          </Box>
        </Paper>
      </Box>

      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, mb: 3, gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" } }}>Últimos Movimientos</Typography>
          <Button
            variant="text"
            endIcon={<OpenInNew />}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: { xs: "0.78rem", sm: "0.875rem" } }}
            onClick={() => navigate("/sales")}
          >
            Historial completo
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <DataTable columns={salesColumns} rows={computed.recentSales} actions={false} />
        )}
      </Paper>
    </Box>
  );
}