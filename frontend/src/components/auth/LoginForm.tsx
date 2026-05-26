import { useState } from "react";
import { Box, Typography, Checkbox, FormControlLabel, Alert } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import EmailField from "./EmailField";
import PasswordField from "./PasswordField";
import AuthButton from "./AuthButton";
import api from "../../services/api"; 

export default function LoginForm() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (error) {
      setError(null);
    }
    setCredentials({
      ...credentials,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        if (response.data.usuario) {
          localStorage.setItem("user", JSON.stringify(response.data.usuario));
        }

        if (credentials.remember) {
          localStorage.setItem("remember", "true");
        }

        navigate("/dashboard");
      } else {
        setError("Credenciales inválidas");
      }
    } catch (err: any) {
      console.error("Error en login:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        setError("Alguno de los datos es incorrecto. Verifica el correo y la contraseña e inténtalo de nuevo.");
        return;
      }

      setError(err.response?.data?.mensaje || err.response?.data?.message || "Error al iniciar sesión");
    }
  };

  return (
    <AuthLayout
      leftContent={
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              color: "white",
              fontWeight: "bold",
              textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
              fontSize: { md: "3rem" },
            }}
          >
            Tus finanzas,
          </Typography>

          <Typography
            variant="h3"
            sx={{
              color: "#3f83f5",
              fontWeight: "bold",
              textShadow: "2px 2px 6px rgba(0,0,0,0.6)",
              fontSize: { md: "3rem" },
            }}
          >
            bajo control
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "white",
              mt: 3,
              textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            Gestión financiera transparente
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "white",
              textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            para decisiones seguras.
          </Typography>
        </Box>
      }
    >
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" } }}>
        Bienvenido de nuevo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.92rem", sm: "1rem" } }}>
        Ingresa tus credenciales para acceder a tu cuenta
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        <EmailField
          value={credentials.email}
          onChange={handleChange}
          error={false}
          helperText=""
        />

        <PasswordField
          value={credentials.password}
          onChange={handleChange}
          error={false}
          helperText=""
        />

        <Box textAlign="right" sx={{ mt: 1 }}>
          <RouterLink to="/password-recovery" style={{ color: '#1976d2', textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </RouterLink>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              name="remember"
              checked={credentials.remember}
              onChange={handleChange}
            />
          }
          label="Mantener sesión iniciada"
        />

        <AuthButton label="Iniciar sesión" />

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            ¿No tienes una cuenta?{" "}
            <RouterLink to="/register" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Crear cuenta
            </RouterLink>
          </Typography>
        </Box>
      </Box>

      <Alert severity="warning" sx={{ mt: 3, width: "100%" }}>
        La aplicación puede tardar hasta 2 minutos en iniciar sesión en algunos casos.
      </Alert>
    </AuthLayout>
  );
}
