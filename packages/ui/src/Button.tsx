import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "px-4 py-2 rounded-md font-medium text-sm transition-colors disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary: "bg-orange-600 text-white hover:bg-orange-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
