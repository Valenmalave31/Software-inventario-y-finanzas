import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import ChangePasswordModal from '../auth/ChangePasswordModal';
import api from "../../services/api"; 

import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  TextField,
  Switch,
  CircularProgress,
} from '@mui/material';

interface MetodoPago {
  nombre: string;
  activo: boolean;
}

interface Notificacion {
  titulo: string;
  descripcion: string;
  activo: boolean;
}

export default function Configuracion() {
  const [tab, setTab] = React.useState<number>(0);

  const [iva, setIva] = React.useState<string>('0');
  const [retencionActiva, setRetencionActiva] = React.useState<boolean>(false);
  const [metodosPago, setMetodosPago] = React.useState<MetodoPago[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [notificaciones, setNotificaciones] = React.useState<Notificacion[]>([
    { titulo: 'Stock bajo', descripcion: 'Recibir alertas cuando un producto tenga bajo inventario', activo: true },
    { titulo: 'Pagos pendientes', descripcion: 'Alertas sobre facturas y pagos próximos a vencer', activo: true },
    { titulo: 'Metas alcanzadas', descripcion: 'Notificaciones al cumplir objetivos de ventas', activo: true },
    { titulo: 'Resumen diario', descripcion: 'Recibir un resumen de ventas al final del día', activo: false },
    { titulo: 'Alertas por email', descripcion: 'Enviar notificaciones importantes al correo', activo: false }
  ]);

  const [mostrarInputNuevoMetodo, setMostrarInputNuevoMetodo] = React.useState<boolean>(false);
  const [nuevoMetodoNombre, setNuevoMetodoNombre] = React.useState<string>('');
  const [fechaPassword, setFechaPassword] = React.useState<string | null>(null);
  const [sesionesActivas, setSesionesActivas] = React.useState<number>(1);
  const [lockMessage, setLockMessage] = React.useState<string | null>(null);
  const [hasEditLock, setHasEditLock] = React.useState<boolean>(false);
  const lockAcquiredRef = React.useRef(false);

  const [openModalPassword, setOpenModalPassword] = React.useState(false);

  const guardarNuevoMetodo = (): void => {
    if (nuevoMetodoNombre.trim() === '') return;
    setMetodosPago([
      ...metodosPago,
      { nombre: nuevoMetodoNombre, activo: true }
    ]);
    setNuevoMetodoNombre('');
    setMostrarInputNuevoMetodo(false);
  };

  const handleToggleMetodo = (index: number): void => {
    const nuevosMetodos = [...metodosPago];
    nuevosMetodos[index].activo = !nuevosMetodos[index].activo;
    setMetodosPago(nuevosMetodos);
  };

  const handleToggleNotificacion = (index: number): void => {
    const nuevasNotificaciones = [...notificaciones];
    nuevasNotificaciones[index].activo = !nuevasNotificaciones[index].activo;
    setNotificaciones(nuevasNotificaciones);
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTab(newValue);
  };

  const formatearHaceCuanto = (fechaIso: string | null) => {
  if (!fechaIso) return "Sin datos de actualización";
  const fechaUpdate = new Date(fechaIso);
  const ahora = new Date();
  fechaUpdate.setHours(0, 0, 0, 0);
  ahora.setHours(0, 0, 0, 0);
  const diferenciaDias = Math.floor((ahora.getTime() - fechaUpdate.getTime()) / (1000 * 60 * 60 * 24));

  if (diferenciaDias === 0) return "Última actualización hoy";
  if (diferenciaDias === 1) return "Última actualización hace 1 día";
  return `Última actualización hace ${diferenciaDias} días`;
  };

  const handleCloseModal = () => {
    setOpenModalPassword(false);
  };

  const releaseEditLock = React.useCallback(async () => {
    if (!lockAcquiredRef.current) return;

    try {
      await api.delete('/settings/lock');
    } catch (error) {
      console.error('Error liberando bloqueo de configuración:', error);
    } finally {
      lockAcquiredRef.current = false;
      setHasEditLock(false);
    }
  }, []);

  const handleCloseAllSessions = async () => {
      try {
        await api.post('/auth/logout-all');

        alert("Se han invalidado todas las sesiones. Por seguridad, ingresa de nuevo.");

        // Limpieza total del almacenamiento local
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Importante borrar los datos del usuario también
        
        // Redirección al login
        window.location.href = '/'; 

      } catch (error) {
        console.error("Error al cerrar sesiones:", error);
        alert("Hubo un error al cerrar las sesiones. Inténtalo de nuevo.");
      }
    };

    React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [resSettings, resSessions, resUser] = await Promise.all([
          api.get('/settings'),
          api.get('/auth/active-sessions').catch(() => ({ data: 1 })),
          api.get('/auth/profile').catch(() => ({ data: { passwordUpdatedAt: null } })),
        ]);

        const data = resSettings.data;
        setIva(data.impuesto?.toString() || '0');
        setRetencionActiva(!!data.retencionActiva);
        setMetodosPago(data.metodosPago || []);
          if (data.notificacionesConfig && Array.isArray(data.notificacionesConfig)) {
            setNotificaciones((prevNotificaciones) => {
              return prevNotificaciones.map((notifLocal) => {
                // Buscamos si la notificación de la base de datos coincide con la del código
                const guardada = data.notificacionesConfig.find(
                  (n: any) => n.titulo === notifLocal.titulo
                );
                // Si existe en la BD, actualizamos su estado 'activo'. 
                // Si no existe (como el email), mantenemos la que definimos arriba.
                return guardada ? { ...notifLocal, activo: guardada.activo } : notifLocal;
              });
            });
          }

        if (resUser.data && resUser.data.passwordUpdatedAt) {
          setFechaPassword(resUser.data.passwordUpdatedAt); 
        } else {
          setFechaPassword(null); 
        }

        try {
          await api.post('/settings/lock');
          lockAcquiredRef.current = true;
          setHasEditLock(true);
          setLockMessage(null);
        } catch (error: any) {
          if (error?.response?.status === 409) {
            const lockData = error.response.data || {};
            const mensaje = lockData.message || lockData.mensaje || 'Alguien mas esta haciendo modificaciones en la configuracion.';
            setLockMessage(mensaje);
            setHasEditLock(false);
            lockAcquiredRef.current = false;
          } else {
            throw error;
          }
        }

        //Sesiones activas desde resSessions
        setSesionesActivas(resSessions.data);

      } catch (error: any) {
        console.error('Error general cargando configuración:', error);
      } finally {
        setLoading(false);
      }
    };
        fetchSettings();
      return () => {
        void releaseEditLock();
      };
      }, [releaseEditLock]);

  React.useEffect(() => {
    if (!hasEditLock) return;

    const interval = window.setInterval(() => {
      api.post('/settings/lock').catch((error) => {
        console.error('Error renovando bloqueo de configuración:', error);
      });
    }, 60000);

    return () => window.clearInterval(interval);
  }, [hasEditLock]);

 const handleGuardarCambios = async () => {
  try {
    if (!hasEditLock) {
      alert(lockMessage || 'Otra persona esta haciendo modificaciones en la configuracion.');
      return;
    }
    const opcionEmail = notificaciones.find(n => n.titulo === 'Alertas por email');
    
    const payload = {
      impuesto: Number(iva),
      retencionActiva: Boolean(retencionActiva),
      metodosPago: metodosPago,
      notificacionesConfig: notificaciones,
      enviarEmailAlertas: opcionEmail ? opcionEmail.activo : false
    };

    console.log("Enviando este payload:", payload);

    await api.patch('/settings', payload);

    alert('¡Los cambios fueron actualizados exitosamente!');
  } catch (error: any) {
    // ESTO TE DIRÁ EXACTAMENTE QUÉ RECHAZÓ EL BACKEND
    console.error("Detalle del error 400:", error.response?.data); 
    alert('Hubo un error al guardar los cambios.');
  }
};

if (loading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress /> 
      <Typography sx={{ ml: 2 }}>Cargando configuración...</Typography>
    </Box>
  );
}

return (
  <Box sx={{ p: { xs: 2, md: 3 } }}>
    {lockMessage && !hasEditLock && (
      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
        {lockMessage}
      </Alert>
    )}
    {hasEditLock && (
      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Estás editando la configuración global. Nadie más puede modificarla mientras mantienes esta sesión abierta.
      </Alert>
    )}
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, mb: 1, gap: 1.5, flexDirection: { xs: "column", md: "row" } }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", fontSize: { xs: "1.5rem", md: "2.125rem" } }}>
        Configuración
      </Typography>

      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={handleGuardarCambios}
        disabled={!hasEditLock}
        sx={{
          backgroundColor: "#1976d2",
          textTransform: "none",
          borderRadius: "10px",
          width: { xs: "100%", md: "auto" },
          fontSize: { xs: "0.75rem", md: "0.875rem" },
        }}
      >
        Guardar Cambios
      </Button>
    </Box>

      <Typography sx={{ fontSize: { xs: 12, md: 14 }, color: '#6b7280', mb: 2 }}>
        Administra la configuración del sistema
      </Typography>
      <Card sx={{ borderRadius: 3, boxShadow: 0, border: '1px solid #e5e7eb' }}>
        <Tabs
          value={tab}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: { xs: 1, md: 3 },
            pt: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: { xs: '0.75rem', md: '0.875rem' }, minHeight: { xs: 38, md: 48 } }
          }}
        >
          <Tab icon={<AttachMoneyIcon />} iconPosition="start" label="Impuestos" />
          <Tab icon={<AccountBalanceWalletIcon />} iconPosition="start" label="Métodos de Pago" />
          <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notificaciones" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Seguridad" />
        </Tabs>

        <Divider sx={{ borderColor: '#e5e7eb' }} />

        <CardContent sx={{ opacity: hasEditLock || loading ? 1 : 0.72, pointerEvents: hasEditLock ? 'auto' : 'none' }}>
          {tab === 0 && (
            <>
              <Typography fontWeight="bold" sx={{ mb: 3, fontSize: { xs: 15, md: 17 } }}>
                Configuración de Impuestos
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', md: 'center' },
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: { xs: 1.25, md: 0 },
                  py: 2,
                  px: 3,
                  backgroundColor: '#f9fafb',
                  borderRadius: 2,
                  mb: 2
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                    IVA (Impuesto al Valor Agregado)
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                    Tasa general aplicada a productos y servicios
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  type="number"
                  sx={{ width: { xs: '100%', md: 100 } }}
                  value={iva}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIva(e.target.value)}
                  disabled={!hasEditLock}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', md: 'center' },
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: { xs: 1.25, md: 0 },
                  py: 2,
                  px: 3,
                  backgroundColor: '#f9fafb',
                  borderRadius: 2
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                    Retención en la Fuente
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                    Aplicar retención automática
                  </Typography>
                </Box>
                <Switch
                  checked={retencionActiva}
                  onChange={() => setRetencionActiva(!retencionActiva)}
                  disabled={!hasEditLock}
                />
              </Box>
            </>
          )}

          {tab === 1 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, mb: 3, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.25, md: 0 } }}>
                <Typography fontWeight="bold" sx={{ fontSize: { xs: 15, md: 17 } }}>
                  Métodos de Pago
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  sx={{ textTransform: 'none', fontWeight: 500, width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'center', md: 'flex-start' } }}
                  onClick={() => setMostrarInputNuevoMetodo(true)}
                  disabled={!hasEditLock}
                >
                  Agregar método
                </Button>
              </Box>

              {mostrarInputNuevoMetodo && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  <TextField
                    size="small"
                    placeholder="Nombre del nuevo método"
                    value={nuevoMetodoNombre}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNuevoMetodoNombre(e.target.value)}
                    fullWidth
                    disabled={!hasEditLock}
                  />
                  <Button variant="contained" size="small" onClick={guardarNuevoMetodo}>
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setMostrarInputNuevoMetodo(false);
                      setNuevoMetodoNombre('');
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              )}

              {metodosPago.map((metodo, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 1, md: 0 },
                    py: 2,
                    px: 3,
                    backgroundColor: '#f9fafb',
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
                    {metodo.nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, alignSelf: { xs: 'flex-end', md: 'center' } }}>
                    <Switch checked={metodo.activo} onChange={() => handleToggleMetodo(index)} disabled={!hasEditLock} />
                    <IconButton
                      size="small"
                      disabled={!hasEditLock}
                      onClick={() => {
                        if (window.confirm(`¿Estás seguro que quieres eliminar "${metodo.nombre}"?`)) {
                          const copiaMetodos = [...metodosPago];
                          copiaMetodos.splice(index, 1);
                          setMetodosPago(copiaMetodos);
                        }
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </>
          )}

          {tab === 2 && (
            <>
              <Typography fontWeight="bold" sx={{ mb: 3, fontSize: { xs: 15, md: 17 } }}>
                Preferencias de Notificaciones
              </Typography>
              {notificaciones.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'stretch', md: 'center' },
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 1, md: 0 },
                    py: 2,
                    px: 3,
                    backgroundColor: '#f9fafb',
                    borderRadius: 2,
                    mb: 2
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{item.titulo}</Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{item.descripcion}</Typography>
                  </Box>
                  <Switch checked={item.activo} onChange={() => handleToggleNotificacion(index)} sx={{ alignSelf: { xs: 'flex-end', md: 'center' } }} disabled={!hasEditLock} />
                </Box>
              ))}
            </>
          )}

          {tab === 3 && (
            <>
              <Typography fontWeight="bold" sx={{ mb: 3, fontSize: { xs: 15, md: 17 } }}>
                Seguridad de la Cuenta
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1, md: 0 }, py: 2, px: 3, backgroundColor: '#f9fafb', borderRadius: 2, mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Cambiar contraseña</Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                    {formatearHaceCuanto(fechaPassword)}
                  </Typography>                </Box>
                <Button 
                  variant="outlined" 
                  sx={{ textTransform: 'none', borderRadius: 2, width: { xs: '100%', md: 'auto' } }}
                  onClick={() => setOpenModalPassword(true)} 
                  disabled={!hasEditLock}
                >
                  Cambiar
                </Button>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1, md: 0 }, py: 2, px: 3, backgroundColor: '#f9fafb', borderRadius: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Sesiones activas</Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                    {sesionesActivas} {sesionesActivas === 1 ? 'dispositivo conectado' : 'dispositivos conectados'}
                  </Typography>
                </Box>
                <Button 
                  color="error" 
                  sx={{ textTransform: 'none', fontWeight: 500, width: { xs: '100%', md: 'auto' } }}
                  onClick={handleCloseAllSessions} 
                >
                  Cerrar todas
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
      <ChangePasswordModal
        open={openModalPassword}
        onClose={handleCloseModal}
        onSuccess={() => setFechaPassword(new Date().toISOString())}
      />
    </Box>
  );
}