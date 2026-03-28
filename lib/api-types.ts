export type DashboardKpi = {
  label: string;
  value: string;
  delta: string;
};

export type DashboardAlert = {
  title: string;
  detail: string;
  tone: "warning" | "danger" | "info";
  label: string;
};

export type DashboardInsight = {
  title: string;
  summary: string;
  confidence: string;
};

export type DashboardWatchItem = {
  name: string;
  note: string;
  status: string;
};

export type DashboardMarketSignal = {
  title: string;
  summary: string;
  tag: string;
};

export type DashboardExecution = {
  title: string;
  detail: string;
  status: string;
  tone: "success" | "warning" | "info";
};

export type DashboardResponse = {
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
  insights: DashboardInsight[];
  watchlist: DashboardWatchItem[];
  marketSignals: DashboardMarketSignal[];
  execution: DashboardExecution[];
};

export type StartupHealth = {
  tone: "warning" | "success" | "info" | "danger";
  label: string;
};

export type StartupListItem = {
  id: string;
  name: string;
  sector: string;
  stage: string;
  focus: string;
  health: StartupHealth;
};

export type StartupsResponse = {
  startups: StartupListItem[];
};

export type StartupMetric = {
  label: string;
  value: string;
  delta: string;
};

export type StartupTimelineItem = {
  title: string;
  date: string;
  detail: string;
};

export type StartupRecommendation = {
  title: string;
  detail: string;
};

export type StartupIntelligenceItem = {
  title: string;
  detail: string;
  tag: string;
};

export type StartupDetailResponse = {
  name: string;
  sector: string;
  stage: string;
  description: string;
  metrics: StartupMetric[];
  timeline: StartupTimelineItem[];
  recommendations: StartupRecommendation[];
  intelligence: StartupIntelligenceItem[];
};

export type IntelligenceFilter = {
  label: string;
  active?: boolean;
};

export type IntelligenceFeedItem = {
  title: string;
  summary: string;
  source: string;
  score: string;
  tag: string;
};

export type IntelligenceResponse = {
  feed: IntelligenceFeedItem[];
  filters: IntelligenceFilter[];
};

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantContextItem = {
  label: string;
  value: string;
};

export type AssistantResponse = {
  conversation: AssistantMessage[];
  context: AssistantContextItem[];
  suggestions: string[];
};

export type AutomationWorkflowItem = {
  id?: string;
  name: string;
  trigger: string;
  action: string;
  status: string;
  lastRun?: string;
  workflowType?: string | null;
};

export type AutomationHistoryItem = {
  id?: string;
  title: string;
  detail: string;
  time: string;
  status?: string;
  durationMs?: number | null;
  error?: string | null;
};

export type AutomationsResponse = {
  workflows: AutomationWorkflowItem[];
  history: AutomationHistoryItem[];
};

export type AutomationTrigger = {
  id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
};

export type AutomationAction = {
  id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
};

export type AutomationWorkflowDetail = {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  lastRunAt: string | null;
  nextRunAt: string | null;
  workflowType?: string | null;
  priority?: number;
  maxRetries?: number;
  retryBackoffSeconds?: number;
};

export type EcosystemNodeItem = {
  id: string;
  label: string;
  x: string;
  y: string;
};

export type EcosystemRelationItem = {
  title: string;
  detail: string;
};

export type EcosystemResponse = {
  nodes: EcosystemNodeItem[];
  relations: EcosystemRelationItem[];
  stats: {
    nodeCount: number;
    relationCount: number;
    avgStrength: number;
  };
  suggestions: {
    title: string;
    detail: string;
    tags?: string[];
    type: "synergy" | "talent" | "opportunity";
  }[];
  summary: string;
};

export type SettingsItem = {
  title: string;
  detail: string;
};

export type SettingsResponse = {
  settings: SettingsItem[];
};

export type AiScoringConfig = {
  impactKeywords: string[];
  urgencyKeywords: string[];
  slowdownKeywords: string[];
  sectorBoosts: Record<string, string[]>;
  typeBoosts: Record<string, number>;
};

export type AiSettingsResponse = {
  config: AiScoringConfig;
  updatedAt: string | null;
};
