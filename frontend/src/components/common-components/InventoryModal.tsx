import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box,
  Typography,
  IconButton,
  Alert,
} from "@mui/material";
import { Close as CloseIcon, ArrowUpward as ArrowUpwardIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import api from "../../services/api";
import axios from "axios";

interface InventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void; // 👈 callback opcional para refrescar la tabla
}

export default function InventoryModal({ open, onClose, onSaved }: InventoryModalProps) {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  type InventoryField = "productId" | "quantity" | "reason";
  const [errors, setErrors] = useState<Partial<Record<InventoryField, string>>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (open) {
      setErrorMessage("");
      setErrors({});
      api.get("/products")
        .then(res => setProducts(res.data))
        .catch(err => console.error("Error al cargar productos:", err));
    }
  }, [open]);

  const fieldMessage = "Este campo se debe llenar";

  const validateField = (value: string | number, field: InventoryField): string => {
    if (field === "quantity") {
      return typeof value === "number" && value > 0 ? "" : fieldMessage;
    }
    return !String(value).trim() ? fieldMessage : "";
  };

  const validateInventory = () => {
    const newErrors: Partial<Record<InventoryField, string>> = {};
    
    newErrors.productId = validateField(productId, "productId");
    newErrors.quantity = validateField(quantity, "quantity");
    newErrors.reason = validateField(reason, "reason");
    
    const errorsToSet = Object.fromEntries(
      Object.entries(newErrors).filter(([_, msg]) => msg !== "")
    ) as Partial<Record<InventoryField, string>>;
    
    setErrors(errorsToSet);
    return Object.keys(errorsToSet).length === 0;
  };

  const handleSave = async () => {
    if (!validateInventory()) {
      return;
    }

    setErrorMessage("");

    const payload = {
      tipo_mov: "Entrada",              // 👈 fijo en Entrada
      cantidad: quantity,
      razon: reason,
      id_producto: Number(productId),
    };

    console.log("Payload enviado al backend:", payload); // 👈 ver en consola

    try {
      await api.post("/inventory/movements", payload);

      if (onSaved) onSaved();
      setErrorMessage("");
      onClose();
    } catch (error) {
      console.error("Error al guardar movimiento:", error);

      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setErrorMessage("Tu sesión expiró. Inicia sesión nuevamente.");
        return;
      }

      setErrorMessage("No se pudo guardar el movimiento. Intenta de nuevo.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Entrada de Inventario</Typography>
          <Typography variant="body2" color="text.secondary">Registra la entrada de productos al inventario</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "#f0fdf4", color: "#166534", p: 2, borderRadius: 2, border: "1px solid #bbf7d0" }}>
            <ArrowUpwardIcon fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              Las salidas se registran automáticamente al realizar ventas.
            </Typography>
          </Box>

          <TextField
            select
            fullWidth
            label="Producto"
            required
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              if (errors.productId) {
                setErrors((prev) => ({
                  ...prev,
                  productId: validateField(e.target.value, "productId"),
                }));
              }
            }}
            onBlur={() => {
              setErrors((prev) => ({
                ...prev,
                productId: validateField(productId, "productId"),
              }));
            }}
            error={Boolean(errors.productId)}
            helperText={errors.productId}
          >
            <MenuItem value="">Seleccionar producto</MenuItem>
            {products.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Cantidad"
            required
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = Number(e.target.value);
              setQuantity(val);
              if (errors.quantity) {
                setErrors((prev) => ({
                  ...prev,
                  quantity: validateField(val, "quantity"),
                }));
              }
            }}
            onBlur={() => {
              setErrors((prev) => ({
                ...prev,
                quantity: validateField(quantity, "quantity"),
              }));
            }}
            error={Boolean(errors.quantity)}
            helperText={errors.quantity}
          />

          <TextField
            fullWidth
            label="Razón"
            required
            multiline
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errors.reason) {
                setErrors((prev) => ({
                  ...prev,
                  reason: validateField(e.target.value, "reason"),
                }));
              }
            }}
            onBlur={() => {
              setErrors((prev) => ({
                ...prev,
                reason: validateField(reason, "reason"),
              }));
            }}
            error={Boolean(errors.reason)}
            helperText={errors.reason}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: "#2563eb" }}>Guardar</Button>
      </DialogActions>
    </Dialog>
  );
}
