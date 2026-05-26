import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import { useState } from "react";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import SpeedIcon from '@mui/icons-material/Speed'; // Icono para promedio/velocidad
import api from "../../services/api";

interface TargetModalProps {
  open: boolean;
  onClose: () => void;
}

const TIPOS_META = [
  { value: "SUM_VENTAS", label: "Ventas Totales (Suma acumulada)", icon: <TrendingUpIcon fontSize="small" color="primary" /> },
  { value: "AVG_VENTAS", label: "Promedio de Venta Diaria", icon: <SpeedIcon fontSize="small" color="secondary" /> },
  { value: "REDUCE_GASTOS", label: "Límite de Gastos (Egresos)", icon: <InsertChartOutlinedIcon fontSize="small" color="error" /> },
  { value: "SUM_INGRESOS", label: "Ahorro / Otros (Manual)", icon: <SavingsOutlinedIcon fontSize="small" color="success" /> },
];

export default function TargetModal({ open, onClose }: TargetModalProps) {
  const [nombre, setNombre] = useState("");
  const [objetivo, setObjetivo] = useState(0);
  const [tipoCalculo, setTipoCalculo] = useState("SUM_VENTAS");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const crearMeta = async () => {
    if (!nombre.trim()) {
      setError("El nombre de la meta es obligatorio");
      return;
    }

    if (objetivo <= 0) {
      setError("El monto objetivo debe ser mayor a 0");
      return;
    }

    if (!fechaInicio || !fechaLimite) {
      setError("Debes seleccionar fecha de inicio y fecha limite");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await api.post("/targets", {
        name: nombre.trim(),
        targetAmount: objetivo,
        calculationType: tipoCalculo,
        startDate: fechaInicio,
        endDate: fechaLimite,
      });

      // Ensure newly created goal is not stored as hidden in localStorage
      try {
        const createdId = res?.data?.id;
        const storageKey = 'planning.hiddenGoalIds';
        if (createdId) {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed: number[] = JSON.parse(stored);
            const filtered = parsed.filter((id) => Number(id) !== Number(createdId));
            localStorage.setItem(storageKey, JSON.stringify(filtered));
          }
        }
      } catch (e) {
        // ignore localStorage errors
      }

      setNombre("");
      setObjetivo(0);
      setTipoCalculo("SUM_VENTAS");
      setFechaInicio("");
      setFechaLimite("");
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || "No se pudo guardar la meta";
      setError(Array.isArray(message) ? message.join(", ") : String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3, pb: 2 }}>
        <FlagOutlinedIcon color="primary" />
        <Typography variant="h6" fontWeight="600">Nueva Meta Financiera</Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          <TextField
            fullWidth
            label="Nombre de la meta"
            placeholder="Ej: Promedio diario Marzo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={saving}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label="Tipo de Meta"
              value={tipoCalculo}
              onChange={(e) => setTipoCalculo(e.target.value)}
              disabled={saving}
              sx={{ flex: 2 }}
            >
              {TIPOS_META.map((option) => (
                <MenuItem key={option.value} value={option.value} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {option.icon}
                  <Typography variant="body2">{option.label}</Typography>
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Monto Objetivo"
              type="number"
              InputProps={{ startAdornment: <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>$</Typography> }}
              value={objetivo}
              onChange={(e) => setObjetivo(Number(e.target.value))}
              disabled={saving}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '8px', border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, fontWeight: 'bold' }}>
              <DateRangeOutlinedIcon sx={{ fontSize: 16 }} /> PERÍODO DE VIGENCIA
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                disabled={saving}
              />
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                disabled={saving}
              />
            </Stack>
          </Box>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none' }} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={crearMeta} sx={{ textTransform: 'none', px: 4, borderRadius: '8px', boxShadow: 'none' }} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Meta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}