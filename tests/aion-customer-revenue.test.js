import test from 'node:test';
import assert from 'node:assert/strict';
import { customerRevenueHealth, getOffer, listOffers } from '../config/aion-customer-revenue.js';
test('customer revenue engine requires confirmed payment and delivery evidence',()=>{const h=customerRevenueHealth();assert.equal(h.status,'integration-foundation');assert.equal(h.revenueRecognition,'payment-and-delivery-evidence-required');assert.equal(h.noFakeRevenue,true);assert.equal(h.realDataBacked,false);assert.match(h.paymentIntegration,/Sandbox flow not yet tested/);assert.ok(h.offers>0);assert.equal(listOffers().length,h.offers);});



test('finance-adjacent offers remain visible but cannot be checked out pending review', () => {
  const offers = listOffers();
  for (const id of ['investment-report', 'portfolio-analysis', 'investment-consulting']) {
    const listed = offers.find(offer => offer.id === id);
    assert.ok(listed, id + ' should remain visible in the catalogue');
    assert.equal(listed.checkoutEnabled, false);
    assert.equal(listed.status, 'pending-regulatory-review');
    assert.equal(getOffer(id), null, id + ' must not be accepted for order creation');
  }

  const ordinaryDigitalService = offers.find(offer => offer.id === 'article-500');
  assert.equal(ordinaryDigitalService.checkoutEnabled, true);
  assert.equal(ordinaryDigitalService.status, 'available');
  assert.ok(getOffer('article-500'));
});
