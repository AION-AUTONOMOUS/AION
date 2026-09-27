import test from 'node:test';
import assert from 'node:assert/strict';
import { customerRevenueHealth, listOffers } from '../config/aion-customer-revenue.js';
test('customer revenue engine only recognizes confirmed payments',()=>{const h=customerRevenueHealth();assert.equal(h.status,'customer-ready');assert.equal(h.revenueRecognition,'payment-confirmed-only');assert.equal(h.noFakeRevenue,true);assert.equal(listOffers().length,4);});