import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import RecoveryPasswordForm from "./components/auth/RecoveryPasswordForm";
import ChangePasswordForm from "./components/auth/ChangePasswordForm";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./components/dashboard-interface/Dashboard";
import Products from "./components/inventory-interfaces/Products";
import Inventory from "./components/inventory-interfaces/Inventory";
import Sales from "./components/inventory-interfaces/Sales";
import Accounting from "./components/accounting-infaces/Accounting";
import BudgetGoals from "./components/accounting-infaces/BudgetGoals";
import Layout from "./components/layout/Layout";
import Alertas from "./components/settings-interface/Alertas";
import GeneralReport from "./components/reports/GeneralReport";
import InventoryReport from "./components/reports/InventoryReport";
import SalesReport from "./components/reports/SaleReport";
import AccountingReport from "./components/reports/AccountingReport";
import Configuracion from "./components/settings-interface/Configuracion";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/password-recovery" element={<RecoveryPasswordForm />} />
        <Route path="/change-password" element={<ChangePasswordForm />} />
        
        <Route path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        <Route path="/products"
          element={
            <ProtectedRoute>
              <Layout>
                <Products />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/accounting"
          element={
            <ProtectedRoute>
              <Layout>
                <Accounting />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/budget-goals"
          element={
            <ProtectedRoute>
              <Layout>  
                <BudgetGoals />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/alertas"
          element={
            <ProtectedRoute>
              <Layout>
                <Alertas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <GeneralReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/inventory-report"
          element={
            <ProtectedRoute>
              <Layout>
                <InventoryReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/sales-report"
          element={
            <ProtectedRoute>
              <Layout>
                <SalesReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/accounting-report"
          element={
            <ProtectedRoute>
              <Layout>
                <AccountingReport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/configuracion"
          element={
            <ProtectedRoute>
              <Layout>
                <Configuracion />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}
