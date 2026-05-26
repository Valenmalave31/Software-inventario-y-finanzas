import { TablePagination } from "@mui/material";

interface TablePaginationControlsProps {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (newPage: number) => void;
}

export default function TablePaginationControls({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
}: TablePaginationControlsProps) {
  return (
    <TablePagination
      component="div"
      count={totalRows}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, newPage) => onPageChange(newPage)}
      rowsPerPageOptions={[]}
      labelRowsPerPage=""
      labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      sx={{
        borderTop: "1px solid #e6ebf1",
        bgcolor: "#fcfdff",
        px: { xs: 1, sm: 2 },
        py: 0.5,
        ".MuiTablePagination-toolbar": {
          minHeight: 54,
          px: { xs: 0.5, sm: 1 },
          display: "flex",
          flexWrap: { xs: "wrap", sm: "nowrap" },
          justifyContent: { xs: "space-between", sm: "flex-end" },
          gap: 1,
        },
        ".MuiTablePagination-displayedRows": {
          fontSize: { xs: "0.78rem", sm: "0.86rem" },
          fontWeight: 600,
          color: "#334155",
          letterSpacing: "0.01em",
          margin: 0,
        },
        ".MuiTablePagination-actions": {
          ml: 1,
          display: "flex",
          gap: 0.5,
        },
        ".MuiTablePagination-actions .MuiIconButton-root": {
          border: "1px solid #dbe4ef",
          bgcolor: "#ffffff",
          color: "#3b4f68",
          borderRadius: 2,
          transition: "all 0.18s ease",
        },
        ".MuiTablePagination-actions .MuiIconButton-root:hover": {
          bgcolor: "#f3f7fc",
          borderColor: "#bfd0e4",
          transform: "translateY(-1px)",
        },
        ".MuiTablePagination-actions .MuiIconButton-root.Mui-disabled": {
          bgcolor: "#f8fafc",
          borderColor: "#eef2f7",
          color: "#b6c2d1",
          transform: "none",
        },
      }}
    />
  );
}