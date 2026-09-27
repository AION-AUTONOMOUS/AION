import test from 'node:test';
import assert from 'node:assert/strict';
import { liveSpaceHealth,listLiveSpaceServices,getLiveSpaceService } from '../config/aion-live-space.js';

test('AION live space layer uses real providers',()=>{
 const h=liveSpaceHealth(); assert.equal(h.status,'live-service'); assert.equal(h.realProviders,true);
 assert.equal(getLiveSpaceService('space-weather').provider,'NOAA SWPC');
 assert.equal(getLiveSpaceService('eo-discovery').provider,'Copernicus Data Space + NASA GIBS');
 assert.ok(listLiveSpaceServices().every(x=>x.priceAion>0));
});
