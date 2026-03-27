const severityWeight = {
  LOW: 0.35,
  MEDIUM: 0.55,
  HIGH: 0.75,
  CRITICAL: 0.95,
};

function clamp(value: number) {
  return Math.max(0.1, Math.min(0.95, value));
}

function recencyScore(date: Date, windowDays = 14) {
  const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - diff / windowDays);
}

export function scoreAlert(alert: {
  severity: keyof typeof severityWeight | string;
  createdAt: Date;
  insight?: { priorityScore?: number | null } | null;
}) {
  const severity = severityWeight[alert.severity as keyof typeof severityWeight] ?? 0.5;
  const priority = alert.insight?.priorityScore ?? 0.5;
  const recency = recencyScore(alert.createdAt);
  return clamp(severity * 0.5 + priority * 0.3 + recency * 0.2);
}

export function scoreRecommendation(reco: {
  createdAt: Date;
  insight?: { priorityScore?: number | null } | null;
}) {
  const priority = reco.insight?.priorityScore ?? 0.45;
  const recency = recencyScore(reco.createdAt, 21);
  return clamp(priority * 0.7 + recency * 0.3);
}
