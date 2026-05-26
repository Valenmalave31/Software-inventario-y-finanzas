import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { 
  EditOutlined as EditIcon, 
  DeleteOutline as DeleteIcon 
} from "@mui/icons-material";
import TablePaginationControls from "./TablePaginationControls";

interface Column {
  field: string;
  headerName: string;
}

interface DataTableProps {
  columns: Column[];
  rows: any[];
  actions?: boolean;
  onDelete?: (row: any) => void;
  onEdit?: (row: any) => void;
}

export default function DataTable({ 
  columns, 
  rows, 
  actions = true, 
  onDelete, 
  onEdit 
}: DataTableProps) {
  const rowsPerPage = 10;
  const computedTableMinWidth = Math.max(
    actions ? 520 : 320,
    columns.length * (actions ? 150 : 140) + (actions ? 120 : 0)
  );
  const desktopMinWidth = Math.max(
    actions ? 780 : 900,
    columns.length * 150 + (actions ? 120 : 0)
  );
  const [page, setPage] = useState(0);
  const [isExportMode, setIsExportMode] = useState(false);

  const paginatedRows = useMemo(() => {
    if (isExportMode) {
      return rows;
    }
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [isExportMode, page, rows]);

  useEffect(() => {
    const handleExportStart = () => setIsExportMode(true);
    const handleExportEnd = () => setIsExportMode(false);

    window.addEventListener("pdf-export-start", handleExportStart);
    window.addEventListener("pdf-export-end", handleExportEnd);

    return () => {
      window.removeEventListener("pdf-export-start", handleExportStart);
      window.removeEventListener("pdf-export-end", handleExportEnd);
    };
  }, []);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, rows.length]);

  return (
    <TableContainer 
      component={Paper} 
      elevation={0}
      sx={{ 
        mt: { xs: 2, sm: 3 }, 
        borderRadius: "12px", 
        border: "1px solid",
        borderColor: "divider",
        overflowX: { xs: "scroll", sm: "auto" },
        overflowY: "hidden",
        maxWidth: "100%",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x pan-y",
        scrollbarWidth: "thin"
      }}
    >
      <Table
        sx={{
          minWidth: { xs: computedTableMinWidth, md: desktopMinWidth },
          width: { xs: "max-content", md: "100%" },
          tableLayout: "auto",
        }}
      >
        <TableHead sx={{ bgcolor: "#fafafa" }}>
          <TableRow>
            {columns.map((col) => (
              <TableCell 
                key={col.field} 
                sx={{ 
                  fontWeight: 700, 
                  color: "text.secondary",
                  fontSize: { xs: "0.72rem", sm: "0.85rem" },
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  py: 2,
                  minWidth: { xs: 130, md: 120 },
                  whiteSpace: "nowrap"
                }}
              >
                {col.headerName}
              </TableCell>
            ))}
            {actions && (
              <TableCell 
                align="right" 
                sx={{ 
                  fontWeight: 700, 
                  color: "text.secondary",
                  fontSize: { xs: "0.72rem", sm: "0.85rem" },
                  letterSpacing: "0.5px",
                  pr: 4,
                  minWidth: { xs: 120, md: 110 },
                  whiteSpace: "nowrap"
                }}
              >
                ACCIONES
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedRows.map((row, i) => (
            <TableRow 
              key={row.id || i} 
              hover 
              sx={{ 
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.02) !important" },
                transition: "background-color 0.2s ease"
              }}
            >
              {columns.map((col) => (
                <TableCell 
                  key={col.field}
                  sx={{ 
                    py: 1.5, 
                    color: "text.primary", 
                    fontSize: { xs: "0.8rem", sm: "0.9rem" },
                    minWidth: { xs: 130, md: 120 },
                    whiteSpace: "nowrap"
                  }}
                >
                  {col.field === "status" ? (
                    <Box
                      sx={{ 
                        display: "inline-flex",
                        px: 1.5, 
                        py: 0.4,
                        borderRadius: "6px",
                        bgcolor: row[col.field] === "Activo" ? "#e8f5e9" : "#ffebee",
                        color: row[col.field] === "Activo" ? "#2e7d32" : "#d32f2f",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase"
                      }}
                    >
                      {row[col.field]}
                    </Box>
                  ) : (
                    row[col.field]
                  )}
                </TableCell>
              ))}
              
              {actions && (
                <TableCell align="right" sx={{ pr: 3, whiteSpace: "nowrap" }}>
                  <IconButton 
                    onClick={() => onEdit?.(row)}
                    sx={{ 
                      color: "primary.main",
                      bgcolor: "rgba(25, 118, 210, 0.04)",
                      mr: 0.5,
                      "&:hover": { bgcolor: "rgba(25, 118, 210, 0.1)" }
                    }}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => onDelete?.(row)}
                    sx={{ 
                      color: "error.main",
                      bgcolor: "rgba(211, 47, 47, 0.04)",
                      "&:hover": { bgcolor: "rgba(211, 47, 47, 0.1)" }
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!isExportMode && (
        <Box sx={{ p: 1, borderTop: "1px solid", borderColor: "divider" }}>
          <TablePaginationControls
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={rows.length}
            onPageChange={setPage}
          />
        </Box>
      )}
    </TableContainer>
  );
}