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
  Divider,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { 
  AddShoppingCart as AddIcon, 
  Inventory as InventoryIcon, 
  AttachMoney as MoneyIcon, 
  Rule as RuleIcon 
} from '@mui/icons-material';
import { useState, useEffect } from "react";
import api from "../../services/api"; 

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, mt: 1 }}>
    {icon}
    <Typography variant="overline" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 1 }}>
      {title}
    </Typography>
  </Stack>
);

export default function ProductModal({ open, onClose, onSaved }: ProductModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  type ProductField = "name" | "categoryId" | "purchasePrice" | "salePrice" | "stock" | "minStock" | "status";
  const initialState = {
    name: "",
    categoryId: "",
    purchasePrice: "",
    salePrice: "",
    stock: "",
    minStock: "",
    status: "Activo",
  };

  const [product, setProduct] = useState(initialState);
  const [errors, setErrors] = useState<Partial<Record<ProductField, string>>>({});
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (open) {
      setProduct(initialState);
      setErrors({});
      api.get("/categories")
        .then(res => setCategories(res.data))
        .catch(err => console.error("Error al cargar categorías:", err));
    }
  }, [open]);

  const fieldMessage = "Este campo se debe llenar";

  const validateField = (value: string): string => {
    if (!String(value).trim()) {
      return fieldMessage;
    }
    return "";
  };

  const validateProduct = () => {
    const newErrors: Partial<Record<ProductField, string>> = {};

    (Object.keys(product) as ProductField[]).forEach((field) => {
      const message = validateField(product[field]);
      if (message) newErrors[field] = message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as ProductField;
    setProduct({ ...product, [field]: value });

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(value),
      }));
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const onlyNumbers = value.replace(/\D/g, "");
    const formattedValue = onlyNumbers 
      ? new Intl.NumberFormat('es-CO').format(parseInt(onlyNumbers)) 
      : "";
    const field = name as ProductField;
    setProduct({ ...product, [field]: formattedValue });

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(formattedValue),
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const field = name as ProductField;
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(value),
    }));
  };

  const handleSave = async () => {
    if (!validateProduct()) return;

    try {
      const cleanPurchasePrice = parseInt(product.purchasePrice.replace(/\./g, "")) || 0;
      const cleanSalePrice = parseInt(product.salePrice.replace(/\./g, "")) || 0;
      const cleanStock = Number(product.stock) || 0;
      const cleanMinStock = Number(product.minStock) || 0;

      await api.post("/products", {
        name: product.name,
        categoryId: Number(product.categoryId) || 0,
        purchasePrice: cleanPurchasePrice, 
        salePrice: cleanSalePrice,
        stock: cleanStock,
        minStock: cleanMinStock,
        status: product.status,
      });

      onClose();
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Error al crear producto:", err.response?.data || err.message);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: { xs: 2, sm: 2.5 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ bgcolor: 'primary.light', p: 1, borderRadius: 2, display: 'flex' }}>
          <AddIcon sx={{ color: 'primary.main' }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>Nuevo Producto</Typography>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Nombre del Producto"
            required
            name="name"
            value={product.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. Resma de papel"
            error={Boolean(errors.name)}
            helperText={errors.name}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          <TextField
            select
            fullWidth
            label="Categoría"
            required
            name="categoryId"
            value={product.categoryId}
            onChange={handleChange}
            onBlur={handleBlur}
            error={Boolean(errors.categoryId)}
            helperText={errors.categoryId}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {categories.map(cat => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </TextField>

          <Box>
            <SectionHeader icon={<MoneyIcon fontSize="small" color="success" />} title="Precios (COP)" />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Precio Compra"
                required
                name="purchasePrice"
                type="text" 
                value={product.purchasePrice}
                onChange={handlePriceChange}
                onBlur={handleBlur}
                placeholder="0"
                error={Boolean(errors.purchasePrice)}
                helperText={errors.purchasePrice}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Precio Venta"
                required
                name="salePrice"
                type="text"
                value={product.salePrice}
                onChange={handlePriceChange}
                onBlur={handleBlur}
                placeholder="0"
                error={Boolean(errors.salePrice)}
                helperText={errors.salePrice}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </Box>

          <Box>
            <SectionHeader icon={<InventoryIcon fontSize="small" color="info" />} title="Inventario" />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Stock Inicial"
                required
                name="stock"
                type="number"
                value={product.stock}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(errors.stock)}
                helperText={errors.stock}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Stock Mínimo"
                required
                name="minStock"
                type="number"
                value={product.minStock}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(errors.minStock)}
                helperText={errors.minStock}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          </Box>

          <Box>
            <SectionHeader icon={<RuleIcon fontSize="small" color="action" />} title="Gestión" />
            <TextField
              select
              fullWidth
              label="Estado Inicial"
              required
              name="status"
              value={product.status}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(errors.status)}
              helperText={errors.status}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="Activo">Activo</MenuItem>
              <MenuItem value="Inactivo">Inactivo</MenuItem>
              <MenuItem value="Agotado">Agotado</MenuItem>
            </TextField>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions
        sx={{
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 3 },
          bgcolor: '#f9fafb',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Button onClick={onClose} variant="text" color="inherit" fullWidth={fullScreen}>
          Cancelar
        </Button>
        <Button 
          type="button"
          variant="contained" 
          onClick={handleSave} 
          fullWidth={fullScreen}
          sx={{ borderRadius: 2, px: 4, fontWeight: 700, textTransform: 'none' }}
        >
          Guardar Producto
        </Button>
      </DialogActions>
    </Dialog>
  );
}
