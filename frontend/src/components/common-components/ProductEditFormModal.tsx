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
  IconButton,
} from "@mui/material";
import { Close as CloseIcon, Save as SaveIcon } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import api from "../../services/api";

interface ProductEditFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  productToEdit: any;
}

export default function ProductEditFormModal({
  open,
  onClose,
  onSaved,
  productToEdit,
}: ProductEditFormModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    nombre_producto: "",
    id_categoria: "",
    precio_compra: "",
    precio_venta: "",
    estado_producto: "Activo",
  });

  const [categories, setCategories] = useState<{ id_categoria: number; nombre_categoria: string }[]>([]);

  const formatPrice = (value: string | number) => {
    const stringValue = value?.toString() || "";
    const onlyNumbers = stringValue.replace(/\D/g, "");
    return onlyNumbers ? new Intl.NumberFormat("es-CO").format(parseInt(onlyNumbers)) : "";
  };

  useEffect(() => {
    if (open && productToEdit) {
      api.get("/categories")
        .then((res) => {
          const mapped = res.data.map((c: any) => ({
            id_categoria: c.id,
            nombre_categoria: c.name,
          }));
          setCategories(mapped);
        })
        .catch((err) => console.error("Error cargando categorías:", err));

      setProduct({
        nombre_producto: productToEdit.name || "",
        id_categoria: productToEdit.category?.id || "",
        precio_compra: formatPrice(productToEdit.purchasePrice),
        precio_venta: formatPrice(productToEdit.salePrice),
        estado_producto: productToEdit.status || "Activo",
      });
    }
  }, [open, productToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct({ ...product, [name]: formatPrice(value) });
  };

  const handleSave = async () => {
    if (!productToEdit) return;

    setSaving(true);
    try {
      const cleanData: any = {};

      if (product.nombre_producto && product.nombre_producto !== productToEdit.name) {
        cleanData.name = product.nombre_producto;
      }

      if (product.id_categoria && product.id_categoria !== productToEdit.category?.id) {
        cleanData.categoryId = Number(product.id_categoria);
      }

      if (product.precio_compra) {
        cleanData.purchasePrice = parseInt(product.precio_compra.replace(/\./g, "")) || 0;
      }

      if (product.precio_venta) {
        cleanData.salePrice = parseInt(product.precio_venta.replace(/\./g, "")) || 0;
      }

      if (product.estado_producto && product.estado_producto !== productToEdit.status) {
        cleanData.status = product.estado_producto;
      }

      await api.put(`/products/${productToEdit.id}`, cleanData);

      onClose();
      onSaved();
    } catch (err: any) {
      console.error("Error al actualizar el producto:", err);
    } finally {
      setSaving(false);
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
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: { xs: 2, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.05rem', sm: '1.25rem' } }}>
          Editar Producto
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Nombre del Producto"
            name="nombre_producto"
            value={product.nombre_producto}
            onChange={handleChange}
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <TextField
            select
            fullWidth
            label="Categoría"
            name="id_categoria"
            value={product.id_categoria}
            onChange={handleChange}
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id_categoria} value={cat.id_categoria}>
                {cat.nombre_categoria}
              </MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Precio Compra"
              name="precio_compra"
              value={product.precio_compra}
              onChange={handlePriceChange}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              label="Precio Venta"
              name="precio_venta"
              value={product.precio_venta}
              onChange={handlePriceChange}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
          </Stack>

          <TextField
            select
            fullWidth
            label="Estado"
            name="estado_producto"
            value={product.estado_producto}
            onChange={handleChange}
            variant="outlined"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          >
            <MenuItem value="Activo">Activo</MenuItem>
            <MenuItem value="Inactivo">Inactivo</MenuItem>
            <MenuItem value="Agotado">Agotado</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          pb: { xs: 2, sm: 3 },
          justifyContent: "center",
          gap: 2,
          flexDirection: { xs: "column-reverse", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          fullWidth={fullScreen}
          disabled={saving}
          sx={{ borderRadius: 2, px: 4, textTransform: "none", fontWeight: 700 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          type="button"
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          fullWidth={fullScreen}
          disabled={saving}
          sx={{
            borderRadius: 2,
            px: 4,
            textTransform: "none",
            fontWeight: 700,
            bgcolor: "#1976d2",
          }}
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}