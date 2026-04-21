import { buildCorsHeaders } from "./security.ts";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  [key: string]: unknown;
}

interface ReportErrorOptions {
  status?: number;
  message?: string;
  extra?: LogPayload;
}

export interface FunctionRequestContext {
  functionName: string;
  requestId: string;
  requestMethod: string;
  requestPath: string;
  startedAt: number;
  req: Request;
}

const EXPOSED_HEADERS = "X-Request-Id";

const safeUrlPath = (value: string) => {
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
};

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === "string" ? error : JSON.stringify(error),
  };
};

const writeLog = (level: LogLevel, payload: LogPayload) => {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...payload,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
};

export const createRequestContext = (
  req: Request,
  functionName: string,
  existingRequestId?: string
): FunctionRequestContext => ({
  functionName,
  requestId:
    existingRequestId ||
    req.headers.get("x-request-id")?.trim() ||
    crypto.randomUUID(),
  requestMethod: req.method,
  requestPath: safeUrlPath(req.url),
  startedAt: Date.now(),
  req,
});

export const logEvent = (
  context: FunctionRequestContext,
  level: LogLevel,
  message: string,
  data?: LogPayload
) => {
  writeLog(level, {
    function: context.functionName,
    requestId: context.requestId,
    method: context.requestMethod,
    path: context.requestPath,
    message,
    durationMs: Date.now() - context.startedAt,
    ...(data ?? {}),
  });
};

export const buildFunctionHeaders = (
  context: FunctionRequestContext,
  methods = "POST, OPTIONS",
  extraHeaders?: Record<string, string>
) => ({
  ...buildCorsHeaders(context.req, methods),
  "X-Request-Id": context.requestId,
  "Access-Control-Expose-Headers": EXPOSED_HEADERS,
  ...(extraHeaders ?? {}),
});

export const jsonResponse = (
  context: FunctionRequestContext,
  status: number,
  body: Record<string, unknown>,
  methods = "POST, OPTIONS",
  extraHeaders?: Record<string, string>
) =>
  new Response(
    JSON.stringify({
      requestId: body.requestId ?? context.requestId,
      ...body,
    }),
    {
      status,
      headers: buildFunctionHeaders(context, methods, {
        "Content-Type": "application/json",
        ...(extraHeaders ?? {}),
      }),
    }
  );

export const emptyResponse = (
  context: FunctionRequestContext,
  status = 204,
  methods = "POST, OPTIONS",
  extraHeaders?: Record<string, string>
) =>
  new Response(null, {
    status,
    headers: buildFunctionHeaders(context, methods, extraHeaders),
  });

export const redirectResponse = (
  context: FunctionRequestContext,
  location: string,
  status = 302,
  methods = "GET, OPTIONS",
  extraHeaders?: Record<string, string>
) =>
  new Response(null, {
    status,
    headers: buildFunctionHeaders(context, methods, {
      Location: location,
      ...(extraHeaders ?? {}),
    }),
  });

export const reportFunctionError = async (
  context: FunctionRequestContext,
  error: unknown,
  options?: ReportErrorOptions
) => {
  const serializedError = serializeError(error);

  logEvent(context, "error", options?.message ?? serializedError.message, {
    status: options?.status,
    error: serializedError,
    ...(options?.extra ?? {}),
  });

  const webhookUrl = Deno.env.get("OBSERVABILITY_ALERT_WEBHOOK_URL")?.trim();
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "supabase-edge-function",
        function: context.functionName,
        requestId: context.requestId,
        method: context.requestMethod,
        path: context.requestPath,
        status: options?.status ?? 500,
        message: options?.message ?? serializedError.message,
        error: serializedError,
        durationMs: Date.now() - context.startedAt,
        extra: options?.extra ?? {},
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (webhookError) {
    writeLog("warn", {
      function: context.functionName,
      requestId: context.requestId,
      message: "Failed to deliver observability webhook",
      webhookError: serializeError(webhookError),
    });
  }
};
