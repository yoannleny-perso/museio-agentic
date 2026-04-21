
import { JobConfirmationRequest } from "./types.ts";
import { corsHeaders } from "./cors.ts";

// Validate required fields in the request
export function validateRequestData(requestData: JobConfirmationRequest): { 
  isValid: boolean; 
  missingFields: string[]; 
  response?: Response 
} {
  const missingFields: string[] = [];
  
  if (!requestData) {
    return {
      isValid: false,
      missingFields: ["requestData"],
      response: new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid request format" 
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      )
    };
  }
  
  const { job, artist, action } = requestData;
  
  if (!job) missingFields.push("job");
  else {
    if (!job.id) missingFields.push("job.id");
    if (!job.title) missingFields.push("job.title");
    if (!job.contact_email) missingFields.push("job.contact_email");
    if (!job.total) missingFields.push("job.total");
  }
  
  if (!artist) missingFields.push("artist");
  else {
    if (!artist.name) missingFields.push("artist.name");
    if (!artist.email) missingFields.push("artist.email");
  }
  
  if (!action) missingFields.push("action");
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      missingFields,
      response: new Response(
        JSON.stringify({ 
          success: false,
          error: `Missing required fields in request body: ${missingFields.join(", ")}` 
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      )
    };
  }

  // Additional validation for client email
  if (job && !job.contact_email) {
    return {
      isValid: false,
      missingFields: ["job.contact_email"],
      response: new Response(
        JSON.stringify({ 
          success: false,
          error: "Client email is required" 
        }),
        {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      )
    };
  }
  
  return { isValid: true, missingFields: [] };
}

// Export the function with the expected name for backward compatibility
export function validateJobConfirmationRequest(requestData: JobConfirmationRequest): JobConfirmationRequest {
  const validation = validateRequestData(requestData);
  
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.missingFields.join(", ")}`);
  }
  
  return requestData;
}
