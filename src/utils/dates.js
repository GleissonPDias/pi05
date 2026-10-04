const pad = (n) => String(n).padStart(2, "0");

/** Converte um Date em "AAAA-MM-DD" usando o fuso local. */
export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "2026-08-14" -> Date local à meia-noite (evita deslocamento de fuso). */
function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "2026-08-14" -> "14/08/2026" */
export function formatDate(iso) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** Quantidade de dias entre a data informada e hoje. */
export function daysSince(iso) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - parseISODate(iso)) / 86_400_000);
}

/** "Hoje", "Há 2 dias", "Há 1 mês", "Há 2 anos"... */
export function formatRelativeDays(iso) {
  if (!iso) return "Sem visitas";

  const days = daysSince(iso);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Há 1 dia";
  if (days < 30) return `Há ${days} dias`;

  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "Há 1 mês" : `Há ${months} meses`;

  const years = Math.floor(days / 365);
  return years === 1 ? "Há 1 ano" : `Há ${years} anos`;
}

/** "2026-10-03T16:42:00.000Z" -> "03/10/2026 às 13:42" (fuso local) */
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return "—";
  const date = new Date(isoDateTime);
  const day = date.toLocaleDateString("pt-BR");
  const time = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} às ${time}`;
}

/** Tempo decorrido em texto: "agora mesmo", "há 42 minutos", "há 3 horas", "há 2 dias". */
export function formatTimeAgo(isoDateTime) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(isoDateTime)) / 60_000));
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return minutes === 1 ? "há 1 minuto" : `há ${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "há 1 hora" : `há ${hours} horas`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

/** "AAAA-MM-DD" de hoje + n dias (n pode ser negativo). */
export function dateFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toISODate(date);
}
