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
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { 
  ArrowUpward as IncomeIcon, 
  ArrowDownward as ExpenseIcon, 
  DescriptionOutlined as DescIcon, 
  ListAltOutlined as ListIcon, 
  AccountBalanceWalletOutlined as WalletIcon, 
  CalendarMonthOutlined as DateIcon,
  AttachMoney as MoneyIcon,
  AutoGraphOutlined as GoalsIcon,
} from "@mui/icons-material";
import api from "../../services/api";

interface TransaccionModalProps {
  open: boolean;
  onClose: () => void;
  budgets?: any[];
  categories?: any[];
  onSuccess?: () => void;
}

export default function TransaccionModal({ 
  open, 
  onClose, 
  budgets = [], 
  categories = [], 
  onSuccess 
}: TransaccionModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [type, setType] = useState<"1" | "2">("1");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [budgetId, setBudgetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  type FormField = "description" | "categoryId" | "amount" | "date" | "budgetId";
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});

  const menuProps = {
    PaperProps: {
      sx: {
        maxHeight: 250,
        borderRadius: 3,
        "&::-webkit-scrollbar": { width: "5px" },
        "&::-webkit-scrollbar-thumb": { 
          bgcolor: "grey.300", 
          borderRadius: "10px" 
        },
      },
    },
  };

  const handleTypeChange = (_: any, newType: "1" | "2") => {
    if (newType !== null) {
      setType(newType);
      setCategoryId("");
      setBudgetId("");
      setError(null);
      setErrors({});
    }
  };

  const fieldMessage = "Este campo se debe llenar";

  const validateField = (field: FormField, value: any): string => {
    if (field === "amount") {
      return value !== "" && Number(value) > 0 ? "" : fieldMessage;
    }
    return String(value).trim() ? "" : fieldMessage;
  };

  const validateForm = () => {
    const newErrors: Partial<Record<FormField, string>> = {};
    newErrors.description = validateField("description", description);
    newErrors.amount = validateField("amount", amount);
    newErrors.categoryId = validateField("categoryId", categoryId);
    newErrors.date = validateField("date", date);
    if (type === "2") newErrors.budgetId = validateField("budgetId", budgetId);

    const filtered = Object.fromEntries(Object.entries(newErrors).filter(([_, v]) => v)) as Partial<Record<FormField, string>>;
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const isFormValid = description.trim() !== "" && amount !== "" && Number(amount) > 0 && categoryId !== "" && date.trim() !== "" && (type === "2" ? budgetId !== "" : true);

  const filteredCategories = categories.filter(cat => {
    const targetType = type === "1" ? "Ingreso" : "Egreso";
    const isHiddenIncomeCategory = type === "1" && Number(cat.id) === 1;
    return cat.type === targetType && !isHiddenIncomeCategory;
  });

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError(null);

    const payload = {
      concept: description,
      amount: Number(amount),
      date,
      typeId: Number(type),
      categoryId: Number(categoryId),
      budgetId: type === "2" && budgetId !== "" ? Number(budgetId) : null,
    };

    try {
      await api.post("/transactions", payload);

      resetForm();
      if (onSuccess) onSuccess(); 
      onClose();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setCategoryId("");
    setAmount("");
    setBudgetId("");
    setError(null);
    setErrors({});
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      fullWidth 
      maxWidth="xs" 
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 5,
          px: { xs: 0, md: 1 },
          boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, textAlign: "center", pt: { xs: 2.5, md: 4 }, pb: 1, fontSize: { xs: "1.2rem", md: "1.5rem" } }}>
        Nuevo Movimiento
      </DialogTitle>
      
      <DialogContent sx={{ px: { xs: 2, md: 2 } }}>
        <Stack spacing={2.5} sx={{ mt: 2 }}>

          {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={handleTypeChange}
            fullWidth
            sx={{
              bgcolor: "grey.100", p: 0.6, borderRadius: 4,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: 3.5,
                fontWeight: 700,
                color: "text.secondary",
                fontSize: { xs: "0.78rem", md: "0.875rem" },
                py: { xs: 0.85, md: 1 },
              },
              "& .Mui-selected": {
                bgcolor: "white !important",
                color: type === "1" ? "success.main" : "error.main",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }
            }}
          >
            <ToggleButton value="1" disabled={loading}>
              <IncomeIcon sx={{ mr: 1, fontSize: { xs: 18, md: 20 } }} /> Ingreso
            </ToggleButton>
            <ToggleButton value="2" disabled={loading}>
              <ExpenseIcon sx={{ mr: 1, fontSize: { xs: 18, md: 20 } }} /> Egreso
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            fullWidth
            label="Descripción"
            placeholder="¿En qué consistió?"
            value={description}
            required
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((p) => ({ ...p, description: validateField("description", e.target.value) }));
            }}
            onBlur={() => setErrors((p) => ({ ...p, description: validateField("description", description) }))}
            disabled={loading}
            InputProps={{ startAdornment: <InputAdornment position="start"><DescIcon sx={{ opacity: 0.6 }} /></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
            error={Boolean(errors.description)}
            helperText={errors.description}
          />

          <TextField
            select
            fullWidth
            label="Categoría"
            value={categoryId}
            required
            onChange={(e) => {
              setCategoryId(e.target.value);
              if (errors.categoryId) setErrors((p) => ({ ...p, categoryId: validateField("categoryId", e.target.value) }));
            }}
            onBlur={() => setErrors((p) => ({ ...p, categoryId: validateField("categoryId", categoryId) }))}
            disabled={loading}
            SelectProps={{ MenuProps: menuProps }}
            InputProps={{ startAdornment: <InputAdornment position="start"><ListIcon sx={{ opacity: 0.6 }} /></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
            error={Boolean(errors.categoryId)}
            helperText={errors.categoryId}
          >
            {filteredCategories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>

          {type === "2" && (
            <TextField
              select
              fullWidth
              label="Presupuesto Relacionado"
              value={budgetId}
              required
              onChange={(e) => {
                setBudgetId(e.target.value);
                if (errors.budgetId) setErrors((p) => ({ ...p, budgetId: validateField("budgetId", e.target.value) }));
              }}
              onBlur={() => setErrors((p) => ({ ...p, budgetId: validateField("budgetId", budgetId) }))}
              disabled={loading}
              SelectProps={{ MenuProps: menuProps }}
              InputProps={{ startAdornment: <InputAdornment position="start"><WalletIcon sx={{ opacity: 0.6 }} /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
              helperText={errors.budgetId ?? "Vincular ayuda a controlar tus gastos planeados"}
            >
              <MenuItem value=""><em>-- Sin presupuesto --</em></MenuItem>
              {budgets.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {type === "1" && (
            <Box sx={{ bgcolor: "success.50", color: "success.700", p: 1.5, borderRadius: 3, display: "flex", alignItems: "center", gap: 1.5, border: "1px solid", borderColor: "success.200" }}>
              <GoalsIcon sx={{ fontSize: 20 }} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Este ingreso sumará automáticamente al progreso de tus metas actuales.
              </Typography>
            </Box>
          )}

          <Divider />

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Monto"
              type="number"
              value={amount}
              required
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                setAmount(val);
                if (errors.amount) setErrors((p) => ({ ...p, amount: validateField("amount", val) }));
              }}
              onBlur={() => setErrors((p) => ({ ...p, amount: validateField("amount", amount) }))}
              disabled={loading}
              InputProps={{ 
                startAdornment: <InputAdornment position="start"><MoneyIcon sx={{ color: type === "1" ? "success.main" : "error.main" }} /></InputAdornment> 
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4, fontWeight: 800, fontSize: { xs: "1rem", md: "1.2rem" } } }}
              error={Boolean(errors.amount)}
              helperText={errors.amount}
            />
            
            <TextField
              fullWidth
              label="Fecha"
              type="date"
              value={date}
              required
              onChange={(e) => {
                setDate(e.target.value);
                if (errors.date) setErrors((p) => ({ ...p, date: validateField("date", e.target.value) }));
              }}
              onBlur={() => setErrors((p) => ({ ...p, date: validateField("date", date) }))}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
              InputProps={{ startAdornment: <InputAdornment position="start"><DateIcon sx={{ opacity: 0.6 }} /></InputAdornment> }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
              error={Boolean(errors.date)}
              helperText={errors.date}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: { xs: 2, md: 4 }, pt: { xs: 1.5, md: 2 }, flexDirection: { xs: "column-reverse", md: "row" }, alignItems: { xs: "stretch", md: "center" }, gap: { xs: 1.25, md: 0 } }}>
        <Button onClick={onClose} disabled={loading} fullWidth={fullScreen} sx={{ color: "text.secondary", fontWeight: 700 }}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          fullWidth
          disabled={!isFormValid || loading}
          sx={{ 
            borderRadius: 4, py: 1.5, fontWeight: 800, textTransform: "none", fontSize: "1rem",
            bgcolor: type === "1" ? "success.main" : "error.main",
            "&:hover": { bgcolor: type === "1" ? "success.dark" : "error.dark" }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Confirmar Transacción"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}