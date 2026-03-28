export type AiScoringConfig = {
  impactKeywords: string[];
  urgencyKeywords: string[];
  slowdownKeywords: string[];
  sectorBoosts: Record<string, string[]>;
  typeBoosts: Record<string, number>;
};

export const defaultAiConfig: AiScoringConfig = {
  impactKeywords: [
    "levée",
    "financement",
    "régulation",
    "interdiction",
    "taxe",
    "sanction",
    "fusion",
    "acquisition",
    "contrat",
    "subvention",
    "croissance",
    "rupture",
  ],
  urgencyKeywords: [
    "urgent",
    "immédiat",
    "bloqué",
    "crise",
    "amende",
    "incident",
    "pénurie",
    "risque",
    "attaque",
    "suspension",
    "deadline",
  ],
  slowdownKeywords: ["long terme", "progressif", "sur 12 mois", "horizon"],
  sectorBoosts: {
    "Philanthropie & Impact": [
      "don",
      "diaspora",
      "ong",
      "impact",
      "humanitaire",
      "philanthropie",
    ],
    "Media & Content": [
      "media",
      "contenu",
      "startup",
      "tendance",
      "levée",
      "innovation",
    ],
    "Sharing economy": [
      "abonnement",
      "pricing",
      "partage",
      "streaming",
      "saas",
      "usage",
    ],
    "Fintech Paiements": [
      "fintech",
      "ussd",
      "mobile money",
      "paiement",
      "kyc",
      "api",
    ],
    "Formation & Talent": [
      "formation",
      "talent",
      "compétence",
      "recrutement",
      "emploi",
      "bootcamp",
    ],
  },
  typeBoosts: {
    RISK: 0.12,
    MARKET: 0.08,
    COMPETITOR: 0.08,
  },
};

const ensureStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return [...fallback];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const ensureRecordArray = (
  value: unknown,
  fallback: Record<string, string[]>
) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...fallback };
  }
  const entries = Object.entries(value as Record<string, unknown>).map(
    ([key, items]) => [key, ensureStringArray(items, [])]
  );
  return Object.fromEntries(entries);
};

const ensureRecordNumber = (
  value: unknown,
  fallback: Record<string, number>
) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...fallback };
  }
  const entries = Object.entries(value as Record<string, unknown>).map(
    ([key, item]) => [key, typeof item === "number" ? item : Number(item)]
  );
  return Object.fromEntries(entries);
};

export function normalizeAiConfig(raw?: Partial<AiScoringConfig>) {
  return {
    impactKeywords: ensureStringArray(raw?.impactKeywords, defaultAiConfig.impactKeywords),
    urgencyKeywords: ensureStringArray(raw?.urgencyKeywords, defaultAiConfig.urgencyKeywords),
    slowdownKeywords: ensureStringArray(raw?.slowdownKeywords, defaultAiConfig.slowdownKeywords),
    sectorBoosts: ensureRecordArray(raw?.sectorBoosts, defaultAiConfig.sectorBoosts),
    typeBoosts: ensureRecordNumber(raw?.typeBoosts, defaultAiConfig.typeBoosts),
  } as AiScoringConfig;
}
