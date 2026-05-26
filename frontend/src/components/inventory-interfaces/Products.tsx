import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import SearchBar from "../common-components/SearchBar";
import FilterBar from "../common-components/StatusFilter";
import ModalButton from "../common-components/ModalButton";
import DataTable from "../common-components/Table";
import MetricCard from "../common-components/MetricCard";
import ProductModal from "../common-components/ProductModal"; 
import ProductEditFormModal from "../common-components/ProductEditFormModal"; 
import DeleteProductModal from "../common-components/DeleteProductModal";
import { Inventory as InventoryIcon, CheckCircle, Warning, MonetizationOn } from "@mui/icons-material";
import api from "../../services/api";

export default function Products() {
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [removalImpact, setRemovalImpact] = useState<{
    action: "delete" | "deactivate";
    reasons: string[];
  }>({
    action: "delete",
    reasons: [],
  });
  const [rows, setRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    activos: 0,
    stockBajo: 0,
    valorInventario: 0,
  });
  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");

  const handleOpenCreate = () => setOpenCreateModal(true);
  const handleCloseCreate = () => setOpenCreateModal(false);

  const handleOpenEdit = (product: any) => {
    setSelectedProduct(product.originalData);
    setOpenEditModal(true);
  };
  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setSelectedProduct(null);
  };

  const columns = [
    { field: "name", headerName: "PRODUCTO" },
    { field: "categoryName", headerName: "CATEGORÍA" },
    { field: "displayBuyPrice", headerName: "P. COMPRA" },
    { field: "displaySellPrice", headerName: "P. VENTA" },
    { field: "stock", headerName: "STOCK" },
    { field: "status", headerName: "ESTADO" },
  ];

  const fetchProducts = (search = "", status = "Todos") => {
    api.get(`/products?search=${search}&status=${status}`)
      .then(res => {
        const mapped = res.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          categoryName: p.category?.name,
          displayBuyPrice: `$${p.purchasePrice.toLocaleString("es-CO")}`,
          displaySellPrice: `$${p.salePrice.toLocaleString("es-CO")}`,
          stock: p.stock,
          status: p.status,
          originalData: p,
        }))
        .sort((a: any, b: any) => Number(b.id) - Number(a.id));
        setRows(mapped);
      })
      .catch(err => console.error("Error al cargar productos:", err));
  };

  const loadMetrics = () => {
    api.get("/products/metrics")
      .then(res => setMetrics(res.data))
      .catch(err => console.error("Error al cargar métricas:", err));
  };

  useEffect(() => {
    fetchProducts(searchValue, selectedStatus);
    loadMetrics();
  }, [searchValue, selectedStatus]);

  const handleDeleteClick = (product: any) => {
    setSelectedProduct(product.originalData);

    api.get(`/products/${product.id}/removal-impact`)
      .then((res) => {
        setRemovalImpact({
          action: res.data.action,
          reasons: res.data.reasons ?? [],
        });
        setOpenDeleteModal(true);
      })
      .catch((err) => {
        console.error("Error al validar eliminación del producto:", err);
        setRemovalImpact({
          action: "deactivate",
          reasons: ["No se pudo validar el historial. Para evitar inconsistencias, se inactivará."],
        });
        setOpenDeleteModal(true);
      });
  };

  const handleConfirmDelete = () => {
    if (!selectedProduct) return;
    api.delete(`/products/${selectedProduct.id}`)
      .then(() => {
        setOpenDeleteModal(false);
        fetchProducts(searchValue, selectedStatus);
        loadMetrics();
      })
      .catch(err => console.error("Error al eliminar producto:", err));
  };

  const refreshData = () => {
    fetchProducts(searchValue, selectedStatus);
    loadMetrics();
  };

  return (
    <Box sx={{ p: 3, pt: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 2,
          mb: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#1a2027",
              letterSpacing: "-0.5px",
              fontSize: { xs: "1.6rem", sm: "2rem", md: "2.125rem" },
            }}
          >
            Productos
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", fontSize: { xs: "0.85rem", sm: "1rem" } }}>
            Administra los productos de tu papelería
          </Typography>
        </Box>
        <ModalButton
          label="+ Nuevo Producto"
          onClick={handleOpenCreate}
          sx={{ mb: 0, whiteSpace: "nowrap" }}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <MetricCard
          icon={<InventoryIcon sx={{ color: "blue" }} />}
          label="Total Productos"
          value={metrics.total}
          color="#e3f2fd"
        />
        <MetricCard
          icon={<CheckCircle sx={{ color: "green" }} />}
          label="Productos Activos"
          value={metrics.activos}
          color="#e8f5e9"
        />
        <MetricCard
          icon={<Warning sx={{ color: "red" }} />}
          label="Stock Bajo"
          value={metrics.stockBajo}
          color="#ffebee"
        />
        <MetricCard
          icon={<MonetizationOn sx={{ color: "orange" }} />}
          label="Valor Inventario"
          value={`$${metrics.valorInventario.toLocaleString("es-CO")}`}
          color="#fff3e0"
        />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
        Lista de Productos
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexDirection: { xs: "column", sm: "row" } }}>
        <Box sx={{ flexGrow: 1, width: "100%" }}>
          <SearchBar
            placeholder="Buscar producto ..."
            onSearch={(value) => setSearchValue(value)}
          />
        </Box>
        <FilterBar
          options={["Todos", "Activo", "Inactivo", "Agotado"]}
          onChange={(value) => setSelectedStatus(value)}
        />
      </Box>

      {rows.length === 0 ? (
        <Typography 
          variant="body1" 
          sx={{ textAlign: "center", mt: 4, color: "text.secondary" }}
        >
          No hay productos {selectedStatus !== "Todos" ? selectedStatus.toLowerCase() : ""}...
        </Typography>
      ) : (
        <DataTable 
          columns={columns} 
          rows={rows} 
          actions={true} 
          onDelete={handleDeleteClick}
          onEdit={handleOpenEdit}
        />
      )}

      <ProductModal 
        open={openCreateModal} 
        onClose={handleCloseCreate} 
        onSaved={refreshData}
      />

      <ProductEditFormModal 
        open={openEditModal} 
        onClose={handleCloseEdit} 
        productToEdit={selectedProduct}
        onSaved={refreshData} 
      />

      {selectedProduct && openDeleteModal && (
        <DeleteProductModal
          open={openDeleteModal}
          onClose={() => setOpenDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          productName={selectedProduct.name}
          action={removalImpact.action}
          reasons={removalImpact.reasons}
        />
      )}
    </Box>
  );
}