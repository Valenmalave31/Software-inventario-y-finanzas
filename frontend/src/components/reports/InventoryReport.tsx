import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Stack, Divider, CircularProgress, List, ListItem, ListItemIcon, ListItemText, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Assessment, PieChartOutlined, DonutLarge, Warning, ErrorOutline, AccessTime } from "@mui/icons-material";
import DataTable from "../common-components/Table";
import ExportPDF from "../common-components/ExportPDF";
import api from "../../services/api";

type Product = {
  id: number;
  name?: string;
  stock?: number;
  minStock?: number;
  purchasePrice?: number;
  salePrice?: number;
  category?: { name?: string };
};

type InventoryMovement = {
  id_mov?: number;
  cantidad?: number;
  producto?: { id?: number; name?: string };
};

type CategoryData = {
  name: string;
  invested: number;
  revenue: number;
  value: number;
};

type ApiAlert = {
  id_alerta: number;
  tipo: string;
  mensaje: string;
  fecha: string;
};

type StockAlert = {
  id: number;
  text: string;
  time: string;
};

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

const toNumber = (value: unknown) => Number(value) || 0;
const formatMoney = (value: unknown) => `$${toNumber(value).toLocaleString("es-CO")}`;

export default function InventoryReport() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const relativeTime = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Reciente";

    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes <= 1) return "Hace un momento";
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;

    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? "s" : ""}`;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/planning/inventory-overview");
        const data = response?.data || {};

        const productsData = Array.isArray(data.products) ? data.products : [];
        const movementsData = Array.isArray(data.movements) ? data.movements : [];
        const alertsData = Array.isArray(data.alerts) ? (data.alerts as ApiAlert[]) : [];

        setProducts(productsData);
        setMovements(movementsData);

        const mappedStockAlerts = alertsData
          .filter((alert) => alert.tipo === "Stock")
          .slice(0, 5)
          .map((alert) => ({
            id: Number(alert.id_alerta),
            text: alert.mensaje,
            time: relativeTime(alert.fecha),
          }));

        setStockAlerts(mappedStockAlerts);
      } catch (error) {
        setProducts([]);
        setMovements([]);
        setStockAlerts([]);
        console.error("Error cargando reporte de inventario global:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    const activeProducts = products.length;
    const lowStockItems = products.filter((p) => toNumber(p.stock) <= toNumber(p.minStock));
    const totalInvested = products.reduce((acc, p) => acc + toNumber(p.stock) * toNumber(p.purchasePrice), 0);
    const totalMarketValue = products.reduce((acc, p) => acc + toNumber(p.stock) * toNumber(p.salePrice), 0);
    const totalProfit = totalMarketValue - totalInvested;

    const categoryMap = new Map<string, CategoryData>();
    for (const p of products) {
      const category = p.category?.name || "Sin categoria";
      const current = categoryMap.get(category) || { name: category, invested: 0, revenue: 0, value: 0 };
      current.invested += toNumber(p.stock) * toNumber(p.purchasePrice);
      current.revenue += toNumber(p.stock) * toNumber(p.salePrice);
      current.value += toNumber(p.stock) * toNumber(p.salePrice);
      categoryMap.set(category, current);
    }

    const movementMap = new Map<string, number>();
    for (const mov of movements) {
      const name = mov.producto?.name || "Producto";
      movementMap.set(name, (movementMap.get(name) || 0) + toNumber(mov.cantidad));
    }

    const rows = products
      .map((p) => {
        const stock = toNumber(p.stock);
        const invested = stock * toNumber(p.purchasePrice);
        const market = stock * toNumber(p.salePrice);
        return {
          id: p.id,
          producto: p.name || "Producto",
          stock: `${stock} u. (min ${toNumber(p.minStock)})`,
          inversion: formatMoney(invested),
          venta: formatMoney(market),
          ganancia: formatMoney(market - invested),
          movimiento: `${movementMap.get(p.name || "Producto") || 0} u.`,
        };
      })
      .sort((a, b) => toNumber(String(b.movimiento).replace(/[^0-9.-]/g, "")) - toNumber(String(a.movimiento).replace(/[^0-9.-]/g, "")));

    return {
      activeProducts,
      lowStockItems,
      totalInvested,
      totalMarketValue,
      totalProfit,
      categoryChartData: Array.from(categoryMap.values()),
      rows,
    };
  }, [movements, products]);

  const columns = [
    { field: "producto", headerName: "Producto" },
    { field: "stock", headerName: "Stock" },
    { field: "inversion", headerName: "Inversion" },
    { field: "venta", headerName: "P. Venta" },
    { field: "ganancia", headerName: "Ganancia" },
    { field: "movimiento", headerName: "Movimientos" },
  ];

  const cardStyle = { p: 3, borderRadius: "20px", bgcolor: "#fff", border: "1px solid #eef2f6" };

  return (
    <Box id="inventory-report-export-root" sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f4f7fa", minHeight: "100vh" }}>
      <Box sx={{ mb: { xs: 3, md: 4 }, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, color: "#1a202c" }}>Reporte de Inventario</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.78rem", md: "0.875rem" } }}>Auditoria consolidada de activos y existencias</Typography>
        </Box>
        <ExportPDF fileName="reporte-inventario" targetSelector="#inventory-report-export-root" />
      </Box>

      <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, flexDirection: { xs: "column", lg: "row" }, alignItems: "stretch" }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
          <Paper sx={{ ...cardStyle, background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", color: "#fff" }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Ganancia Neta Proyectada</Typography>
            <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 800, my: 1, lineHeight: 1.2 }}>{loading ? "..." : formatMoney(stats.totalProfit)}</Typography>
            <Typography variant="caption">Calculada desde inventario real</Typography>
          </Paper>

          <Paper sx={cardStyle}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <DonutLarge fontSize="small" color="primary" /> Distribucion de Valor
            </Typography>
            <Box sx={{ height: { xs: 160, md: 180 } }}>
              {loading ? (
                <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <CircularProgress size={22} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.categoryChartData} innerRadius={isMobile ? 42 : 50} outerRadius={isMobile ? 62 : 70} paddingAngle={5} dataKey="value">
                      {stats.categoryChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">Inversion Total</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{loading ? "..." : formatMoney(stats.totalInvested)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" color="text.secondary">Productos Activos</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>{loading ? "..." : stats.activeProducts}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Paper
            sx={{
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid #ffe0b2",
              boxShadow: "0 4px 20px rgba(255, 152, 0, 0.05)",
              flexGrow: 1,
            }}
          >
            <Box sx={{ p: 2.5, bgcolor: "#fff3e0", display: "flex", alignItems: "center", gap: 1 }}>
              <Warning sx={{ color: "#f57c00" }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#e65100", fontSize: { xs: "1rem", sm: "1.1rem", md: "1.25rem" } }}>
                Alertas de Stock Bajo
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ py: 4, display: "grid", placeItems: "center" }}>
                <CircularProgress size={22} />
              </Box>
            ) : (
              <List sx={{ p: 0, flexGrow: 1, overflowY: "auto", maxHeight: { xs: 320, lg: 360 } }}>
                {stockAlerts.length === 0 ? (
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={<Typography variant="body2" sx={{ fontWeight: 700, color: "#2d3748" }}>No hay alertas de stock bajo</Typography>}
                      secondary={<Typography variant="caption" color="text.disabled">Cuando el stock llegue al mínimo aparecerán aquí.</Typography>}
                    />
                  </ListItem>
                ) : (
                  stockAlerts.map((alert, i) => (
                    <Box key={alert.id}>
                      <ListItem sx={{ py: 2, "&:hover": { bgcolor: "#fffbf2" }, cursor: "pointer" }}>
                        <ListItemIcon sx={{ minWidth: 45 }}>
                          <ErrorOutline color="error" />
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
                      {i < stockAlerts.length - 1 && <Divider sx={{ mx: 2, opacity: 0.5 }} />}
                    </Box>
                  ))
                )}
              </List>
            )}

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

        <Box sx={{ flex: 2, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
          <Paper sx={cardStyle}>
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <PieChartOutlined color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Comparativa: Inversion vs Venta por Categoria</Typography>
            </Box>
            <Box sx={{ height: { xs: 250, md: 300 } }}>
              {loading ? (
                <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} tickFormatter={(v) => `$${toNumber(v) / 1000}k`} width={isMobile ? 42 : 60} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} formatter={(v) => formatMoney(v)} />
                    {!isMobile && <Legend />}
                    <Bar name="Costo" dataKey="invested" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar name="Venta" dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          <Paper sx={cardStyle}>
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
              <Assessment color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Consolidado Maestro de Mercancia</Typography>
            </Box>
            {loading ? (
              <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
                <CircularProgress size={26} />
              </Box>
            ) : (
              <DataTable columns={columns} rows={stats.rows} actions={false} />
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
