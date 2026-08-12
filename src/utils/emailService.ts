import { supabase } from "@/integrations/supabase/client";
import { logAdminActivity } from "./adminLogger";

export interface EmailSettingsConfig {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  smtpServer: string;
  smtpPort: string;
  dailyQuota: number;
  sentToday: number;
  lastUpdated?: string;
}

export interface BrevoAccountInfo {
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  plan?: Array<{
    type: string;
    credits: number;
  }>;
  relays?: {
    enabled: boolean;
    data: {
      user: string;
      port: number;
      relay: string;
    };
  };
}

const STORAGE_KEYS = {
  API_KEY: "biovaco_brevo_api_key",
  SENDER_NAME: "biovaco_email_sender_name",
  SENDER_EMAIL: "biovaco_email_sender_email",
  SMTP_SERVER: "biovaco_smtp_server",
  SMTP_PORT: "biovaco_smtp_port",
  DAILY_QUOTA: "biovaco_daily_quota",
  SENT_TODAY_PREFIX: "biovaco_sent_today_",
};

/**
 * Gets today's date formatted as YYYY-MM-DD for quota tracking
 */
export function getTodayKey(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Retrieves the current Email & Brevo settings from localStorage or defaults
 */
export function getEmailConfig(): EmailSettingsConfig {
  const envKey = import.meta.env.VITE_BREVO_API_KEY || "";
  const storedKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
  const apiKey = storedKey !== null ? storedKey : envKey;

  const senderName = localStorage.getItem(STORAGE_KEYS.SENDER_NAME) || "BiovaCo HR & Executive";
  const senderEmail = localStorage.getItem(STORAGE_KEYS.SENDER_EMAIL) || "noreply@biovaco.in";
  const smtpServer = localStorage.getItem(STORAGE_KEYS.SMTP_SERVER) || "smtp-relay.brevo.com";
  const smtpPort = localStorage.getItem(STORAGE_KEYS.SMTP_PORT) || "587";
  
  const storedQuota = localStorage.getItem(STORAGE_KEYS.DAILY_QUOTA);
  const dailyQuota = storedQuota ? parseInt(storedQuota, 10) : 300;

  const todayKey = getTodayKey();
  const storedSent = localStorage.getItem(STORAGE_KEYS.SENT_TODAY_PREFIX + todayKey);
  const sentToday = storedSent !== null ? parseInt(storedSent, 10) : 0; // Default to 0 for real live counter

  return {
    apiKey,
    senderName,
    senderEmail,
    smtpServer,
    smtpPort,
    dailyQuota,
    sentToday,
  };
}

/**
 * Saves modified email configuration to localStorage and dispatches an event
 */
export function saveEmailConfig(config: Partial<EmailSettingsConfig>): EmailSettingsConfig {
  if (config.apiKey !== undefined) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey.trim());
  }
  if (config.senderName !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SENDER_NAME, config.senderName.trim());
  }
  if (config.senderEmail !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SENDER_EMAIL, config.senderEmail.trim());
  }
  if (config.smtpServer !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SMTP_SERVER, config.smtpServer.trim());
  }
  if (config.smtpPort !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SMTP_PORT, config.smtpPort.trim());
  }
  if (config.dailyQuota !== undefined) {
    localStorage.setItem(STORAGE_KEYS.DAILY_QUOTA, config.dailyQuota.toString());
  }
  if (config.sentToday !== undefined) {
    const todayKey = getTodayKey();
    localStorage.setItem(STORAGE_KEYS.SENT_TODAY_PREFIX + todayKey, config.sentToday.toString());
  }

  const updated = getEmailConfig();

  // Notify components of updated email settings
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("email-settings-updated", { detail: updated }));
  }

  return updated;
}

/**
 * Increments the daily sent email counter
 */
export function incrementSentCount(count: number = 1): number {
  const current = getEmailConfig();
  const newCount = current.sentToday + count;
  saveEmailConfig({ sentToday: newCount });
  return newCount;
}

/**
 * Fetches real live stats and credits directly from Brevo REST API / Database
 */
export async function fetchRealBrevoStats(customApiKey?: string): Promise<{
  success: boolean;
  sentToday: number;
  dailyQuota: number;
  accountEmail?: string;
  source: "brevo_live_api" | "database" | "local";
  error?: string;
}> {
  const config = getEmailConfig();
  const apiKey = customApiKey?.trim() || config.apiKey.trim();
  const todayStr = getTodayKey();

  if (apiKey) {
    try {
      // 1. Query Brevo API for today's aggregated email reports
      const reportRes = await fetch(
        `https://api.brevo.com/v3/smtp/statistics/reports?startDate=${todayStr}&endDate=${todayStr}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            "api-key": apiKey,
          },
        }
      );

      // 2. Query Brevo Account details for plan & daily credits
      const accountRes = await fetch("https://api.brevo.com/v3/account", {
        method: "GET",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
        },
      });

      if (reportRes.ok && accountRes.ok) {
        const reportData = await reportRes.json();
        const accountData = await accountRes.json();

        let realSent = 0;
        if (reportData.reports && Array.isArray(reportData.reports)) {
          realSent = reportData.reports.reduce(
            (sum: number, r: any) => sum + (r.requests || r.delivered || 0),
            0
          );
        }

        let realQuota = 300;
        if (accountData.plan && Array.isArray(accountData.plan)) {
          const sendPlan = accountData.plan.find((p: any) => p.credits !== undefined);
          if (sendPlan && sendPlan.credits) {
            realQuota = sendPlan.credits;
          }
        }

        saveEmailConfig({
          sentToday: realSent,
          dailyQuota: realQuota,
        });

        return {
          success: true,
          sentToday: realSent,
          dailyQuota: realQuota,
          accountEmail: accountData.email,
          source: "brevo_live_api",
        };
      }
    } catch (err: any) {
      console.warn("Failed fetching live stats from Brevo API:", err?.message || err);
    }
  }

  // Fallback 1: Query Supabase activity log for real dispatches today
  try {
    const { data, error } = await supabase
      .from("admin_activity_logs")
      .select("id")
      .gte("created_at", `${todayStr}T00:00:00.000Z`)
      .or("action_type.eq.EMAIL_DISPATCHED,action_type.eq.BULK_EMAIL_SENT");

    if (!error && data) {
      const dbSent = data.length;
      saveEmailConfig({ sentToday: dbSent });
      return {
        success: true,
        sentToday: dbSent,
        dailyQuota: config.dailyQuota || 300,
        source: "database",
      };
    }
  } catch (dbErr) {
    console.warn("Database log query failed:", dbErr);
  }

  // Fallback 2: Local Storage real counter
  const storedSent = localStorage.getItem(STORAGE_KEYS.SENT_TODAY_PREFIX + todayStr);
  const currentSent = storedSent !== null ? parseInt(storedSent, 10) : 0;

  return {
    success: true,
    sentToday: currentSent,
    dailyQuota: config.dailyQuota || 300,
    source: "local",
  };
}

/**
 * Verifies Brevo API key connection and retrieves account details
 */
export async function verifyBrevoAccount(customApiKey?: string): Promise<{
  success: boolean;
  accountInfo?: BrevoAccountInfo;
  error?: string;
}> {
  const config = getEmailConfig();
  const apiKey = customApiKey?.trim() || config.apiKey.trim();

  if (!apiKey) {
    return {
      success: false,
      error: "Brevo API Key is missing. Please provide a valid key.",
    };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      return {
        success: false,
        error: errData?.message || `Brevo API connection failed (HTTP ${res.status})`,
      };
    }

    const accountInfo: BrevoAccountInfo = await res.json();
    return {
      success: true,
      accountInfo,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error while reaching Brevo API servers.",
    };
  }
}

/**
 * Dispatches transactional email via Brevo REST API v3
 */
export async function sendEmailViaBrevo(params: {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  senderName?: string;
  senderEmail?: string;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getEmailConfig();
  const apiKey = config.apiKey.trim();

  if (!apiKey) {
    throw new Error("VITE_BREVO_API_KEY is not configured. Please add your Brevo API key in Email Settings.");
  }

  const sender = {
    name: params.senderName || config.senderName,
    email: params.senderEmail || config.senderEmail,
  };

  const payload: any = {
    sender,
    to: params.to,
    subject: params.subject,
    htmlContent: params.htmlContent,
  };

  if (params.cc && params.cc.length > 0) payload.cc = params.cc;
  if (params.bcc && params.bcc.length > 0) payload.bcc = params.bcc;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.message || `Brevo SMTP dispatch error (HTTP ${res.status})`);
  }

  const resData = await res.json().catch(() => ({}));
  
  // Increment sent today count in real-time
  incrementSentCount(params.to.length);

  logAdminActivity(
    "EMAIL_DISPATCHED",
    `Dispatched ${params.to.length} email(s) via Brevo API`,
    `Subject: ${params.subject} | Recipient: ${params.to[0]?.email}`
  );

  return {
    success: true,
    messageId: resData.messageId || `msg_${Date.now()}`,
  };
}
