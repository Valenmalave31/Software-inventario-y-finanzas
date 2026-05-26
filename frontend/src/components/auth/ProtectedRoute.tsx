import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import api from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');

      // Si no hay token, no autenticado
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Validar token contra el backend
        await api.get('/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Si la solicitud es exitosa, el token es válido
        setIsAuthenticated(true);
      } catch (error: any) {
        // Si hay error (401, token expirado, etc.), no autenticado
        console.log('Token inválido o expirado:', error.response?.status);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  // Mientras se valida, mostrar spinner
  if (isAuthenticated === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si no autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Si autenticado, mostrar contenido
  return <>{children}</>;
}
