import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import PasswordField from "./PasswordField";
import ConfirmPasswordField from "./ConfirmPasswordField";
import AuthButton from "./AuthButton";
import api from "../../services/api";
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../../utils/password';

export default function ResetPasswordForm() {
  const [credentials, setCredentials] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (credentials.newPassword !== credentials.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!isValidPassword(credentials.newPassword)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword: credentials.newPassword,
        confirmPassword: credentials.confirmPassword,
      });

      setMessage(response.data.mensaje || "Contraseña restablecida con éxito");
      setError("");

      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      console.error("Error al restablecer contraseña:", err.response?.data || err.message);

      if (Array.isArray(err.response?.data?.message)) {
        setError(err.response.data.message.join(", "));
      } else {
        setError(
          err.response?.data?.mensaje ||
          err.response?.data?.message ||
          "Error al restablecer la contraseña"
        );
      }

      setMessage("");
    }
  };

  return (
    <AuthLayout
      leftContent={
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ color: "white", fontWeight: "bold", fontSize: { md: "3rem" } }}>
            Restablece tu contraseña
          </Typography>
          <Typography variant="h3" sx={{ color: "#3f83f5", fontWeight: "bold", fontSize: { md: "3rem" } }}>
            y vuelve a tu cuenta
          </Typography>
          <Typography variant="body1" sx={{ color: "white", mt: 3, fontSize: { xs: "1rem", md: "1.1rem" } }}>
            Ingresa tu nueva contraseña
          </Typography>
        </Box>
      }
    >
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: "1.7rem", sm: "2rem", md: "2.25rem" } }}>
        Cambiar contraseña
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.92rem", sm: "1rem" } }}>
        Escribe tu nueva contraseña y confírmala
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        <PasswordField
          value={credentials.newPassword}
          onChange={handleChange}
          label="Nueva contraseña"
          name="newPassword"
        />

        <ConfirmPasswordField
          value={credentials.confirmPassword}
          onChange={handleChange}
          name="confirmPassword"
        />

        {error && <Typography color="error">{error}</Typography>}
        {message && <Typography color="primary">{message}</Typography>}

        <AuthButton label="Guardar nueva contraseña" />

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            ¿Ya tienes acceso?{" "}
            <RouterLink to="/" style={{ color: "#1976d2", textDecoration: "none" }}>
              Inicia sesión
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
