export type SocialLinks = {
    instagram_url: string | null
    youtube_url: string | null
    linkedin_url: string | null
    updated_at?: string
  }
  
  /**
   * Fetch the singleton row with social links.
   * Pass your Supabase client (from src/integrations/supabase/client).
   */
  export async function getSocialLinks<TClient extends { from: any }>(supabase: TClient) {
    const { data, error } = await (supabase as any)
      .from("social_links")
      .select("instagram_url, youtube_url, linkedin_url, updated_at")
      .limit(1)
      .maybeSingle()
  
    if (error) {
      console.log("[v0] getSocialLinks error:", error.message)
      return { data: null as SocialLinks | null, error }
    }
  
    return { data: (data as SocialLinks) ?? null, error: null }
  }
  
  /**
   * Upsert the singleton row.
   * Requires an authenticated user per RLS policy.
   */
  export async function upsertSocialLinks<TClient extends { from: any }>(supabase: TClient, links: Partial<SocialLinks>) {
    const payload = {
      is_singleton: true,
      instagram_url: links.instagram_url ?? null,
      youtube_url: links.youtube_url ?? null,
      linkedin_url: links.linkedin_url ?? null,
    }
  
    const { data, error } = await (supabase as any)
      .from("social_links")
      .upsert(payload, { onConflict: "is_singleton" })
      .select("instagram_url, youtube_url, linkedin_url, updated_at")
      .maybeSingle()
  
    if (error) {
      console.log("[v0] upsertSocialLinks error:", error.message)
      return { data: null as SocialLinks | null, error }
    }
  
    return { data: (data as SocialLinks) ?? null, error: null }
  }
  
  /* USAGE EXAMPLES:
  
  // 1) In Admin page (save):
  import { supabase } from '../integrations/supabase/client'
  import { upsertSocialLinks } from '../integrations/supabase/social-links'
  
  const { data, error } = await upsertSocialLinks(supabase, {
    instagram_url: form.instagram,
    youtube_url: form.youtube,
    linkedin_url: form.linkedin,
  })
  
  // 2) In Home page (read):
  import { supabase } from '../integrations/supabase/client'
  import { getSocialLinks } from '../integrations/supabase/social-links'
  
  const { data } = await getSocialLinks(supabase)
  // data?.instagram_url, data?.youtube_url, data?.linkedin_url
  
  */
  