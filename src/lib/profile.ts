import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

export const profileInputSchema = z.object({
  business_name: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  ice_number: z.string().trim().max(80).optional().or(z.literal("")),
  logo_url: z.string().trim().url().optional().or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export type UserProfile = {
  id: string;
  business_name: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  ice_number: string | null;
  subscription_status: "trial" | "active" | string;
};

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, business_name, logo_url, phone, address, ice_number, subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function upsertUserProfile(userId: string, input: ProfileInput) {
  const parsed = profileInputSchema.parse(input);

  const payload = {
    id: userId,
    business_name: parsed.business_name || null,
    phone: parsed.phone || null,
    address: parsed.address || null,
    ice_number: parsed.ice_number || null,
    logo_url: parsed.logo_url || null,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id, business_name, logo_url, phone, address, ice_number, subscription_status")
    .single();

  if (error) throw error;
  return data as UserProfile;
}

export async function uploadProfileLogo(userId: string, file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Veuillez sélectionner une image valide.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Le logo doit faire moins de 5MB.");
  }

  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "logo";
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = extension.replace(/[^a-z0-9]/g, "") || "png";
  const uniqueFileName = `${crypto.randomUUID()}-${safeBaseName}.${safeExt}`;
  const path = `${userId}/${uniqueFileName}`;

  const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return data.publicUrl;
}
