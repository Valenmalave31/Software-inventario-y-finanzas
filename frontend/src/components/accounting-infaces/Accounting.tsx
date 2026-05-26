import { useEffect, useState, useMemo } from "react";
import { Box, Typography, Paper, LinearProgress, Tabs, Tab, Stack } from "@mui/material";
import ModalButton from "../common-components/ModalButton";
import TransactionModal from "../common-components/AccountingModal";
import DataTable from "../common-components/Table";
import SearchBar from "../common-components/SearchBar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AttachMoney, CreditCard, Balance, AccountBalanceWallet } from "@mui/icons-material";
import api from "../../services/api";

interface Budget {
  name: string;
  allocated_amount: number;
  used_amount: number;
  category?: string;
}

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  cashFlow: number;
}

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
        p: { xs: 1.5, md: 2 },
        borderRadius: 2,
        bgcolor: color,
        flex: 1,
        minWidth: { xs: 0, md: 200 },
        display: "flex",
        alignItems: "center",
        gap: { xs: 1.25, md: 2 },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{ fontSize: { xs: 26, md: 32 } }}>{icon}</Box>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", fontSize: { xs: "0.95rem", md: "1.25rem" } }}>
          {value}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: { xs: "0.72rem", md: "0.875rem" } }}>
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

function ExpenseBar({
  name,
  value,
  percent,
  color,
  category,
}: {
  name: string;
  value: number;
  percent: number;
  color: string;
  category?: string;
}) {
  return (
    <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: { xs: "0.78rem", md: "0.875rem" } }}>
          {name}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
          ${Number(value).toLocaleString()} ({percent}%)
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percent > 100 ? 100 : percent}
        sx={{
          height: 10,
          borderRadius: 5,
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
          },
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}>
        <Typography variant="caption" color="textSecondary">
          Presupuesto: {name}
        </Typography>
        {category && (
          <Typography variant="caption" color="textSecondary">
            Categoría: {category}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function Accounting() {
  const [openModal, setOpenModal] = useState(false);
  const [tab, setTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    cashFlow: 0
  });

  const loadData = async () => {
    try {
      const [resOverview, resCategories] = await Promise.all([
        api.get("/planning/accounting-overview"),
        api.get("/transaction-categories"),
      ]);

      const overviewData = resOverview.data ?? {};
      setBudgets(overviewData.budgets ?? []);
      setCategories(resCategories.data ?? []);
      setTransactions(
        (overviewData.transactions ?? []).map((t: any) => ({
          ...t,
          categoryName: t.category?.name || "Sin categoría"
        }))
      );
      setSummary(overviewData.summary || { totalIncome: 0, totalExpenses: 0, balance: 0, cashFlow: 0 });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const currentYear = new Date().getFullYear();
    
    const data = months.map((month, index) => {
      const filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });

      return {
        month,
        ingresos: filtered.filter(t => t.typeId === 1).reduce((sum, t) => sum + Number(t.amount || 0), 0),
        egresos: filtered.filter(t => t.typeId === 2).reduce((sum, t) => sum + Number(t.amount || 0), 0),
      };
    });

    const currentMonth = new Date().getMonth();
    return data.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
  }, [transactions]);

  const columns = [
    { field: "concept", headerName: "DESCRIPCIÓN" },
    { field: "categoryName", headerName: "CATEGORÍA" },
    { field: "typeName", headerName: "TIPO" },
    {
        field: "amount",
        headerName: "MONTO",
        renderCell: (params: any) => `$${Number(params.value || 0).toLocaleString()}`
    },
    { field: "date", headerName: "FECHA" },
  ];

  const handleSearch = (value: string) => {
    setSearchTerm(value.toLowerCase());
  };

  const filteredRows = transactions.filter(r => {
    const conceptText = r.concept?.toLowerCase() || "";
    const matchesSearch = conceptText.includes(searchTerm);
    if (tab === 0) return matchesSearch;
    if (tab === 1) return r.typeId === 1 && matchesSearch;
    return r.typeId === 2 && matchesSearch;
  });
    return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 2, gap: 2, flexDirection: { xs: "column", md: "row" } }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "1.5rem", md: "2.125rem" } }}>Ingresos y Egresos</Typography>
        <ModalButton
          label="+ Nueva Transacción"
          onClick={() => setOpenModal(true)}
          sx={{
            mb: 0,
            width: { xs: "100%", md: "auto" },
            fontSize: { xs: "0.75rem", md: "0.875rem" },
            px: { xs: 1.5, md: 2 },
          }}
        />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 4 }}>
        <MetricCard icon={<AttachMoney sx={{ color: "green" }} />} value={`$${(summary.totalIncome || 0).toLocaleString()}`} label="Ingresos Totales" color="#e8f5e9" />
        <MetricCard icon={<CreditCard sx={{ color: "red" }} />} value={`$${(summary.totalExpenses || 0).toLocaleString()}`} label="Egresos Totales" color="#ffebee" />
        <MetricCard icon={<Balance sx={{ color: "blue" }} />} value={`$${(summary.balance || 0).toLocaleString()}`} label="Balance" color="#e3f2fd" />
        <MetricCard icon={<AccountBalanceWallet sx={{ color: "purple" }} />} value={`$${(summary.cashFlow || 0).toLocaleString()}`} label="Flujo de Caja" color="#f3e5f5" />
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap", flexDirection: { xs: "column", md: "row" } }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>Ingresos vs Egresos</Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, "Monto"]}
              />
              <Bar dataKey="ingresos" fill="#4caf50" radius={[6, 6, 0, 0]} barSize={40} />
              <Bar dataKey="egresos" fill="#f44336" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>Progreso de Presupuestos</Typography>
          {budgets.length > 0 ? budgets.map((b, i) => {
            const used = Number(b.used_amount) || 0;
            const limit = Number(b.allocated_amount) || 1;
            const calculatedPercent = Math.round((used / limit) * 100);

            return (
              <ExpenseBar
                  key={i}
                  name={b.name || "Sin Nombre"}
                  value={used}
                  percent={isNaN(calculatedPercent) ? 0 : calculatedPercent}
                  color={used > limit ? "#f44336" : "#1976d2"}
                  category={b.category}
              />
            );
          }) : <Typography variant="body2" color="textSecondary">No hay presupuestos activos</Typography>}
        </Paper>
      </Box>

      <Paper sx={{ p: { xs: 1.5, md: 2 }, mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, fontSize: { xs: "0.95rem", md: "1.25rem" } }}>Historial de Transacciones</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <SearchBar onSearch={handleSearch} placeholder="Buscar por concepto..." />
          </Box>
        </Stack>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab label={`Todas (${transactions.length})`} />
          <Tab label="Ingresos" />
          <Tab label="Egresos" />
        </Tabs>
        <DataTable columns={columns} rows={filteredRows} actions={false} />
      </Paper>

      <TransactionModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        budgets={budgets}
        categories={categories}
        onSuccess={loadData}
      />
    </Box>
  );
}
