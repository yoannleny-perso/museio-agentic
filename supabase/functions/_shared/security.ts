const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "capacitor://localhost",
  "ionic://localhost",
  "https://museioapp.com",
  "https://www.museioapp.com",
  "https://app.museioapp.com",
];

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const normalizeOrigin = (value: string | null | undefined): string | null => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const splitEnvOrigins = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter((entry): entry is string => Boolean(entry));

export const getAllowedOrigins = (): string[] => {
  const configured = new Set<string>([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...splitEnvOrigins(Deno.env.get("APP_URL")),
    ...splitEnvOrigins(Deno.env.get("PUBLIC_APP_URL")),
    ...splitEnvOrigins(Deno.env.get("SITE_URL")),
    ...splitEnvOrigins(Deno.env.get("ALLOWED_WEB_ORIGINS")),
  ]);

  return Array.from(configured);
};

export const isAllowedOrigin = (
  origin: string | null | undefined
): origin is string => {
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  return getAllowedOrigins().includes(normalized);
};

export const buildCorsHeaders = (
  req: Request,
  methods = "POST, OPTIONS"
): Record<string, string> => {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
  };

  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
};

export const escapeHtml = (value: string | null | undefined): string => {
  if (!value) return "";

  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

export const sanitizeEmailAddress = (value: string | null | undefined): string =>
  escapeHtml((value ?? "").trim());

export const isAllowedRedirectUrl = (value: string | null | undefined): boolean => {
  if (!value) return false;

  try {
    const target = new URL(value);
    return isAllowedOrigin(target.origin);
  } catch {
    return false;
  }
};

export const getClientIpAddress = (req: Request): string | null => {
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  ];

  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

export const sha256Hex = async (
  value: string,
  salt?: string | null
): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt ?? ""}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const verifyTurnstileToken = async ({
  token,
  remoteIp,
}: {
  token: string;
  remoteIp?: string | null;
}) => {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim();

  if (!secret) {
    return {
      enforced: false,
      success: true,
      errors: [] as string[],
    };
  }

  if (!token.trim()) {
    return {
      enforced: true,
      success: false,
      errors: ["missing-input-response"],
    };
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return {
      enforced: true,
      success: false,
      errors: [`turnstile-http-${response.status}`],
    };
  }

  const result = await response.json() as {
    success?: boolean;
    "error-codes"?: string[];
  };

  return {
    enforced: true,
    success: Boolean(result.success),
    errors: result["error-codes"] ?? [],
  };
};
