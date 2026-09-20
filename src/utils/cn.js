/**
 * Junta classes CSS ignorando valores falsos.
 * Ex.: cn("p-2", isActive && "bg-blue-600", undefined) -> "p-2 bg-blue-600"
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
