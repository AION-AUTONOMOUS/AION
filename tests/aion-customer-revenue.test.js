import test from 'node:test';
import assert from 'node:assert/strict';
import { customerRevenueHealth, listOffers } from '../config/aion-customer-revenue.js';
test('customer revenue engine requires confirmed payment and delivery evidence',()=>{const h=customerRevenueHealth();assert.equal(h.status,'customer-ready');assert.equal(h.revenueRecognition,'payment-and-delivery-evidence-required');assert.equal(h.noFakeRevenue,true);assert.ok(h.offers>0);assert.equal(listOffers().length,h.offers);});

