import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import EmailField from "./EmailField";
import AuthButton from "./AuthButton";
import api from "../../services/api";

export default function RecoveryPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.mensaje || "Correo enviado con instrucciones");
      setError(null);
    } catch (err: any) {
      console.error("Error en recuperación:", err.response?.data || err.message);
      setError(err.response?.data?.mensaje || "Error al enviar el correo");
      setMessage(null);
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
            Recupera tu acceso
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
            fácilmente
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
            Ingresa tu correo electrónico
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "white",
              textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            y te enviaremos instrucciones para restablecer tu contraseña.
          </Typography>
        </Box>
      }
    >
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: "1.7rem", sm: "2rem", md: "2.25rem" } }}>
        Recuperar contraseña
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.92rem", sm: "1rem" } }}>
        Ingresa tu correo electrónico para recibir un enlace de recuperación
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        <EmailField value={email} onChange={handleChange} />

        <AuthButton label="Enviar enlace de recuperación" />

        {message && (
          <Typography color="primary" sx={{ mt: 2 }}>
            
            {message}
          </Typography>
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            ¿Ya recuerdas tu contraseña?{" "}
            <RouterLink to="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Inicia sesión
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
