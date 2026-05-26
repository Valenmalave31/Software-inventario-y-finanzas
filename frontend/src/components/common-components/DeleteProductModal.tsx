import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Typography, Alert 
} from "@mui/material";
import { Warning as WarningIcon, DeleteForever as DeleteIcon, Block as BlockIcon } from "@mui/icons-material";

interface DeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  action: "delete" | "deactivate";
  reasons: string[];
}

export default function DeleteProductModal({ 
  open,
  onClose,
  onConfirm,
  productName,
  action,
  reasons,
}: DeleteModalProps) {
  const isDeactivateAction = action === "deactivate";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fff5f5' }}>
        <WarningIcon color="error" />
        <Typography variant="h6" fontWeight={700}>Confirmar acción</Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1">
          {isDeactivateAction
            ? <>Este producto no se puede eliminar por completo y se <strong>inactivará</strong>: <strong>{productName}</strong>.</>
            : <>¿Estás seguro de que deseas eliminar <strong>{productName}</strong>?</>}
        </Typography>

        {isDeactivateAction ? (
          <Alert severity="warning" icon={<BlockIcon />} sx={{ mt: 2, borderRadius: 2 }}>
            Este producto se inactivará por las siguientes razones:
            <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
              {reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Esta acción eliminará el registro de forma permanente de la base de datos.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        
        {isDeactivateAction ? (
          <Button 
            onClick={onConfirm} 
            variant="contained" 
            color="warning"
            startIcon={<BlockIcon />}
          >
            Inactivar Producto
          </Button>
        ) : (
          <Button 
            onClick={onConfirm} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
          >
            Eliminar Definitivamente
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}