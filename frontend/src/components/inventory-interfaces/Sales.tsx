import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import ModalButton from "../common-components/ModalButton";
import SearchBar from "../common-components/SearchBar";
import DateRangeFilter from "../common-components/DateFilter"; 
import DataTable from "../common-components/Table"; 
import SalesModal from "../common-components/SaleModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AttachMoney, TrendingUp, Receipt, TrendingDown } from "@mui/icons-material";
import api from "../../services/api";

function MetricCard({
  title,
  value,
  growth,
  icon,
}: {
  title: string;
  value: string;
  growth: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: 2,
        flex: 1,
        minWidth: { xs: 0, md: 200 },
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, md: 2 },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{ fontSize: { xs: 26, md: 32 } }}>{icon}</Box>
        <Typography
          variant="caption"
          sx={{
            color: growth.startsWith("-") ? "red" : "green",
            fontWeight: "bold",
            fontSize: { xs: "0.62rem", md: "0.75rem" },
          }}
        >
          {growth}
        </Typography>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "0.95rem", md: "1.25rem" } }}>
          {value}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: { xs: "0.7rem", md: "0.875rem" } }}>
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

function ProductCard({
  product,
  units,
  amount,
  growth,
}: {
  product: string;
  units: number;
  amount: string;
  growth: string;
}) {
  return (
    <Paper elevation={2} sx={{ p: { xs: 1.25, md: 1.5 }, borderRadius: 2, bgcolor: "#f1f1f1d6", mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: { xs: "0.85rem", md: "1rem" } }}>
          {product}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: { xs: "0.85rem", md: "1rem" } }}>
          {amount}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>Unidades: {units}</Typography>
        <Typography
          variant="body2"
          sx={{ color: growth.startsWith("-") ? "red" : "green", fontWeight: "bold", fontSize: { xs: "0.75rem", md: "0.875rem" } }}
        >
          {growth}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Sales() {
  const [openModal, setOpenModal] = useState(false);
  const [sales, setSales] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ search?: string; from?: string; to?: string }>({});

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => {
    setOpenModal(false);
    fetchSales(filters);
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const formatCurrency = (value: number) => currencyFormatter.format(Number(value) || 0);
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
  const toLocalYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };
  const formatApiDate = (value: unknown) => {
    const parsed = parseApiDate(value);
    return parsed ? parsed.toLocaleDateString() : "—";
  };

  const fetchSales = async (params: { search?: string; from?: string; to?: string } = {}) => {
    try {
      const res = await api.get("/sales", { params });
      const data = Array.isArray(res.data) ? res.data : [];
      setSales(data);
    } catch (error) {
      console.error("Error cargando ventas:", error);
      setSales([]);
    }
  };

  useEffect(() => {
    fetchSales(filters);
  }, [filters]);

  const filteredSales = useMemo(() => {
    const fromDate = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
    const toDate = filters.to ? new Date(`${filters.to}T23:59:59`) : null;

    return sales.filter((sale) => {
      if (!fromDate && !toDate) return true;
      if (!sale.date) return false;

      const saleDate = parseApiDate(sale.date);
      if (!saleDate) return false;
      if (fromDate && saleDate < fromDate) return false;
      if (toDate && saleDate > toDate) return false;
      return true;
    });
  }, [sales, filters.from, filters.to]);

  const rows = useMemo(() => {
    return filteredSales.map((sale) => ({
      id: sale.id,
      products:
        Array.isArray(sale.details) && sale.details.length > 0
          ? sale.details
              .map((d: any) => `${d.product?.name || "Producto"} x${toNumber(d.quantity)}`)
              .join(", ")
          : "—",
      subtotal: formatCurrency(toNumber(sale.subtotal)),
      discount: toNumber(sale.discount) > 0 ? `-${formatCurrency(toNumber(sale.discount))}` : "-",
      total: formatCurrency(toNumber(sale.total)),
      payment:
        typeof sale.paymentMethod === "string" && sale.paymentMethod.length > 0
          ? sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)
          : "—",
      date: formatApiDate(sale.date),
    }));
  }, [filteredSales, currencyFormatter]);

  const totals = useMemo(() => {
    const now = new Date();
    const today = toLocalYmd(now);
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const ventasHoy = filteredSales
      .filter((s) => String(s.date || "").startsWith(today))
      .reduce((sum, s) => sum + toNumber(s.total), 0);

    const ventasMes = filteredSales
      .filter((s) => String(s.date || "").startsWith(currentMonth))
      .reduce((sum, s) => sum + toNumber(s.total), 0);

    const descuentos = filteredSales.reduce((sum, s) => sum + toNumber(s.discount), 0);
    const ticketPromedio =
      filteredSales.length > 0
        ? filteredSales.reduce((sum, s) => sum + toNumber(s.total), 0) / filteredSales.length
        : 0;

    return { ventasHoy, ventasMes, descuentos, ticketPromedio };
  }, [filteredSales]);

  const salesData = useMemo(() => {
    const dayMap = new Map<string, number>();
    const labels = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

    for (const sale of filteredSales) {
      if (!sale.date) continue;
      const date = parseApiDate(sale.date);
      if (!date) continue;
      const dayLabel = labels[date.getDay()];
      dayMap.set(dayLabel, (dayMap.get(dayLabel) || 0) + toNumber(sale.total));
    }

    return labels.map((day) => ({ day, ventas: dayMap.get(day) || 0 }));
  }, [filteredSales]);

  const products = useMemo(() => {
    const productMap = new Map<string, { units: number; amount: number }>();

    for (const sale of filteredSales) {
      if (!Array.isArray(sale.details)) continue;
      for (const detail of sale.details) {
        const productName = detail.product?.name || "Producto";
        const quantity = toNumber(detail.quantity);
        const subtotal = toNumber(detail.subtotal);
        const current = productMap.get(productName) || { units: 0, amount: 0 };
        current.units += quantity;
        current.amount += subtotal;
        productMap.set(productName, current);
      }
    }

    return Array.from(productMap.entries())
      .map(([product, values]) => ({
        product,
        units: values.units,
        amount: formatCurrency(values.amount),
        growth: "0%",
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [filteredSales, currencyFormatter]);

  const columns = [
    { field: "products", headerName: "PRODUCTOS" },
    { field: "subtotal", headerName: "SUBTOTAL" },
    { field: "discount", headerName: "DESCUENTO" },
    { field: "total", headerName: "TOTAL" },
    { field: "payment", headerName: "PAGO" },
    { field: "date", headerName: "FECHA" },
  ];
    return (
    <Box sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
      <Box sx={{ mt: { xs: 1, md: 0 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            gap: 1,
            flexDirection: "row",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "1.45rem", md: "2.125rem" } }}>
            Ventas
          </Typography>
          <ModalButton
            label="+ Nueva Venta"
            onClick={handleOpen}
            sx={{
              mb: 0,
              whiteSpace: "nowrap",
              fontSize: { xs: "0.72rem", md: "0.875rem" },
              px: { xs: 1.25, md: 2 },
              py: { xs: 0.4, md: 0.75 },
              minHeight: { xs: 30, md: 36 },
            }}
          />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1.25, md: 2 }, mb: 4 }}>
          <MetricCard title="Ventas Hoy" value={formatCurrency(totals.ventasHoy)} growth="0%" icon={<AttachMoney sx={{ color: "green" }} />} />
          <MetricCard title="Ventas del Mes" value={formatCurrency(totals.ventasMes)} growth="0%" icon={<TrendingUp sx={{ color: "blue" }} />} />
          <MetricCard title="Ticket Promedio" value={formatCurrency(totals.ticketPromedio)} growth="0%" icon={<Receipt sx={{ color: "purple" }} />} />
          <MetricCard title="Descuentos" value={formatCurrency(totals.descuentos)} growth="0%" icon={<TrendingDown sx={{ color: "red" }} />} />
        </Box>

        <Box sx={{ display: "flex", gap: 2, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
          <Paper sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>
              Ventas por Día
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="ventas" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Paper sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>
              Productos Más Vendidos
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {products.map((p, i) => (
                <ProductCard key={i} {...p} />
              ))}
              {products.length === 0 && (
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  No hay datos de productos para mostrar.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>

        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>
          Historial de Ventas
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ flexGrow: 1, width: "100%" }}>
            <SearchBar
              placeholder="Buscar por el nombre del producto..."
              onSearch={(value) => setFilters((prev) => ({ ...prev, search: value || undefined }))}
            />
          </Box>
          <Box sx={{ width: { xs: "100%", md: "auto" } }}>
            <DateRangeFilter
              onChange={(start, end) => setFilters((prev) => ({ ...prev, from: start, to: end }))}
              sx={{ "& .MuiInputBase-root": { height: 32 } }}
            />
          </Box>
        </Box>

        {rows.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              border: "1px dashed #c7d2e0",
              bgcolor: "#f8fbff",
              borderRadius: 2,
              py: 4,
              px: 3,
              textAlign: "center",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: "#334155", fontSize: { xs: "0.9rem", md: "1rem" } }}>
              No hay ventas realizadas en este rango de fechas.
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: "#64748b", fontSize: { xs: "0.78rem", md: "0.875rem" } }}>
              Ajusta el filtro de fechas para ver resultados.
            </Typography>
          </Paper>
        ) : (
          <DataTable columns={columns} rows={rows} actions={false} />
        )}

        <SalesModal open={openModal} onClose={handleClose} />
      </Box>
    </Box>
  );
}
