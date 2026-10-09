import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile(new URL("../legal-jurisdiction-catalog.json", import.meta.url), "utf8"));

test("global jurisdiction catalog is explicit discovery only, not verified legal coverage", () => {
  assert.equal(catalog.policy.default_status, "UNREVIEWED");
  assert.equal(catalog.policy.may_cite_as_current_law, false);
  assert.ok(catalog.jurisdictions.length >= 15);
});

test("every portal candidate uses HTTPS and remains unreviewed", () => {
  for (const jurisdiction of catalog.jurisdictions) {
    assert.ok(jurisdiction.jurisdiction_id);
    assert.ok(jurisdiction.portal_candidates.length > 0);
    for (const portal of jurisdiction.portal_candidates) {
      assert.equal(new URL(portal.url).protocol, "https:");
      assert.equal(portal.status, "UNREVIEWED");
    }
  }
});

test("catalog has no claim of verified sources or current-law coverage", () => {
  assert.match(catalog.purpose, /not a verified law database/i);
  assert.ok(catalog.policy.promotion_requirements.length >= 5);
});
