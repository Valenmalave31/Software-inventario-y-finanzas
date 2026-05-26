import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { useState } from "react";
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import api from "../../services/api";

interface BudgetModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIAS_DB = [
  { id: 1, nombre: 'Operativo', color: '#3b82f6' },
  { id: 2, nombre: 'Inventario', color: '#f59e0b' },
  { id: 3, nombre: 'Personal', color: '#10b981' },
  { id: 4, nombre: 'Mantenimiento', color: '#ef4444' },
  { id: 5, nombre: 'Ventas', color: '#a855f7' },
  { id: 6, nombre: 'Emergencias', color: '#6b7280' },
];

const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
];

export default function BudgetModal({ open, onClose }: BudgetModalProps) {
  const [nombre, setNombre] = useState("");
  const [idCatPresup, setIdCatPresup] = useState(1);
  const [monto, setMonto] = useState(0);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const guardarPresupuesto = async () => {
    if (monto <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload: any = {
        allocated_amount: monto,
        month: mes,
        year: ano,
        category_id: idCatPresup,
      };

      const trimmedName = nombre.trim();
      if (trimmedName) {
        payload.name = trimmedName;
      }

      await api.post("/budgets", payload);

      setNombre("");
      setMonto(0);
      onClose();
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "No se pudo guardar el presupuesto";
      setError(Array.isArray(message) ? message.join(", ") : String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3, pb: 2 }}>
        <AccountBalanceWalletOutlinedIcon color="primary" />
        <Typography variant="h6" fontWeight="600">Nuevo Presupuesto</Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          
          <TextField
            fullWidth
            label="Nombre del presupuesto"
            placeholder="Ej: Pago de servicios Marzo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={saving}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              fullWidth
              label="Categoría"
              value={idCatPresup}
              onChange={(e) => setIdCatPresup(Number(e.target.value))}
              disabled={saving}
              sx={{ flex: 1.5 }}
            >
              {CATEGORIAS_DB.map((cat) => (
                <MenuItem key={cat.id} value={cat.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CircleIcon sx={{ color: cat.color, fontSize: 12 }} />
                  {cat.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Monto Asignado"
              type="number"
              InputProps={{ startAdornment: <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>$</Typography> }}
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              disabled={saving}
              sx={{ flex: 1 }}
            />
          </Stack>

          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: '8px', border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, fontWeight: 'bold' }}>
              <DateRangeOutlinedIcon sx={{ fontSize: 16 }} /> PERÍODO DEL PRESUPUESTO
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                select
                fullWidth
                label="Mes"
                size="small"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                disabled={saving}
              >
                {MESES.map((m) => (
                  <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Año"
                type="number"
                size="small"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
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
        <Button variant="contained" onClick={guardarPresupuesto} sx={{ textTransform: 'none', px: 4, borderRadius: '8px', boxShadow: 'none' }} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Presupuesto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}