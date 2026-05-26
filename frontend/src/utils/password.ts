export const PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])/;

export function isValidPassword(pw: string) {
  if (!pw) return false;
  if (pw.length < 8) return false;
  return PASSWORD_REGEX.test(pw);
}

export const PASSWORD_REQUIREMENTS_MESSAGE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y una minúscula.';
