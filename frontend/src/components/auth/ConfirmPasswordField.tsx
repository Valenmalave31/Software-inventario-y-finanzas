import PasswordField from "./PasswordField";

type ConfirmPasswordFieldProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
};

export default function ConfirmPasswordField({
  value,
  onChange,
  name,
}: ConfirmPasswordFieldProps) {
  return (
    <PasswordField
      value={value}
      onChange={onChange}
      label="Confirmar contraseña"
      name={name}
    />
  );
}
