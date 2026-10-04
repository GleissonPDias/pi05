import { buttonClassName } from "./buttonStyles";

/** Botão padrão do sistema. Aceita ícone à esquerda via prop `icon`. */
function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  fullWidth = false,
  className,
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    >
      {Icon && <Icon className={size === "sm" ? "size-3.5" : "size-4"} />}
      {children}
    </button>
  );
}

export default Button;
