import { formatEuro, formatMonths, formatNumber, formatPercent } from "@/lib/formatters";

export function formatMetricValue(metric: { value: number; unit: string }) {
  switch (metric.unit) {
    case "EUR":
      return formatEuro(metric.value);
    case "PERCENT":
      return formatPercent(metric.value, metric.value % 1 === 0 ? 0 : 1);
    case "MONTH":
      return formatMonths(metric.value);
    case "SCORE":
      return formatNumber(metric.value, 0);
    default:
      return formatNumber(metric.value, 0);
  }
}
