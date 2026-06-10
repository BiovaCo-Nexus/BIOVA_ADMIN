
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc2626;">Invalid confirmation link</h2>
          <p>The confirmation token is missing.</p>
        </body></html>`,
        {
          status: 400,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    console.log('Confirming subscription with token:', token);

    // Find and update the subscription
    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (findError || !subscription) {
      console.error('Error finding subscription:', findError);
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc2626;">Invalid confirmation link</h2>
          <p>The confirmation token is invalid or has expired.</p>
        </body></html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    if (subscription.confirmed) {
      return new Response(
        `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #16a34a;">Already Confirmed!</h2>
          <p>Your subscription has already been confirmed.</p>
          <p>Thank you for subscribing to ElectroCulture newsletter!</p>
        </body></html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    // Update subscription to confirmed
    const { error: updateError } = await supabase
      .from('newsletter_subscriptions')
      .update({ 
        confirmed: true,
        confirmation_token: null 
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error confirming subscription:', updateError);
      throw updateError;
    }

    console.log('Subscription confirmed successfully for:', subscription.email);

    return new Response(
      `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #16a34a;">Subscription Confirmed!</h2>
        <p>Thank you for confirming your subscription to the ElectroCulture newsletter!</p>
        <p>You'll receive updates about our launch on August 22nd, 2025.</p>
        <a href="/" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          Return to ElectroCulture
        </a>
      </body></html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  } catch (error: any) {
    console.error("Error in newsletter-confirm function:", error);
    return new Response(
      `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h2 style="color: #dc2626;">Error</h2>
        <p>There was an error confirming your subscription. Please try again.</p>
      </body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
};

serve(handler);
