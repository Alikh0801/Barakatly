"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  WHY_BARAKATLY_DEFAULT,
  WHY_BARAKATLY_KEY,
} from "@/lib/content/defaults";
import { createClient } from "@/lib/supabase/server";

export type AdminContentActionState = {
  error?: string;
  success?: string;
};

export async function updateWhyBarakatlyContent(
  _prev: AdminContentActionState,
  formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!title) return { error: "Başlıq tələb olunur." };
  if (!body) return { error: "Mətn tələb olunur." };
  if (title.length > 120) return { error: "Başlıq çox uzundur." };
  if (body.length > 500) return { error: "Mətn çox uzundur." };

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: WHY_BARAKATLY_KEY,
      title,
      body,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.updateWhyBarakatlyContent]", error.message);
    // Table may not exist yet before migration is applied.
    if (error.message.toLowerCase().includes("site_content")) {
      return {
        error:
          "site_content cədvəli tapılmadı. Supabase-də 009_site_content.sql işə salın.",
      };
    }
    return { error: "Məzmun yenilənmədi." };
  }

  updateTag("site-content");
  updateTag("why-barakatly");
  revalidatePath("/");
  revalidatePath("/admin/content");

  return { success: "Niyə Barakatly? bölməsi yeniləndi." };
}

export async function resetWhyBarakatlyContent(
  _prev: AdminContentActionState,
  _formData: FormData
): Promise<AdminContentActionState> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("site_content").upsert(
    {
      key: WHY_BARAKATLY_KEY,
      title: WHY_BARAKATLY_DEFAULT.title,
      body: WHY_BARAKATLY_DEFAULT.body,
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("[admin.resetWhyBarakatlyContent]", error.message);
    return { error: "Default məzmun bərpa edilmədi." };
  }

  updateTag("site-content");
  updateTag("why-barakatly");
  revalidatePath("/");
  revalidatePath("/admin/content");

  return { success: "Default məzmun bərpa olundu." };
}
