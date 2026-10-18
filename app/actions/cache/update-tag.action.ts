"use server";

import { updateTag } from "next/cache";

// Endpoint público: solo tags que el cliente puede refrescar legítimamente.
// ponytail: allowlist fija; si crece, mover junto a la definición de cada tag.
const CLIENT_REFRESHABLE_TAGS = new Set(["featured-events"]);

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

  if (!CLIENT_REFRESHABLE_TAGS.has(normalizedTag)) {
    return { error: "Tag no permitido." };
  }

  updateTag(normalizedTag);
}