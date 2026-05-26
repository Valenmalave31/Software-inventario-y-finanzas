import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Stack, Chip, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { 
  ResponsiveContainer, Tooltip, XAxis, YAxis, 
  CartesianGrid, LineChart, Line, BarChart, Bar
} from "recharts";
import { 
  ShowChart, 
  ArrowUpward, ArrowDownward, LocalAtm 
} from "@mui/icons-material";
import DateRangeFilter from "../common-components/DateFilter";
import ExportPDF from "../common-components/ExportPDF";
import api from "../../services/api";

type ProductRank = {
  name: string;
  qty: number;
};

type SalesSummary = {
  totalRevenue: number;
  totalSalesCount: number;
  totalProductsSold: number;
  topProducts: ProductRank[];
  bottomProducts: ProductRank[];
};

type SalesSeriesPoint = {
  date: string;
  name: string;
  total: number;
};

const toNumber = (value: unknown) => Number(value) || 0;

const formatMoney = (value: unknown) => `$${toNumber(value).toLocaleString("es-CO")}`;

const defaultRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const from = `${year}-${month}-01`;
  const to = `${year}-${month}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
  return { from, to };
};

export default function SalesReport() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary>({
    totalRevenue: 0,
    totalSalesCount: 0,
    totalProductsSold: 0,
    topProducts: [],
    bottomProducts: [],
  });
  const [series, setSeries] = useState<SalesSeriesPoint[]>([]);

  const handleDateChange = (start: string, end: string) => {
    setRange({ from: start, to: end });
  };

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const [summaryRes, seriesRes] = await Promise.allSettled([
          api.get("/sales/summary", { params: range }),
          api.get("/sales/timeseries", { params: range }),
        ]);

        if (summaryRes.status === "fulfilled") {
          setSummary({
            totalRevenue: toNumber(summaryRes.value.data?.totalRevenue),
            totalSalesCount: toNumber(summaryRes.value.data?.totalSalesCount),
            totalProductsSold: toNumber(summaryRes.value.data?.totalProductsSold),
            topProducts: Array.isArray(summaryRes.value.data?.topProducts) ? summaryRes.value.data.topProducts : [],
            bottomProducts: Array.isArray(summaryRes.value.data?.bottomProducts) ? summaryRes.value.data.bottomProducts : [],
          });
        } else {
          setSummary({ totalRevenue: 0, totalSalesCount: 0, totalProductsSold: 0, topProducts: [], bottomProducts: [] });
          console.error("Error cargando resumen de ventas:", summaryRes.reason);
        }

        if (seriesRes.status === "fulfilled") {
          setSeries(Array.isArray(seriesRes.value.data) ? seriesRes.value.data : []);
        } else {
          setSeries([]);
          console.error("Error cargando serie de ventas:", seriesRes.reason);
        }
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [range]);

  const stats = useMemo(() => {
    return {
      ...summary,
      dayData: series,
    };
  }, [series, summary]);

  const cardStyle = { p: 3, borderRadius: "24px", bgcolor: "#fff", border: "1px solid #eef2f6" };

  return (
    <Box id="sales-report-export-root" sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      
      <Box sx={{ mb: { xs: 3, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 900, color: "#1e293b", letterSpacing: "-1px" }}>Reporte de Ventas</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: "0.78rem", md: "0.875rem" } }}>Betty's Finanzas • Análisis de rendimiento</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: { xs: "stretch", md: "center" }, gap: 1.5, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
          <ExportPDF fileName="reporte-ventas" targetSelector="#sales-report-export-root" />
          <Paper sx={{ p: 1, borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.04)", width: { xs: "100%", md: "auto" } }}>
            <DateRangeFilter onChange={handleDateChange} />
          </Paper>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, flexDirection: { xs: "column", lg: "row" } }}>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
          
          <Paper sx={{ ...cardStyle, background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", color: "#fff" }}>
            <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Ingresos del Periodo</Typography>
            <Typography variant={isMobile ? "h4" : "h3"} sx={{ fontWeight: 800, mt: 1, lineHeight: 1.2 }}>
              {loading ? "..." : formatMoney(stats.totalRevenue)}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <LocalAtm sx={{ opacity: 0.5 }} />
                <Typography variant="caption">Total recaudado en caja</Typography>
            </Stack>
          </Paper>

          <Paper sx={cardStyle}>
            <Typography variant="subtitle2" sx={{ color: "#10b981", fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowUpward fontSize="small" /> Productos Estrella (Top 6)
            </Typography>
            {loading ? (
              <Box sx={{ py: 2, display: "grid", placeItems: "center" }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
            <Stack spacing={1}>
                {stats.topProducts.map((p, i) => (
                <Box key={i} sx={{ p: 1.5, bgcolor: "#f0fdf4", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: { xs: "0.72rem", md: "0.75rem" }, pr: 1 }}>{p.name}</Typography>
                        <Chip label={`${p.qty} u.`} size="small" sx={{ height: 20, fontSize: 10, bgcolor: "#10b981", color: "#fff" }} />
                    </Box>
                ))}
            </Stack>
            )}
          </Paper>

          <Paper sx={cardStyle}>
            <Typography variant="subtitle2" sx={{ color: "#f43f5e", fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ArrowDownward fontSize="small" /> Baja Rotación (Top 6)
            </Typography>
            {loading ? (
              <Box sx={{ py: 2, display: "grid", placeItems: "center" }}>
                <CircularProgress size={20} />
              </Box>
            ) : (
            <Stack spacing={1}>
                {stats.bottomProducts.map((p, i) => (
                    <Box key={i} sx={{ p: 1.5, bgcolor: "#fff1f2", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: { xs: "0.72rem", md: "0.75rem" }, pr: 1 }}>{p.name}</Typography>
                        <Typography variant="caption" sx={{ color: "#f43f5e", fontWeight: 800 }}>{p.qty} u.</Typography>
                    </Box>
                ))}
            </Stack>
            )}
          </Paper>
        </Box>

        <Box sx={{ flex: 2, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
          
          <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, flexWrap: "wrap" }}>
            <Paper sx={{ ...cardStyle, flex: 1, minWidth: { xs: "100%", sm: "200px" } }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>FACTURACIÓN</Typography>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800 }}>{loading ? "..." : stats.totalSalesCount}</Typography>
              <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>Ventas realizadas</Typography>
            </Paper>
            <Paper sx={{ ...cardStyle, flex: 1, minWidth: { xs: "100%", sm: "200px" } }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700 }}>VOLUMEN SALIDA</Typography>
              <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800 }}>{loading ? "..." : stats.totalProductsSold}</Typography>
              <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 600 }}>Artículos entregados</Typography>
            </Paper>
          </Box>

          <Paper sx={{ ...cardStyle, flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShowChart color="primary" /> Flujo de Ingresos Semanal
            </Typography>
            <Box sx={{ height: { xs: 260, md: 350 } }}>
              {loading ? (
                <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dayData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} tickFormatter={(v) => `$${toNumber(v)/1000}k`} width={isMobile ? 42 : 60} />
                    <Tooltip formatter={(v) => formatMoney(v)} />
                    <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={isMobile ? 3 : 4} dot={{ r: isMobile ? 4 : 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>

          <Paper sx={cardStyle}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>Comparativa de Carga Diaria</Typography>
            <Box sx={{ height: { xs: 170, md: 200 } }}>
              {loading ? (
                <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                  <CircularProgress size={22} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.dayData}>
                    <XAxis dataKey="name" hide />
                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(v) => formatMoney(v)} />
                    <Bar dataKey="total" fill="#e2e8f0" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}