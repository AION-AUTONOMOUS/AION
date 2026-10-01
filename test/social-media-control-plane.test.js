import test from "node:test";
import assert from "node:assert/strict";
import { createSocialJob, listSocialPlatforms } from "../server-api/social-media.js";

test("social control plane exposes all supported platforms", () => {
  const ids = listSocialPlatforms().map(platform => platform.id);
  assert.deepEqual(ids, ["x","linkedin","facebook","instagram","youtube","tiktok","telegram","discord"]);
});

test("social jobs are blocked until the official account is connected", () => {
  const job = createSocialJob({ platform: "linkedin", text: "AION test" });
  assert.equal(job.status, "blocked_not_connected");
  assert.equal(job.policy.officialApiOnly, true);
  assert.equal(job.policy.noImpersonation, true);
});
