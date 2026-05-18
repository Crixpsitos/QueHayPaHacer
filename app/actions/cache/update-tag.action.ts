"use server";

import { updateTag } from "next/cache";

interface UpdateTagActionResult {
  error?: string;
}

export async function updateTagAction(
  tag: string,
): Promise<UpdateTagActionResult | void> {
  const normalizedTag = tag.trim();

  if (!normalizedTag) {
    return {
      error: "El tag es obligatorio para invalidar la cache.",
    };
  }

  updateTag(normalizedTag);
}