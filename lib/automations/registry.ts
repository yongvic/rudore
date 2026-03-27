export type AutomationTriggerDefinition = {
  type: string;
  label: string;
  defaultConfig: Record<string, unknown>;
};

export type AutomationActionDefinition = {
  type: string;
  label: string;
  defaultConfig: Record<string, unknown>;
};

export const triggerRegistry: AutomationTriggerDefinition[] = [
  {
    type: "insight.created",
    label: "Nouveau signal IA",
    defaultConfig: { insightTypes: ["MARKET", "COMPETITOR", "TREND", "RISK"] },
  },
  {
    type: "alert.created",
    label: "Nouvelle alerte",
    defaultConfig: { severities: ["HIGH", "CRITICAL"] },
  },
  {
    type: "alert.critical",
    label: "Alerte critique",
    defaultConfig: { severity: "CRITICAL" },
  },
  {
    type: "metric.threshold",
    label: "Seuil KPI",
    defaultConfig: { metric: "MRR", operator: ">", value: 100000 },
  },
  {
    type: "schedule.weekly",
    label: "Récurrence hebdo",
    defaultConfig: { day: "Lundi", time: "07:00" },
  },
  {
    type: "schedule.daily",
    label: "Récurrence quotidienne",
    defaultConfig: { time: "07:30" },
  },
];

export const actionRegistry: AutomationActionDefinition[] = [
  {
    type: "create.insight",
    label: "Créer un insight",
    defaultConfig: { type: "MARKET" },
  },
  {
    type: "create.alert",
    label: "Créer une alerte",
    defaultConfig: { severity: "HIGH" },
  },
  {
    type: "create.recommendation",
    label: "Créer une recommandation",
    defaultConfig: { action: "Analyser" },
  },
  {
    type: "notify.slack",
    label: "Notifier une équipe",
    defaultConfig: { channel: "#ops", messageTemplate: "Résumé auto" },
  },
  {
    type: "create.brief",
    label: "Générer un brief",
    defaultConfig: { template: "Synthèse exécution", owner: "Ops" },
  },
  {
    type: "escalate.alert",
    label: "Escalader une alerte",
    defaultConfig: { to: "Managing Partner", channel: "Email" },
  },
  {
    type: "generate.content",
    label: "Générer contenu",
    defaultConfig: { startup: "speedmaker", channel: "LinkedIn" },
  },
  {
    type: "match.talent",
    label: "Matcher talents",
    defaultConfig: { focus: "LPT" },
  },
  {
    type: "run.workflows",
    label: "Exécuter les workflows",
    defaultConfig: { scope: "due" },
  },
];

export function getTriggerLabel(type: string) {
  return triggerRegistry.find((item) => item.type === type)?.label ?? type;
}

export function getActionLabel(type: string) {
  return actionRegistry.find((item) => item.type === type)?.label ?? type;
}
