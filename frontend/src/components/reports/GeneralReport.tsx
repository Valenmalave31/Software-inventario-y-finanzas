import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Paper, Divider, CircularProgress, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { ShoppingCart, Inventory, AccountBalance } from "@mui/icons-material";
import DataTable from "../common-components/Table";
import ExportPDF from "../common-components/ExportPDF";
import api from "../../services/api";

type SaleDetail = {
  quantity?: number;
  subtotal?: number;
  product?: { name?: string };
};

type Sale = {
  date?: string;
  total?: number;
  details?: SaleDetail[];
};

type Transaction = {
  date?: string;
  amount?: number;
  typeId?: number;
};

type TransactionSummary = {
  totalIncome?: number;
  totalExpenses?: number;
  balance?: number;
};

type ProductMetrics = {
  total?: number;
  stockBajo?: number;
};

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const toNumber = (value: unknown) => Number(value) || 0;

const formatMoney = (value: unknown) => `$${toNumber(value).toLocaleString("es-CO")}`;

const parseApiDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function GeneralReport() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [productMetrics, setProductMetrics] = useState<ProductMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/dashboard/overview");
        const data = response?.data || {};

        setSales(Array.isArray(data.sales) ? data.sales : []);
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
        setProductMetrics(data.productMetrics || null);
        setSummary(null);
      } catch (error) {
        setSales([]);
        setTransactions([]);
        setProductMetrics(null);
        setSummary(null);
        console.error("Error cargando reporte general global:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const reportData = useMemo(() => {
    const now = new Date();
    const monthlyBase = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        mes: MONTH_LABELS[date.getMonth()],
        ventas: 0,
        egresos: 0,
      };
    });

    const monthIndexByKey = new Map(monthlyBase.map((month, index) => [month.key, index]));

    let computedIncome = 0;
    for (const sale of sales) {
      const amount = toNumber(sale.total);
      computedIncome += amount;
      const date = parseApiDate(sale.date);
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthIndex = monthIndexByKey.get(key);
      if (monthIndex !== undefined) {
        monthlyBase[monthIndex].ventas += amount;
      }
    }

    let computedExpenses = 0;
    for (const transaction of transactions) {
      if (Number(transaction.typeId) !== 2) continue;
      const amount = toNumber(transaction.amount);
      computedExpenses += amount;
      const date = parseApiDate(transaction.date);
      if (!date) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthIndex = monthIndexByKey.get(key);
      if (monthIndex !== undefined) {
        monthlyBase[monthIndex].egresos += amount;
      }
    }

    const income = toNumber(summary?.totalIncome) || computedIncome;
    const expenses = toNumber(summary?.totalExpenses) || computedExpenses;
    const balance = toNumber(summary?.balance) || income - expenses;

    const productMap = new Map<string, number>();
    for (const sale of sales) {
      if (!Array.isArray(sale.details)) continue;
      for (const detail of sale.details) {
        const productName = detail.product?.name || "Producto";
        const subtotal = toNumber(detail.subtotal);
        productMap.set(productName, (productMap.get(productName) || 0) + subtotal);
      }
    }

    const topProducts = Array.from(productMap.entries())
      .map(([producto, ventas], index) => ({
        id: index + 1,
        producto,
        ventas: formatMoney(ventas),
      }))
      .sort((a, b) => toNumber(String(b.ventas).replace(/[^0-9.-]/g, "")) - toNumber(String(a.ventas).replace(/[^0-9.-]/g, "")))
      .slice(0, 10);

    const salesCurrentMonth = monthlyBase[monthlyBase.length - 1]?.ventas || 0;

    return {
      monthlySales: monthlyBase.map(({ mes, ventas, egresos }) => ({ mes, ventas, egresos })),
      profitability: [
        { name: "Ingresos", value: income },
        { name: "Egresos", value: expenses },
        { name: "Utilidad", value: balance },
      ],
      topProducts,
      cards: {
        salesCurrentMonth,
        inventoryTotal: toNumber(productMetrics?.total),
        inventoryLowStock: toNumber(productMetrics?.stockBajo),
        financialBalance: balance,
      },
    };
  }, [productMetrics?.stockBajo, productMetrics?.total, sales, summary?.balance, summary?.totalExpenses, summary?.totalIncome, transactions]);

  const COLORS = ["#6366f1", "#f43f5e", "#10b981"];

  const productColumns = [
    { field: "producto", headerName: "Producto" },
    { field: "ventas", headerName: "Ventas ($)" },
  ];

  return (
    <Box id="general-report-export-root" sx={{ p: { xs: 2, md: 5 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ mb: { xs: 3, md: 5 }, display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: 800, color: "#1e293b", mb: 1, letterSpacing: "-1px" }}>
            Reporte General
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", fontSize: { xs: "0.9rem", md: "1rem" } }}>
            Dashboard estrategico de rendimiento comercial y financiero.
          </Typography>
        </Box>
        <ExportPDF fileName="reporte-general" targetSelector="#general-report-export-root" />
      </Box>

      <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, flexWrap: "wrap", mb: { xs: 3, md: 5 } }}>
        {[
          {
            icon: <ShoppingCart />,
            title: "Ventas",
            desc: loading ? "Cargando..." : `Mes actual: ${formatMoney(reportData.cards.salesCurrentMonth)}`,
            color: "#6366f1",
            path: "/sales-report",
          },
          {
            icon: <Inventory />,
            title: "Inventario",
            desc: loading
              ? "Cargando..."
              : `${reportData.cards.inventoryTotal} productos | ${reportData.cards.inventoryLowStock} stock bajo`,
            color: "#10b981",
            path: "/inventory-report",
          },
          {
            icon: <AccountBalance />,
            title: "Finanzas",
            desc: loading ? "Cargando..." : `Balance: ${formatMoney(reportData.cards.financialBalance)}`,
            color: "#f43f5e",
            path: "/accounting-report",
          },
        ].map((item, index) => (
          <Paper
            key={index}
            onClick={() => navigate(item.path)}
            sx={{ ...cardStyle, flex: { xs: "1 1 100%", sm: "1 1 250px" }, textAlign: "center", cursor: "pointer" }}
          >
            <Box
              sx={{
                bgcolor: `${item.color}15`,
                color: item.color,
                width: { xs: 48, md: 56 },
                height: { xs: 48, md: 56 },
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              {item.icon}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b", fontSize: { xs: "0.95rem", md: "1rem" } }}>{item.title}</Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: { xs: "0.75rem", md: "0.8rem" } }}>{item.desc}</Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 2, md: 3 }, mb: { xs: 2, md: 3 } }}>
        <Paper sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 0" }, minHeight: { xs: 340, md: 400 } }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#334155" }}>Ingresos vs Egresos</Typography>
          {loading ? (
            <Box sx={{ height: "100%", minHeight: 280, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.monthlySales} margin={{ top: 0, right: isMobile ? 0 : 10, left: isMobile ? -18 : 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: isMobile ? 11 : 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} tickFormatter={(v) => `$${Number(v) / 1000000}M`} width={isMobile ? 42 : 60} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                {!isMobile && <Legend verticalAlign="top" align="right" height={36} iconType="circle" />}
                <Bar name="Ingresos" dataKey="ventas" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={isMobile ? 16 : 25} />
                <Bar name="Egresos" dataKey="egresos" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={isMobile ? 16 : 25} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 0" }, minHeight: { xs: 340, md: 400 } }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#334155" }}>Evolucion de Ventas</Typography>
          {loading ? (
            <Box sx={{ height: "100%", minHeight: 280, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.monthlySales} margin={{ top: 0, right: isMobile ? 6 : 20, left: isMobile ? -14 : 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} dy={10} tick={{ fontSize: isMobile ? 11 : 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: isMobile ? 11 : 12 }} tickFormatter={(v) => `$${Number(v) / 1000000}M`} width={isMobile ? 42 : 60} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Line type="monotone" dataKey="ventas" stroke="#6366f1" strokeWidth={isMobile ? 3 : 4} dot={{ r: isMobile ? 4 : 6, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 2, md: 3 } }}>
        <Paper sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1.5 1 0" }, minHeight: { xs: 340, md: 380 } }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: "#334155" }}>Top Productos Vendidos</Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8", mb: 2, display: "block" }}>Resumen del volumen de ventas por producto</Typography>
          <Divider sx={{ mb: 2, opacity: 0.6 }} />
          <Box sx={{ flexGrow: 1, overflowX: "auto" }}>
            <DataTable columns={productColumns} rows={reportData.topProducts} actions={false} />
          </Box>
        </Paper>

        <Paper sx={{ ...cardStyle, flex: { xs: "1 1 100%", lg: "1 1 0" }, minHeight: { xs: 340, md: 380 } }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: "#334155" }}>Distribucion de Rentabilidad</Typography>
          {loading ? (
            <Box sx={{ height: "100%", minHeight: 260, display: "grid", placeItems: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportData.profitability} dataKey="value" innerRadius={isMobile ? "55%" : "65%"} outerRadius={isMobile ? "78%" : "85%"} paddingAngle={8} stroke="none">
                  {reportData.profitability.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: isMobile ? "12px" : "14px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

const cardStyle = {
  p: 3,
  borderRadius: "20px",
  boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.04)",
  border: "1px solid rgba(0, 0, 0, 0.05)",
  bgcolor: "#ffffff",
  display: "flex",
  flexDirection: "column",
  transition: "all 0.3s ease",
  "&:hover": { transform: "translateY(-4px)", boxShadow: "0px 15px 35px rgba(0, 0, 0, 0.08)" },
};
