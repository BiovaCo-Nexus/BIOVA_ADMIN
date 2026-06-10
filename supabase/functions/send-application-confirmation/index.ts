
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationConfirmationRequest {
  email: string;
  name: string;
  role?: string;
  applicationId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role, applicationId }: ApplicationConfirmationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "ElectroCulture <onboarding@resend.dev>",
      to: [email],
      subject: "Application Confirmation - ElectroCulture",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAFAF0;">
          <div style="background-color: #E6F2E6; padding: 30px; border-radius: 10px; text-align: center; border: 2px solid #22C55E;">
            <h1 style="color: #222222; margin-bottom: 20px;">Application Received Successfully!</h1>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #22C55E;">
              <h2 style="color: #22C55E; margin-bottom: 15px;">Application Details</h2>
              <p style="color: #444444; margin: 10px 0;"><strong>Name:</strong> ${name}</p>
              <p style="color: #444444; margin: 10px 0;"><strong>Position:</strong> ${role || 'Not specified'}</p>
              ${applicationId ? `
                <div style="background-color: #F0FDF4; padding: 15px; border-radius: 6px; margin: 15px 0;">
                  <p style="color: #222222; margin: 5px 0; font-size: 14px;"><strong>Your Application ID:</strong></p>
                  <p style="color: #16A34A; font-size: 18px; font-weight: bold; font-family: monospace; margin: 5px 0;">${applicationId}</p>
                  <p style="color: #666666; font-size: 12px; margin: 5px 0;">Save this ID to track your application status</p>
                </div>
              ` : ''}
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
              <h3 style="color: #222222; margin-bottom: 15px;">What's Next?</h3>
              <ul style="color: #444444; line-height: 1.6;">
                <li>Your application is now in our review queue</li>
                <li>Our team will carefully review your qualifications</li>
                <li>You can track your application status using your Application ID</li>
                <li>We'll contact you within 1-2 weeks with updates</li>
                <li>If selected, we'll reach out to schedule an interview</li>
              </ul>
            </div>
            
            <div style="margin: 30px 0;">
              <p style="color: #444444; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in joining ElectroCulture. We're excited about the possibility of working together to revolutionize sustainable agriculture.
              </p>
            </div>
            
            <div style="border-top: 1px solid #22C55E; padding-top: 20px; margin-top: 30px;">
              <p style="color: #666666; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #222222;">The ElectroCulture Team</strong><br>
                Growing the future sustainably
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #888888; font-size: 12px;">
              This is an automated confirmation email. Please do not reply to this message.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Application confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
