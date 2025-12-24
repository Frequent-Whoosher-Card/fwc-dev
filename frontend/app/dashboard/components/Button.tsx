"use client";

export default function Button({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "h-9 px-3 rounded-md text-sm font-medium transition";

  const styles = {
    primary: "bg-black text-white",
    secondary: "bg-gray-200 text-gray-800",
  };

  return (
    <button className={`${base} ${styles[variant]}`}>
      {children}
    </button>
  );
}
