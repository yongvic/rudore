const compactNumber = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

export function formatCompact(value: number) {
  return compactNumber.format(value).replace(/\s+/g, "");
}

export function formatEuro(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const formatted =
    abs >= 1000 ? formatCompact(abs) : numberFormatter.format(abs);
  return `${sign}${formatted}€`;
}

export function formatPercent(value: number, digits = 1) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(abs);
  return `${sign}${formatted}%`;
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatMonths(value: number) {
  return `${formatNumber(value, 1)} mois`;
}

export function formatConfidence(value: number) {
  return formatNumber(value, 0);
}

export function formatScore(value: number) {
  return formatNumber(Math.round(value), 0);
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatRelativeTime(date: Date, now = new Date()) {
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDiff =
    (startOfDay(now) - startOfDay(date)) / (1000 * 60 * 60 * 24);
  const time = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (dayDiff === 0) {
    return `Aujourd'hui ${time}`;
  }
  if (dayDiff === 1) {
    return `Hier ${time}`;
  }
  return `${formatShortDate(date)} ${time}`;
}
