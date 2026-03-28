import { defaultAiConfig } from "@/lib/ai-config";

const severityWeight = {
  LOW: 35,
  MEDIUM: 55,
  HIGH: 75,
  CRITICAL: 95,
};

function clamp(value: number) {
  return Math.max(10, Math.min(95, value));
}

function recencyScore(date: Date, windowDays = 14) {
  const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 100 - (diff / windowDays) * 100);
}

export function scoreAlert(alert: {
  severity: keyof typeof severityWeight | string;
  createdAt: Date;
  insight?: { priorityScore?: number | null; type?: string | null } | null;
}, typeBoosts: Record<string, number> = defaultAiConfig.typeBoosts) {
  const severity = severityWeight[alert.severity as keyof typeof severityWeight] ?? 50;
  const priority = alert.insight?.priorityScore ?? 50;
  const boost = alert.insight?.type ? (typeBoosts[alert.insight.type] ?? 0) * 100 : 0;
  const recency = recencyScore(alert.createdAt);
  return clamp(severity * 0.5 + priority * 0.3 + recency * 0.2 + boost);
}

export function scoreRecommendation(reco: {
  createdAt: Date;
  insight?: { priorityScore?: number | null } | null;
}) {
  const priority = reco.insight?.priorityScore ?? 50;
  const recency = recencyScore(reco.createdAt, 21);
  return clamp(priority * 0.7 + recency * 0.3);
}
