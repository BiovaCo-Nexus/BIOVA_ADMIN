import { supabase } from "@/integrations/supabase/client";

export const logAdminActivity = async (actionType: string, entityName: string, details: string) => {
  try {
    // Get the current logged-in admin's email
    const { data: { session } } = await supabase.auth.getSession();
    const adminEmail = session?.user?.email || "Unknown Admin";

    const { error } = await supabase.from('admin_activity_logs').insert([
      {
        admin_email: adminEmail,
        action_type: actionType,
        entity_name: entityName,
        details: details
      }
    ]);

    if (error) {
      console.error("Failed to write to admin_activity_logs:", error);
    }
  } catch (err) {
    console.error("Error logging admin activity:", err);
  }
};
