import { useState } from 'react';
import {
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import api from '../../services/api';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({ open, onClose, onSuccess }: ChangePasswordModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: '',
  });

  const validateForm = () => {
    const nextErrors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    };

    if (!oldPassword.trim()) nextErrors.oldPassword = 'La contraseña actual es obligatoria';
    if (!newPassword.trim()) nextErrors.newPassword = 'La nueva contraseña es obligatoria';
    if (!confirmPassword.trim()) nextErrors.confirmPassword = 'Debes confirmar la nueva contraseña';

    if (newPassword && newPassword.length < 8) {
        nextErrors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres';
    }

      // Require at least one uppercase and one lowercase letter
      if (newPassword && !/(?=.*[a-z])(?=.*[A-Z])/.test(newPassword)) {
        nextErrors.newPassword = 'La nueva contraseña debe contener al menos una mayúscula y una minúscula';
      }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'La confirmación no coincide con la nueva contraseña';
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleClose = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({ oldPassword: '', newPassword: '', confirmPassword: '', general: '' });
    onClose();
  };

  const handlePasswordChange = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        oldPassword,
        newPassword,
        confirmPassword,
      };

      await api.post('/auth/change-password', payload);

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      const retryAfterSeconds = error.response?.data?.retryAfterSeconds;
      const rawMessage =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        (retryAfterSeconds
          ? `Demasiados intentos. Intenta nuevamente en ${retryAfterSeconds} segundos.`
          : 'Error al cambiar la contraseña');
      const mensaje = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

      if (error.response?.status === 429) {
        setErrors((prev) => ({ ...prev, oldPassword: mensaje, general: '' }));
        return;
      }

      if (typeof mensaje === 'string' && mensaje.toLowerCase().includes('actual no coincide')) {
        setErrors((prev) => ({ ...prev, oldPassword: mensaje, general: '' }));
        return;
      }

      if (typeof mensaje === 'string' && mensaje.toLowerCase().includes('no coinciden')) {
        setErrors((prev) => ({ ...prev, confirmPassword: mensaje, general: '' }));
        return;
      }

      setErrors((prev) => ({ ...prev, general: mensaje || 'Error al cambiar la contraseña' }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Cambiar Contraseña</DialogTitle>
      <DialogContent dividers sx={{ px: { xs: 2, sm: 3 }, py: { xs: 1.5, sm: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, width: '100%' }}>
          <TextField
            label="Contraseña actual"
            type={showOld ? 'text' : 'password'}
            value={oldPassword}
            onChange={(e) => {
              setOldPassword(e.target.value);
              setErrors((prev) => ({ ...prev, oldPassword: '', general: '' }));
            }}
            error={Boolean(errors.oldPassword)}
            helperText={errors.oldPassword || ' '}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowOld(!showOld)}>
                    {showOld ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Nueva contraseña"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setErrors((prev) => ({ ...prev, newPassword: '', general: '' }));
            }}
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword || ' '}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNew(!showNew)}>
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Confirmar contraseña"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((prev) => ({ ...prev, confirmPassword: '', general: '' }));
            }}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword || ' '}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {errors.general ? (
            <Typography variant="body2" color="error" sx={{ mt: -1 }}>
              {errors.general}
            </Typography>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 2, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none', color: 'gray' }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handlePasswordChange} sx={{ textTransform: 'none' }}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}