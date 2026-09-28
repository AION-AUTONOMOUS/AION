import crypto from "node:crypto";

const PLATFORMS = [
  { id: "x", name: "X", env: "AION_SOCIAL_X_ACCESS_TOKEN" },
  { id: "linkedin", name: "LinkedIn", env: "AION_SOCIAL_LINKEDIN_ACCESS_TOKEN" },
  { id: "facebook", name: "Facebook", env: "AION_SOCIAL_FACEBOOK_ACCESS_TOKEN" },
  { id: "instagram", name: "Instagram", env: "AION_SOCIAL_INSTAGRAM_ACCESS_TOKEN" },
  { id: "youtube", name: "YouTube", env: "AION_SOCIAL_YOUTUBE_ACCESS_TOKEN" },
  { id: "tiktok", name: "TikTok", env: "AION_SOCIAL_TIKTOK_ACCESS_TOKEN" },
  { id: "telegram", name: "Telegram", env: "AION_SOCIAL_TELEGRAM_BOT_TOKEN" },
  { id: "discord", name: "Discord", env: "AION_SOCIAL_DISCORD_BOT_TOKEN" }
];

const configured = platform => Boolean(process.env[platform.env]);

export function listSocialPlatforms() {
  return PLATFORMS.map(platform => ({
    id: platform.id,
    name: platform.name,
    connected: configured(platform),
    status: configured(platform) ? "connected" : "awaiting_oauth_or_credentials",
    execution: "official-api-only"
  }));
}

export function createSocialJob(input = {}) {
  const platform = PLATFORMS.find(item => item.id === input.platform);
  if (!platform) throw new Error("unsupported social platform");
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) throw new Error("text required");
  if (text.length > 10000) throw new Error("text too long");

  return {
    id: "social_" + crypto.randomUUID(),
    platform: platform.id,
    action: input.action || "publish",
    text,
    status: configured(platform) ? "queued" : "blocked_not_connected",
    createdAt: new Date().toISOString(),
    policy: {
      officialApiOnly: true,
      noCredentialInCode: true,
      noImpersonation: true,
      humanApprovalForSensitiveActions: true
    }
  };
}

export async function executeSocialJob(job) {
  if (job.status === "blocked_not_connected") {
    return {
      ...job,
      status: "blocked_not_connected",
      error: "Official account connection is not configured for this platform"
    };
  }
  return {
    ...job,
    status: "ready_for_worker_executor",
    note: "Provider-specific publish adapter must be enabled before external posting."
  };
}
