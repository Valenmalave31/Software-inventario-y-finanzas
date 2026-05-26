import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Stack, Divider, Chip, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, ReceiptLong, Savings, Assessment, Payments } from "@mui/icons-material";
import DateRangeFilter from "../common-components/DateFilter";
import ExportPDF from "../common-components/ExportPDF";
import api from "../../services/api";

type TransactionSummary = {
  totalIncome?: number;
  totalExpenses?: number;
  utilidadNeta?: number;
  profitMargin?: number;
};

type TransactionSeries = {
  date: string;
  day: string;
  ingresos: number;
  costos: number;
  utilidad: number;
};

type SalesSummary = {
  totalRevenue?: number;
  totalSalesCount?: number;
};

type PaymentSummary = {
  preferredMethod?: string;
};

const toNumber = (value: unknown) => Number(value) || 0;
const formatMoney = (value: unknown) => `$${toNumber(value).toLocaleString("es-CO")}`;

const defaultRange = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const lastDay = String(new Date(y, now.getMonth() + 1, 0).getDate()).padStart(2, "0");
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${lastDay}` };
};

export default function FinanceReport() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TransactionSummary>({});
  const [series, setSeries] = useState<TransactionSeries[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({});
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/planning/accounting-report-overview", { params: range });
        const data = response?.data || {};

        setSummary(data.summary || {});
        setSeries(Array.isArray(data.series) ? data.series : []);
        setSalesSummary(data.salesSummary || {});
        setPaymentSummary(data.paymentSummary || {});
      } catch (error) {
        setSummary({});
        setSeries([]);
        setSalesSummary({});
        setPaymentSummary({});
        console.error("Error cargando reporte contable global:", error);
      } finally {
        setLoading(false);
       }
     };

     loadData();
   }, [range]);

  const stats = useMemo(() => {
    const totalIngresos = toNumber(summary.totalIncome);
    const totalCostos = toNumber(summary.totalExpenses);
    const utilidadBruta = toNumber(summary.utilidadNeta || totalIngresos - totalCostos);
    const margenUtilidad =
      summary.profitMargin !== undefined ? toNumber(summary.profitMargin) : totalIngresos > 0 ? (utilidadBruta / totalIngresos) * 100 : 0;

    const chartData = series.map((item) => ({
      day: item.day,
      ingresos: toNumber(item.ingresos),
      costos: toNumber(item.costos),
      utilidad: toNumber(item.utilidad),
    }));

    const pieData = [
      { name: "Costos de Mercancia", value: Math.max(totalCostos, 0) },
      { name: "Utilidad Neta", value: Math.max(utilidadBruta, 0) },
    ];

    const ticketPromedio =
      toNumber(salesSummary.totalSalesCount) > 0
        ? toNumber(salesSummary.totalRevenue) / toNumber(salesSummary.totalSalesCount)
        : 0;

    const projectionMonthly =
      chartData.length > 0 ? (totalIngresos / chartData.length) * 30 : 0;

    const inversionRecuperada =
      totalIngresos + totalCostos > 0 ? (totalIngresos / (totalIngresos + totalCostos)) * 100 : 0;

    return {
      totalIngresos,
      totalCostos,
      utilidadBruta,
      margenUtilidad,
      chartData,
      pieData,
      ticketPromedio,
      projectionMonthly,
      inversionRecuperada,
      preferredMethod: paymentSummary.preferredMethod || "Sin datos",
    };
  }, [paymentSummary.preferredMethod, salesSummary.totalRevenue, salesSummary.totalSalesCount, series, summary.profitMargin, summary.totalExpenses, summary.totalIncome, summary.utilidadNeta]);

  const cardStyle = { p: 3, borderRadius: "24px", bgcolor: "#fff", border: "1px solid #eef2f6" };

  return (
    <Box id="accounting-report-export-root" sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ mb: { xs: 3, md: 4 }, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 900, color: "#1e293b" }}>Contabilidad y Finanzas</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.78rem", md: "0.875rem" } }}>Balance de ingresos vs costos operativos</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: { xs: "stretch", md: "center" }, gap: 1.5, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
          <ExportPDF fileName="reporte-contabilidad" targetSelector="#accounting-report-export-root" />
          <Paper sx={{ p: 1, borderRadius: "16px", width: { xs: "100%", md: "auto" } }}>
            <DateRangeFilter onChange={(s, e) => setRange({ from: s, to: e })} />
          </Paper>
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 }, flexDirection: { xs: "column", md: "row" } }}>
        <Paper sx={{ ...cardStyle, flex: 1, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", color: "#fff" }}>
          <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>Ingresos Totales</Typography>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, my: 1 }}>{loading ? "..." : formatMoney(stats.totalIngresos)}</Typography>
          <Chip label="Bruto" size="small" sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }} variant="outlined" />
        </Paper>

        <Paper sx={{ ...cardStyle, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Costo de Ventas (COGS)</Typography>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, my: 1, color: "#f43f5e" }}>
            {loading ? "..." : `-${formatMoney(stats.totalCostos).replace("$", "")}`}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>Inversion en mercancia vendida</Typography>
        </Paper>

        <Paper sx={{ ...cardStyle, flex: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">Utilidad Real</Typography>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, my: 1, color: "#10b981" }}>
            {loading ? "..." : `+${formatMoney(stats.utilidadBruta).replace("$", "")}`}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 16, color: "#10b981" }} />
            <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 700 }}>
              {loading ? "..." : `${stats.margenUtilidad.toFixed(1)}% de margen`}
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, flexDirection: { xs: "column", lg: "row" }, alignItems: "stretch" }}>
        <Paper sx={{ ...cardStyle, flex: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
            <Assessment color="primary" /> Rendimiento de Caja Diario
          </Typography>
          <Box sx={{ height: { xs: 260, md: 350 } }}>
            {loading ? (
              <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} tickFormatter={(v) => `$${toNumber(v) / 1000}k`} width={isMobile ? 42 : 60} />
                  <Tooltip formatter={(v) => formatMoney(v)} />
                  <Area type="monotone" dataKey="ingresos" stroke="#6366f1" fillOpacity={1} fill="url(#colorIng)" strokeWidth={3} />
                  <Area type="monotone" dataKey="utilidad" stroke="#10b981" fillOpacity={0} strokeWidth={3} strokeDasharray="5 5" />
                  {!isMobile && <Legend verticalAlign="top" align="right" />}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>

        <Paper sx={{ ...cardStyle, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Composicion del Capital</Typography>
          <Box sx={{ height: { xs: 220, md: 250 }, mt: "auto" }}>
            {loading ? (
              <Box sx={{ height: "100%", display: "grid", placeItems: "center" }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} innerRadius={isMobile ? 48 : 60} outerRadius={isMobile ? 68 : 80} paddingAngle={5} dataKey="value">
                    <Cell fill="#f43f5e" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Inversion Recuperada</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {loading ? "..." : `${stats.inversionRecuperada.toFixed(1)}%`}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="caption" color="text.secondary">Rentabilidad</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>
                {loading ? "..." : `${stats.margenUtilidad.toFixed(1)}%`}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Paper sx={{ ...cardStyle, mt: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2, md: 4 }} divider={isMobile ? undefined : <Divider orientation="vertical" flexItem />}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
              <Payments fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} /> METODO PREFERIDO
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800 }}>{loading ? "..." : stats.preferredMethod}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
              <ReceiptLong fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} /> TICKET PROMEDIO
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800 }}>{loading ? "..." : formatMoney(stats.ticketPromedio)}</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
              <Savings fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} /> PROYECCION MENSUAL
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: "#6366f1" }}>{loading ? "..." : formatMoney(stats.projectionMonthly)}</Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
