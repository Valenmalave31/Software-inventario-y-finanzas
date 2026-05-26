import { useState } from "react";
import { Box, Typography, TextField } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import EmailField from "./EmailField";
import PasswordField from "./PasswordField";
import AuthButton from "./AuthButton";
import ConfirmPasswordField from "./ConfirmPasswordField";
import api from "../../services/api"; 
import { isValidPassword, PASSWORD_REQUIREMENTS_MESSAGE } from '../../utils/password';

export default function RegisterForm() {
  const [credentials, setCredentials] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (credentials.password !== credentials.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!isValidPassword(credentials.password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name: credentials.name,
        lastName: credentials.lastName,
        email: credentials.email,
        password: credentials.password,
      });

      console.log("Registro exitoso:", response.data);
      navigate("/");
    } catch (err: any) {
      console.error("Error en registro:", err.response?.data || err.message);
      setError(err.response?.data?.mensaje || "Error al crear la cuenta");
    }
  };

  return (
    <AuthLayout
      leftContent={
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ color: "white", fontWeight: "bold", fontSize: { md: "3rem" } }}>
            Crea tu cuenta
          </Typography>
          <Typography variant="h3" sx={{ color: "#3f83f5", fontWeight: "bold", fontSize: { md: "3rem" } }}>
            y empieza a crecer
          </Typography>
          <Typography variant="body1" sx={{ color: "white", mt: 3, fontSize: { xs: "1rem", md: "1.1rem" } }}>
            Únete a nuestra plataforma
          </Typography>
          <Typography variant="body1" sx={{ color: "white", fontSize: { xs: "1rem", md: "1.1rem" } }}>
            y gestiona tus finanzas fácilmente.
          </Typography>
        </Box>
      }
    >
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: "1.7rem", sm: "2rem", md: "2.25rem" } }}>
        Crear cuenta
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: "0.92rem", sm: "1rem" } }}>
        Ingresa tus datos para registrarte
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          <TextField
            fullWidth
            margin="normal"
            size="small"
            label="Nombre"
            name="name"
            value={credentials.name}
            onChange={handleChange}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />

          <TextField
            fullWidth
            margin="normal"
            size="small"
            label="Apellido"
            name="lastName"
            value={credentials.lastName}
            onChange={handleChange}
            sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
          />
        </Box>

        <EmailField
          value={credentials.email}
          onChange={handleChange}
        />

        <PasswordField
          value={credentials.password}
          onChange={handleChange}
          label="Contraseña"
          name="password"
        />

        <ConfirmPasswordField
          value={credentials.confirmPassword}
          onChange={handleChange}
          name="confirmPassword"
        />

        {error && (
          <Typography color="error" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <AuthButton label="Crear cuenta" />

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="body2">
            ¿Ya tienes una cuenta?{" "}
            <RouterLink to="/" style={{ color: '#1976d2', textDecoration: 'none' }}>
              Inicia sesión
            </RouterLink>
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
}
