import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { buildCorsHeaders } from "../_shared/security.ts";

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      success: false,
      error:
        "Deprecated endpoint. Direct email relay is disabled pending a hardened internal-only replacement.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
};

serve(handler);
