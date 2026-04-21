
import { getAllowedOrigins } from "../_shared/security.ts";

const defaultOrigin = getAllowedOrigins()[0] ?? "http://localhost:4173";

// CORS headers configuration
export const corsHeaders = {
  "Access-Control-Allow-Origin": defaultOrigin,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};
