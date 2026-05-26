import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, LinearProgress, Button, Chip, Stack, IconButton, Snackbar, Alert } from "@mui/material";
import { AttachMoney, CreditCard, Balance, Flag, DeleteOutline } from "@mui/icons-material";
import PresupuestoModal from "../common-components/BudgetModal";
import MetaModal from "../common-components/TargetModal";
import StatusFilterButton from "../common-components/StatusFilter";
import DateRangeFilter from "../common-components/DateFilter";
import api from "../../services/api";

interface BudgetItem {
  id: number;
  name: string;
  allocated_amount: number;
  used_amount: number;
  percent: number;
  color?: string;
  exceeded?: number;
}

interface TargetItem {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startDate: string;
  endDate: string;
  status: string;
}

function MetricCard({ icon, value, label, change, color = "white" }: any) {
  return (
    <Paper 
      elevation={0} 
      sx={{ p: { xs: 1.5, md: 2 }, borderRadius: 3, bgcolor: color, border: '1px solid #e0e0e0', flex: 1, minWidth: { xs: 0, md: 220 }, display: "flex", alignItems: "center", gap: { xs: 1.25, md: 2 } }}
    >
      <Box sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, borderRadius: "50%", bgcolor: "white", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "800", lineHeight: 1.2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "600", textTransform: 'uppercase', fontSize: { xs: "0.62rem", md: "0.75rem" } }}>{label}</Typography>
        {change && (
          <Box sx={{ mt: 0.5 }}>
             <Chip label={change} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: "bold", bgcolor: change.startsWith("-") ? "#fee2e2" : "#dcfce7", color: change.startsWith("-") ? "#dc2626" : "#16a34a" }} />
          </Box>
        )}
      </Box>
    </Paper>
  );
}

function BudgetBar({ name, category, spent, total, percent, color, exceeded, onDelete }: any) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, flexDirection: { xs: "column", md: "row" }, gap: { xs: 0.5, md: 0 } }}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: { xs: "0.82rem", md: "0.875rem" } }}>{name}</Typography>
          <Typography variant="caption" color="text.secondary">{category}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, alignSelf: { xs: "flex-end", md: "center" } }}>
          <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: { xs: "0.78rem", md: "0.875rem" } }}>
            {percent}% <Typography component="span" variant="caption" color="text.secondary">utilizado</Typography>
          </Typography>
          <IconButton size="small" color="error" onClick={onDelete} aria-label={`Eliminar presupuesto ${name}`}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={percent > 100 ? 100 : percent} sx={{ height: 10, borderRadius: 5, bgcolor: '#f0f0f0', "& .MuiLinearProgress-bar": { backgroundColor: color } }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">${spent.toLocaleString()} de ${total.toLocaleString()}</Typography>
        {exceeded > 0 && <Typography variant="caption" color="error" fontWeight="bold">Excedido por ${exceeded.toLocaleString()}</Typography>}
      </Box>
    </Box>
  );
}

function GoalCard({ title, target, deadline, progress, percent, status, color, onDelete }: any) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, mb: 2, borderRadius: 3, border: '1px solid #e0e0e0' }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5, flexDirection: { xs: "column", md: "row" }, gap: { xs: 1, md: 0 }, alignItems: { xs: "flex-start", md: "center" } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontSize: { xs: "0.9rem", md: "1rem" } }}>{title}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, alignSelf: { xs: "flex-end", md: "center" } }}>
          <Chip label={status} size="small" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} color={status === "Completada" ? "success" : "warning"} />
          <IconButton size="small" color="error" onClick={onDelete} aria-label={`Eliminar meta ${title}`}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1.25, md: 3 }} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">META</Typography>
          <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}>{target}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">FECHA LÍMITE</Typography>
          <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}>{deadline}</Typography>
        </Box>
      </Stack>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" fontWeight="bold">{percent}%</Typography>
        <Typography variant="caption" color="text.secondary">{progress} logrados</Typography>
      </Box>
      <LinearProgress variant="determinate" value={percent > 100 ? 100 : percent} sx={{ height: 6, borderRadius: 3, "& .MuiLinearProgress-bar": { backgroundColor: color } }} />
    </Paper>
  );
}

export default function PresupuestoMetas() {
  const [openPresupuesto, setOpenPresupuesto] = useState(false);
  const [openMeta, setOpenMeta] = useState(false);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [goals, setGoals] = useState<TargetItem[]>([]);
  const [hiddenBudgetIds, setHiddenBudgetIds] = useState<number[]>([]);
  const [hiddenGoalIds, setHiddenGoalIds] = useState<number[]>([]);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState("Todas");
  const [selectedGoalStatus, setSelectedGoalStatus] = useState("Todas");
  const [goalDateRange, setGoalDateRange] = useState<{ start: string; end: string } | null>(null);
  const [feedback, setFeedback] = useState<{ open: boolean; message: string; severity: "success" | "info" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const budgetStorageKey = "planning.hiddenBudgetIds";
  const goalStorageKey = "planning.hiddenGoalIds";

  const readHiddenIds = (storageKey: string) => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  };

  const persistHiddenIds = (storageKey: string, ids: number[]) => {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  };

  const showFeedback = (message: string, severity: "success" | "info" | "error" = "success") => {
    setFeedback({ open: true, message, severity });
  };

  const loadData = async () => {
    try {
      const response = await api.get("/planning/overview");
      const data = response.data ?? {};

      setBudgets(Array.isArray(data.budgets) ? data.budgets : []);
      setGoals(Array.isArray(data.targets) ? data.targets : []);
    } catch (error) {
      setBudgets([]);
      setGoals([]);
      console.error("Error loading planning overview:", error);
    }
  };

  useEffect(() => {
    setHiddenBudgetIds(readHiddenIds(budgetStorageKey));
    setHiddenGoalIds(readHiddenIds(goalStorageKey));
    loadData();
  }, []);

  const handleDeleteBudget = async (budgetId: number, budgetName: string, hasTransactions: boolean) => {
    if (!window.confirm(`¿Eliminar el presupuesto "${budgetName}"?`)) return;

    try {
      if (hasTransactions) {
        const nextHidden = Array.from(new Set([...hiddenBudgetIds, budgetId]));
        setHiddenBudgetIds(nextHidden);
        persistHiddenIds(budgetStorageKey, nextHidden);
        showFeedback(`El presupuesto "${budgetName}" se ocultó porque tiene movimientos registrados.`, "info");
        return;
      }

      await api.delete(`/budgets/${budgetId}`);
      setBudgets((current) => current.filter((budget) => budget.id !== budgetId));
      showFeedback(`El presupuesto "${budgetName}" se eliminó correctamente.`, "success");
    } catch (error: any) {
      const message = error?.response?.data?.message || 'No se pudo eliminar el presupuesto';
      showFeedback(Array.isArray(message) ? message.join(', ') : String(message), "error");
    }
  };

  const handleDeleteGoal = async (goalId: number, goalName: string, hasProgress: boolean) => {
    if (!window.confirm(`¿Eliminar la meta "${goalName}"?`)) return;

    try {
      if (hasProgress) {
        const nextHidden = Array.from(new Set([...hiddenGoalIds, goalId]));
        setHiddenGoalIds(nextHidden);
        persistHiddenIds(goalStorageKey, nextHidden);
        showFeedback(`La meta "${goalName}" se ocultó porque tiene progreso registrado.`, "info");
        return;
      }

      await api.delete(`/targets/${goalId}`);
      setGoals((current) => current.filter((goal) => goal.id !== goalId));
      showFeedback(`La meta "${goalName}" se eliminó correctamente.`, "success");
    } catch (error: any) {
      const message = error?.response?.data?.message || 'No se pudo eliminar la meta';
      showFeedback(Array.isArray(message) ? message.join(', ') : String(message), "error");
    }
  };

  const budgetCards = useMemo(() => {
    return budgets.map((b) => ({
      id: b.id,
      name: b.name || "Sin nombre",
      category: b.name || "Sin categoría",
      spent: Number(b.used_amount || 0),
      total: Number(b.allocated_amount || 0),
      percent: Number.isFinite(Number(b.percent)) ? Number(b.percent) : 0,
      color: b.color || "#3b82f6",
      exceeded: Number(b.exceeded || 0),
    }));
  }, [budgets]);

  const goalCards = useMemo(() => {
    return goals.map((g) => {
      const current = Number(g.currentAmount || 0);
      const target = Number(g.targetAmount || 0);
      const percent = target > 0 ? Math.round((current / target) * 100) : 0;
      const deadlineDate = g.endDate
        ? new Intl.DateTimeFormat("es-CO", { timeZone: "UTC" }).format(new Date(g.endDate))
        : "-";

      const today = new Date();
      const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
      const endDate = g.endDate ? new Date(`${g.endDate}T00:00:00Z`) : null;
      const normalizedStatus = (g.status || "En progreso").trim().toLowerCase();
      const isExpired = normalizedStatus !== "completada" && !!endDate && endDate < todayDate;
      const visualStatus = isExpired ? "Vencida" : (g.status || "En progreso");

      return {
        id: g.id,
        endDate: g.endDate,
        title: g.name,
        currentAmount: current,
        target: `$${target.toLocaleString()}`,
        deadline: deadlineDate,
        progress: `$${current.toLocaleString()}`,
        percent,
        status: visualStatus,
        color: visualStatus.toLowerCase() === "completada" ? "#16a34a" : visualStatus.toLowerCase() === "vencida" ? "#dc2626" : "#3b82f6",
      };
    });
  }, [goals]);

  const filteredBudgetCards = useMemo(() => {
    if (selectedBudgetCategory === "Ocultados") {
      return budgetCards.filter((item) => hiddenBudgetIds.includes(item.id));
    }

    const visibleBudgets = budgetCards.filter((item) => !hiddenBudgetIds.includes(item.id));
    if (selectedBudgetCategory === "Todas") return visibleBudgets;

    const selected = selectedBudgetCategory.toLowerCase();
    return visibleBudgets.filter(
      (item) => String(item.category || "").toLowerCase().includes(selected),
    );
  }, [budgetCards, hiddenBudgetIds, selectedBudgetCategory]);

  const filteredGoalCards = useMemo(() => {
    let filtered = [...goalCards];

    if (selectedGoalStatus === "Ocultados") {
      filtered = filtered.filter((goal) => hiddenGoalIds.includes(goal.id));
    } else {
      filtered = filtered.filter((goal) => !hiddenGoalIds.includes(goal.id));

      if (selectedGoalStatus !== "Todas") {
        const selected = selectedGoalStatus.toLowerCase();
        filtered = filtered.filter((goal) => String(goal.status || "").toLowerCase() === selected);
      }
    }

    if (goalDateRange?.start && goalDateRange?.end) {
      const start = new Date(`${goalDateRange.start}T00:00:00Z`);
      const end = new Date(`${goalDateRange.end}T23:59:59Z`);
      filtered = filtered.filter((goal) => {
        const goalEnd = goal.endDate ? new Date(`${goal.endDate}T00:00:00Z`) : null;
        if (!goalEnd) return false;
        return goalEnd >= start && goalEnd <= end;
      });
    }

    return filtered;
  }, [goalCards, hiddenGoalIds, selectedGoalStatus, goalDateRange]);

  const totals = useMemo(() => {
    const totalBudget = budgetCards.reduce((sum, b) => sum + b.total, 0);
    const totalSpent = budgetCards.reduce((sum, b) => sum + b.spent, 0);
    const usage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const activeGoals = goals.filter((g) => (g.status || "").toLowerCase() !== "completada").length;

    return {
      totalBudget,
      totalSpent,
      available: totalBudget - totalSpent,
      usage,
      activeGoals,
    };
  }, [budgetCards, goals]);

  const handleBudgetFilter = (cat: string) => setSelectedBudgetCategory(cat);
  const handleGoalFilter = (status: string) => setSelectedGoalStatus(status);
  const handleDateFilter = (start: string, end: string) => setGoalDateRange({ start, end });

  const handleClosePresupuesto = () => {
    setOpenPresupuesto(false);
    loadData();
  };

  const handleCloseMeta = () => {
    setOpenMeta(false);
    loadData();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 4 }} spacing={{ xs: 2, md: 0 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ fontSize: { xs: "1.5rem", md: "2.125rem" } }}>Planificación</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", md: "0.875rem" } }}>Control de presupuestos y objetivos financieros</Typography>
        </Box>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Button variant="contained" onClick={() => setOpenPresupuesto(true)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', width: { xs: "100%", md: "auto" }, fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
            + Presupuesto
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => setOpenMeta(true)} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', width: { xs: "100%", md: "auto" }, fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
            Nueva Meta
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 4, flexWrap: "wrap", gap: 2 }}>
        <MetricCard icon={<AttachMoney sx={{ color: "#16a34a" }} />} value={`$${totals.totalBudget.toLocaleString()}`} label="Presupuesto Total" color="#f0fdf4" />
        <MetricCard icon={<CreditCard sx={{ color: "#dc2626" }} />} value={`$${totals.totalSpent.toLocaleString()}`} label="Gastado" change={`${totals.usage}% usado`} color="#fef2f2" />
        <MetricCard icon={<Balance sx={{ color: "#2563eb" }} />} value={`$${totals.available.toLocaleString()}`} label="Disponible" color="#eff6ff" />
        <MetricCard icon={<Flag sx={{ color: "#9333ea" }} />} value={totals.activeGoals} label="Metas Activas" color="#faf5ff" />
      </Stack>

      <Stack spacing={4}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid #e0e0e0' }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 3 }} gap={2}>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: "0.95rem", md: "1.25rem" } }}>Estado de Presupuestos</Typography>
            <StatusFilterButton 
              options={["Todas", "Operativo", "Inventario", "Personal", "Mantenimiento", "Ocultados"]} 
              onChange={handleBudgetFilter} 
            />
          </Stack>
          {filteredBudgetCards.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hay presupuestos registrados.</Typography>
          ) : (
            filteredBudgetCards.map((item) => (
              <BudgetBar key={item.id} {...item} onDelete={() => handleDeleteBudget(item.id, item.name, item.spent > 0)} />
            ))
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, border: '1px solid #e0e0e0' }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} sx={{ mb: 3 }} flexWrap="wrap" gap={2}>
            <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: "0.95rem", md: "1.25rem" } }}>Metas y Objetivos</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
              <DateRangeFilter onChange={handleDateFilter} />
              <StatusFilterButton 
                options={["Todas", "En progreso", "Completada", "Vencida", "Ocultados"]} 
                onChange={handleGoalFilter} 
              />
            </Stack>
          </Stack>
          {filteredGoalCards.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No hay metas registradas.</Typography>
          ) : (
            filteredGoalCards.map((goal) => (
              <GoalCard key={goal.id} {...goal} onDelete={() => handleDeleteGoal(goal.id, goal.title, goal.currentAmount > 0)} />
            ))
          )}
        </Paper>
      </Stack>

      <PresupuestoModal open={openPresupuesto} onClose={handleClosePresupuesto} />
      <MetaModal open={openMeta} onClose={handleCloseMeta} />

        <Snackbar
          open={feedback.open}
          autoHideDuration={3500}
          onClose={() => setFeedback((current) => ({ ...current, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setFeedback((current) => ({ ...current, open: false }))}
            severity={feedback.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {feedback.message}
          </Alert>
        </Snackbar>
    </Box>
  );
}