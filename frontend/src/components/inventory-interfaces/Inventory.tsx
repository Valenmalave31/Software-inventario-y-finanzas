import { useEffect, useState } from "react";
import { Box, Typography, Paper, Button } from "@mui/material";
import SearchBar from "../common-components/SearchBar";
import FilterBar from "../common-components/StatusFilter";
import DateRangeFilter from "../common-components/DateFilter";
import ModalButton from "../common-components/ModalButton";
import ExportPDF from "../common-components/ExportPDF";
import DataTable from "../common-components/Table";
import MovementModal from "../common-components/InventoryModal";
import { Inventory as InventoryIcon, Input, Output, CompareArrows } from "@mui/icons-material";
import api from "../../services/api";

function MetricCard({
  icon,
  value,
  label,
  color = "white",
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: color,
        color: "black",
        flex: 1,
        minWidth: { xs: 0, md: 200 },
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.5, md: 2 },
      }}
    >
      <Box sx={{ fontSize: { xs: 30, md: 40 } }}>{icon}</Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "1rem", md: "1.25rem" } }}>
          {value}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: { xs: "0.72rem", md: "0.875rem" } }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Inventory() {
  const [openModal, setOpenModal] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<{ search?: string; status?: string; from?: string; to?: string }>({});

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const columns = [
    { field: "product", headerName: "PRODUCTO" },
    { field: "type", headerName: "TIPO" },
    { field: "quantity", headerName: "CANTIDAD" },
    { field: "previousStock", headerName: "STOCK ANTERIOR" },
    { field: "newStock", headerName: "STOCK NUEVO" },
    { field: "reason", headerName: "RAZÓN" },
    { field: "date", headerName: "FECHA" },
    { field: "user", headerName: "USUARIO" },
  ];

  const formatApiDate = (value: unknown) => {
    if (!value) return "—";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString();
    }
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString();
  };

  const fetchMovements = async (params: any = {}) => {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`/inventory/movements?${query}`);
      const sorted = [...res.data].sort((a: any, b: any) => (b.id_mov ?? 0) - (a.id_mov ?? 0));
      const formatted = sorted.map((m: any) => ({
        id: m.id_mov,
        product: m.producto?.name || "—",
        type: m.tipo_mov,
        quantity: m.cantidad,
        previousStock: m.stock_antes,
        newStock: m.stock_despues,
        reason: m.razon,
        date: formatApiDate(m.fecha),
        user: m.usuario?.nombre || "—",
      }));
      setRows(formatted);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      setRows([]);
    }
  };

  useEffect(() => {
    fetchMovements(filters);
  }, [filters]);

  const getEmptyMessage = () => {
    if (filters.search) return `No se encontró el producto o usuario: "${filters.search}"`;
    if (filters.status) return `No hay movimientos de tipo ${filters.status}`;
    if (filters.from || filters.to) return "No hay movimientos en el rango de fechas seleccionado";
    return "No hay movimientos registrados";
  };

  return (
    <Box id="inventory-export-root" sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
      <Box sx={{ mt: { xs: 1, md: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", md: "center" },
            mb: 1,
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "1.6rem", md: "2.125rem" } }}>
            Inventario
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", width: { xs: "100%", md: "auto" }, justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <ExportPDF fileName="inventario" targetSelector="#inventory-export-root" />
            <ModalButton label="+ Nuevo Movimiento" onClick={handleOpen} sx={{ mb: 0 }} />
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 3, opacity: 0.7, fontSize: { xs: "0.85rem", md: "1rem" } }}>
          Administra los movimientos de tu inventario
        </Typography>

        <Box
          sx={{
            display: { xs: "grid", md: "flex" },
            gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
            mb: 4,
            flexWrap: "wrap",
          }}
        >
          <MetricCard icon={<InventoryIcon sx={{ color: "blue" }} />} value={rows.length} label="Total Movimientos" color="#e3f2fd" />
          <MetricCard icon={<Input sx={{ color: "green" }} />} value={rows.filter(r => r.type === "Entrada").length} label="Entradas" color="#e8f5e9" />
          <MetricCard icon={<Output sx={{ color: "red" }} />} value={rows.filter(r => r.type === "Salida").length} label="Salidas" color="#ffebee" />
          <MetricCard icon={<CompareArrows sx={{ color: "purple" }} />} value={rows.length} label="Movimientos Totales" color="#f3e5f5" />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "1rem", md: "1.25rem" } }}>
          Historial de Movimientos
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: { xs: "stretch", md: "center" }, flexDirection: { xs: "column", md: "row" } }}>
          <Box sx={{ flexGrow: 1, width: "100%" }}>
            <SearchBar placeholder="Buscar por producto o usuario..." onSearch={(value) => setFilters({ ...filters, search: value })} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", md: "auto" }, alignItems: "stretch" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <FilterBar options={["Entrada", "Salida"]} onChange={(value) => setFilters({ ...filters, status: value })} />
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowDateFilter(!showDateFilter)}
              sx={{ flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
            >
              Filtrar por fecha
            </Button>
          </Box>
        </Box>

        {showDateFilter && (
          <Box sx={{ mb: 3 }}>
            <DateRangeFilter onChange={(start, end) => setFilters({ ...filters, from: start, to: end })} sx={{ "& .MuiInputBase-root": { height: 32 } }} />
          </Box>
        )}

        {rows.length === 0 ? (
          <Typography variant="body1" sx={{ mt: 2, opacity: 0.7, textAlign: "center", fontSize: { xs: "0.9rem", md: "1rem" } }}>
            {getEmptyMessage()}
          </Typography>
        ) : (
          <DataTable columns={columns} rows={rows} actions={false} />
        )}

        <MovementModal open={openModal} onClose={() => { handleClose(); fetchMovements(filters); }} />
      </Box>
    </Box>
  );
}
