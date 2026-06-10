
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscribeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SubscribeRequest = await req.json();

    console.log('Newsletter subscription request for:', email);

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkError);
      throw checkError;
    }

    if (existing) {
      return new Response(
        JSON.stringify({ 
          message: "Thank you for subscribing! You're already on our list. You can unsubscribe anytime if you want.",
          already_subscribed: true 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create new subscription - directly confirmed, no email confirmation needed
    const { data: subscription, error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert([{ 
        email,
        confirmed: true,
        confirmation_token: null
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating subscription:', insertError);
      throw insertError;
    }

    console.log('Created subscription:', subscription);

    // Try to send thank you email, but don't fail if it doesn't work
    try {
      const emailResponse = await resend.emails.send({
        from: "onboarding@resend.dev", // Using Resend's default verified domain
        to: [email],
        subject: "Thank you for subscribing to ElectroCulture!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #16a34a;">Thank you for subscribing!</h2>
            <p>Welcome to the ElectroCulture newsletter! We're excited to share updates about our launch on August 22nd, 2025.</p>
            <p>You'll receive:</p>
            <ul>
              <li>Product launch updates</li>
              <li>Early access notifications</li>
              <li>Special offers and discounts</li>
            </ul>
            <p>If you ever want to unsubscribe, just reply to any of our emails and we'll take care of it.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Best regards,<br>
              The ElectroCulture Team
            </p>
          </div>
        `,
      });

      console.log("Thank you email sent:", emailResponse);
    } catch (emailError) {
      console.log("Email sending failed, but subscription was successful:", emailError);
      // Don't throw error - subscription is still valid
    }

    return new Response(
      JSON.stringify({ 
        message: "Thank you for subscribing! You'll receive updates about our launch on August 22nd, 2025. You can unsubscribe anytime if you want.",
        subscription_id: subscription.id,
        success: true
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in newsletter-subscribe function:", error);
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
