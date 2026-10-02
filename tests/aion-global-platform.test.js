import test from "node:test";
import assert from "node:assert/strict";
import { AION_GLOBAL_PLATFORM, platformHealth, getProduct } from "../config/aion-global-platform.js";
test("platform has 16 products",()=>{assert.equal(AION_GLOBAL_PLATFORM.products.length,16);assert.equal(platformHealth().productCount,16);assert.equal(getProduct("alwakend").name,"ALWAKEND");});
test("AION owns administration and sensitive actions remain gated",()=>{const h=platformHealth();assert.equal(h.owner,"AION AUTONOMOUS");assert.equal(h.governance.administrativeOwner,"AION AUTONOMOUS");assert.equal(h.governance.sensitiveFinancialActionsRequireApproval,true);assert.equal(h.governance.politicalTargetingBlocked,true);});
test("execution loop is complete",()=>assert.deepEqual(platformHealth().executionLoop,["connect","understand","simulate","decide","act","verify","learn"]));