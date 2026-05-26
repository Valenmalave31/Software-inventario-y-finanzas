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
  Divider,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import api from "../../services/api";

interface SaleModalProps {
  open: boolean;
  onClose: () => void;
}

interface Producto {
  id: number;
  name: string;
  salePrice: number;
  stock: number;
}

export default function SaleModal({ open, onClose }: SaleModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  type SaleField = "producto" | "cantidad" | "descuento" | "metodoPago" | "productos";
  const [errors, setErrors] = useState<Partial<Record<SaleField, string>>>({});
  const [productos, setProductos] = useState<
    { id_producto: number; nombre: string; precio_unitario: number; cantidad: number }[]
  >([]);
  const [catalogo, setCatalogo] = useState<Producto[]>([]);
  const [config, setConfig] = useState<any>(null); 
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | "">("");
  const [cantidad, setCantidad] = useState(1);
  const [descuento, setDescuento] = useState(0);
  const [metodoPago, setMetodoPago] = useState("efectivo");

  // Lógica de Cálculos 
  const subtotal = productos.reduce((acc, p) => acc + p.precio_unitario * p.cantidad, 0);
  const tasaIva = config ? Number(config.impuesto) / 100 : 0;
  const valorIva = subtotal * tasaIva;
  const total = subtotal + valorIva - descuento;

  // Filtrar métodos de pago 
  const metodosActivos = useMemo(() => {
    return config?.metodosPago?.filter((m: any) => m.activo) || [];
  }, [config]);

  const normalizeProduct = (raw: any): Producto => ({
    id: Number(raw?.id ?? raw?.id_producto ?? 0),
    name: String(raw?.name ?? raw?.nombre_producto ?? ""),
    salePrice: Number(raw?.salePrice ?? raw?.precio_venta ?? 0),
    stock: Number(raw?.stock ?? raw?.cantidad_disponible ?? 0),
  });

  useEffect(() => {
    if (open) {
      setErrors({});
      // Cargar productos
      api.get("/products")
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : [];
          setCatalogo(data.map(normalizeProduct).filter((p) => p.id > 0 && p.name));
        })
        .catch((err) => console.error("Error cargando productos:", err));

      // Cargar configuración para sincronizar IVA y Métodos
      api.get("/settings")
        .then((res) => {
          setConfig(res.data);
          const primerMetodo = res.data.metodosPago?.find((m: any) => m.activo);
          if (primerMetodo) setMetodoPago(primerMetodo.nombre);
        })
        .catch((err) => console.error("Error cargando configuración:", err));
    }
  }, [open]);

  const fieldMessage = "Este campo se debe llenar";

  const validateField = (value: any, field: SaleField): string => {
    if (field === "cantidad") {
      return typeof value === "number" && value > 0 ? "" : fieldMessage;
    }
    if (field === "descuento") {
      return typeof value === "number" && value >= 0 ? "" : fieldMessage;
    }
    if (field === "productos") {
      return Array.isArray(value) && value.length > 0 ? "" : "Debes agregar al menos un producto";
    }
    return !String(value).trim() && value !== 0 ? fieldMessage : "";
  };

  const validateSale = () => {
    const newErrors: Partial<Record<SaleField, string>> = {};
    
    newErrors.productos = validateField(productos, "productos");
    newErrors.descuento = validateField(descuento, "descuento");
    newErrors.metodoPago = validateField(metodoPago, "metodoPago");
    
    const errorsToSet = Object.fromEntries(
      Object.entries(newErrors).filter(([_, msg]) => msg !== "")
    ) as Partial<Record<SaleField, string>>;
    
    setErrors(errorsToSet);
    return Object.keys(errorsToSet).length === 0;
  };

  const agregarProducto = () => {
    if (!productoSeleccionado) {
      setErrors((prev) => ({
        ...prev,
        producto: fieldMessage,
      }));
      return;
    }
    if (cantidad <= 0) {
      setErrors((prev) => ({
        ...prev,
        cantidad: fieldMessage,
      }));
      return;
    }
    
    const prod = catalogo.find((p) => p.id === productoSeleccionado);
    if (!prod) return;

    if (prod.stock < cantidad) {
      setErrors((prev) => ({
        ...prev,
        cantidad: `Stock insuficiente. Disponible: ${prod.stock}`,
      }));
      return;
    }

    setProductos([
      ...productos,
      {
        id_producto: prod.id,
        nombre: prod.name,
        precio_unitario: prod.salePrice,
        cantidad,
      },
    ]);
    setProductoSeleccionado("");
    setCantidad(1);
    setErrors((prev) => {
      const { producto, cantidad, ...rest } = prev;
      return rest;
    });
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const registrarVenta = async () => {
    if (!validateSale()) {
      return;
    }

    const productosPayload = productos.map((p) => ({
      id_producto: Number(p.id_producto),
      cantidad: Number(p.cantidad),
      precio_unitario: Number(p.precio_unitario),
    }));

    const tieneProductoInvalido = productosPayload.some(
      (p) =>
        !Number.isFinite(p.id_producto) ||
        !Number.isFinite(p.cantidad) ||
        !Number.isFinite(p.precio_unitario) ||
        p.id_producto <= 0 ||
        p.cantidad <= 0 ||
        p.precio_unitario < 0,
    );

    if (productosPayload.length === 0 || tieneProductoInvalido) {
      console.error("Datos de venta invalidos. Revisa productos, cantidad y precio.");
      return;
    }

    const descuentoTotal = Number(descuento);
    if (!Number.isFinite(descuentoTotal) || descuentoTotal < 0) {
      console.error("El descuento debe ser un numero mayor o igual a 0.");
      return;
    }

    try {
      const payload = {
        productos: productosPayload,
        descuento_total: descuentoTotal,
        metodo_pago: metodoPago,
      };

      const res = await api.post("/sales", payload);
      console.log("Venta registrada:", res.data);
      
      // Limpieza de estado antes de cerrar
    setProductos([]);
      setDescuento(0);
      onClose(); // Esto debería cerrar la ventana y refrescar la tabla
    } catch (error: any) {
      // SI LA VENTANA NO SE CIERRA, ES PORQUE CAE AQUÍ
      const errorMsg = error.response?.data?.message || "Error desconocido";
      alert("No se pudo cerrar la venta: " + errorMsg); 
      console.error("Detalle del error:", error.response?.data);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.5 }, fontSize: { xs: "1.05rem", sm: "1.25rem" } }}>Nueva Venta</DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Seleccionar producto"
              required
              value={productoSeleccionado}
              onChange={(e) => {
                setProductoSeleccionado(Number(e.target.value));
                if (errors.producto) {
                  setErrors((prev) => {
                    const { producto, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              error={Boolean(errors.producto)}
              helperText={errors.producto}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 350,
                      overflowY: "auto",
                    },
                  },
                },
              }}
            >
              <MenuItem value="">Seleccionar producto</MenuItem>
              {catalogo.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} (${p.salePrice})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Cantidad"
              type="number"
              required
              value={cantidad}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCantidad(val);
                if (errors.cantidad) {
                  setErrors((prev) => {
                    const { cantidad, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              error={Boolean(errors.cantidad)}
              helperText={errors.cantidad}
              sx={{ width: { xs: "100%", sm: "100px" } }}
            />
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: { xs: "100%", sm: "100px" }, height: "36px" }}
              onClick={agregarProducto}
            >
              Agregar
            </Button>
          </Box>

          <Divider />

          <Box sx={{ border: "1px solid #ddd", borderRadius: 2, p: { xs: 1.5, sm: 2 } }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Productos agregados
            </Typography>
            {productos.length === 0 ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  No hay productos agregados
                </Typography>
                {errors.productos && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 1 }}>
                    {errors.productos}
                  </Typography>
                )}
              </>
            ) : (
              productos.map((p, i) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                  <Typography>{p.nombre} x{p.cantidad}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography>${(p.precio_unitario * p.cantidad).toLocaleString()}</Typography>
                    <IconButton size="small" color="error" onClick={() => eliminarProducto(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <Divider />

          <TextField
            fullWidth
            size="small"
            label="Descuento"
            required
            type="number"
            value={descuento}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDescuento(val);
              if (errors.descuento) {
                setErrors((prev) => {
                  const { descuento, ...rest } = prev;
                  return rest;
                });
              }
            }}
            error={Boolean(errors.descuento)}
            helperText={errors.descuento}
          />

          <Divider />

          {/* METODOS DE PAGO DINÁMICOS */}
          <TextField
            select
            fullWidth
            size="small"
            label="Método de Pago"
            required
            value={metodoPago}
            onChange={(e) => {
              setMetodoPago(e.target.value);
              if (errors.metodoPago) {
                setErrors((prev) => {
                  const { metodoPago, ...rest } = prev;
                  return rest;
                });
              }
            }}
            error={Boolean(errors.metodoPago)}
            helperText={errors.metodoPago}
          >
            {metodosActivos.length > 0 ? (
              metodosActivos.map((m: any) => (
                <MenuItem key={m.nombre} value={m.nombre.toLowerCase()}>
                  {m.nombre}
                </MenuItem>
              ))
            ) : (
              <MenuItem value="efectivo">Efectivo (Defecto)</MenuItem>
            )}
          </TextField>

          <Divider />

          {/* RESUMEN DE TOTALES (Actualizado con IVA) */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1">Subtotal</Typography>
              <Typography variant="body1">${subtotal.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1">IVA ({config?.impuesto || 0}%)</Typography>
              <Typography variant="body1">${valorIva.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1">Descuento</Typography>
              <Typography variant="body1" color="error">-${descuento.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">${total.toLocaleString()}</Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 }, flexDirection: { xs: "column-reverse", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1.5 }}>
        <Button onClick={onClose} fullWidth={fullScreen}>Cancelar</Button>
        <Button variant="contained" onClick={registrarVenta} fullWidth={fullScreen}>
          Registrar Venta
        </Button>
      </DialogActions>
    </Dialog>
  );
}
