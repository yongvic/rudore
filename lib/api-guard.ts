type RateLimitConfig = {
  limit?: number;
  windowMs?: number;
  keyPrefix?: string;
};

type GuardOptions = {
  requireAuth?: boolean;
  allowSameOrigin?: boolean;
  rateLimit?: RateLimitConfig;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

const parseIntWithFallback = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const DEFAULT_LIMIT = parseIntWithFallback(process.env.API_RATE_LIMIT, 60);
const DEFAULT_WINDOW_MS = parseIntWithFallback(
  process.env.API_RATE_LIMIT_WINDOW_MS,
  60_000
);

const DEFAULT_ORIGINS = [
  process.env.NEXTAUTH_URL,
  process.env.APP_URL,
].filter(Boolean) as string[];

const originFromUrl = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const allowedOrigins = DEFAULT_ORIGINS.map(originFromUrl).filter(
  (origin): origin is string => Boolean(origin)
);

const getClientIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? forwarded;
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const maybeIp = (request as { ip?: string }).ip;
  if (maybeIp) return maybeIp;
  return "unknown";
};

const isSameOrigin = (request: Request) => {
  if (allowedOrigins.length === 0) return false;
  const originHeader = request.headers.get("origin");
  if (originHeader && allowedOrigins.includes(originHeader)) return true;
  const referer = request.headers.get("referer");
  const refererOrigin = referer ? originFromUrl(referer) : null;
  return Boolean(refererOrigin && allowedOrigins.includes(refererOrigin));
};

const enforceRateLimit = (request: Request, config?: RateLimitConfig) => {
  const limit = config?.limit ?? DEFAULT_LIMIT;
  const windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;
  if (!Number.isFinite(limit) || limit <= 0 || !Number.isFinite(windowMs)) {
    return null;
  }

  const url = new URL(request.url);
  const keyPrefix = config?.keyPrefix ?? "api";
  const key = `${keyPrefix}:${request.method}:${url.pathname}:${getClientIp(
    request
  )}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
  } else if (current.count + 1 > limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  } else {
    current.count += 1;
  }

  if (rateLimitStore.size > 2000) {
    for (const [entryKey, entry] of rateLimitStore) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(entryKey);
      }
    }
  }

  return null;
};

const enforceAuth = (request: Request, allowSameOrigin: boolean) => {
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token) return null;

  if (allowSameOrigin && isSameOrigin(request)) {
    return null;
  }

  const header =
    request.headers.get("authorization") ??
    request.headers.get("x-api-token") ??
    request.headers.get("x-rudore-token");
  const candidate = header?.startsWith("Bearer ")
    ? header.slice(7).trim()
    : header?.trim();

  if (candidate !== token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
};

export const guardApi = (
  request: Request,
  options: GuardOptions = {}
) => {
  if (options.requireAuth) {
    const authResult = enforceAuth(
      request,
      options.allowSameOrigin ?? true
    );
    if (authResult) return authResult;
  }

  if (options.rateLimit) {
    const rateResult = enforceRateLimit(request, options.rateLimit);
    if (rateResult) return rateResult;
  }

  return null;
};
