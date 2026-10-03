# AION Space — Sentinel Hub Real-Data Integration

AION Space now has a real Copernicus Data Space / Sentinel Hub adapter for Sentinel-2 L2A and Sentinel-1 GRD.

## Runtime contract

- No mock success is returned.
- Without credentials the provider reports `authorization-gated`.
- With valid credentials, catalog and Process API calls use the live Copernicus endpoints.
- Process API image responses are handled as binary PNG data, not JSON.
- The adapter supports both `sentinel-2-l2a` and `sentinel-1-grd`.

## Required Railway variables

Set these privately on the AION Railway service:

```
SENTINEL_HUB_CLIENT_ID=<private OAuth client id>
SENTINEL_HUB_CLIENT_SECRET=<private OAuth client secret>
```

Do not commit these values and do not place them in frontend code.

## API

Health:
```
GET /api/space-sentinel?path=health
```

Catalog:
```
POST /api/space-sentinel?path=catalog
Content-Type: application/json

{
  "bbox": [6.1, 46.1, 6.3, 46.3],
  "from": "2026-09-01T00:00:00Z",
  "to": "2026-09-03T00:00:00Z",
  "collection": "sentinel-2-l2a",
  "limit": 5
}
```

Image:
```
POST /api/space-sentinel?path=process
Content-Type: application/json

{
  "bbox": [6.1, 46.1, 6.3, 46.3],
  "from": "2026-09-01T00:00:00Z",
  "to": "2026-09-03T00:00:00Z",
  "collection": "sentinel-2-l2a",
  "width": 1024,
  "height": 1024
}
```

For Sentinel-1 use `"collection": "sentinel-1-grd"`.

Mission:
```
POST /api/space-sentinel?path=mission
```

The mission endpoint first queries the catalog and then downloads the processed PNG. The response is the actual image bytes.

## CLI

After setting credentials and the three mission inputs:

```
AION_SENTINEL_BBOX=6.1,46.1,6.3,46.3 \
AION_SENTINEL_FROM=2026-09-01T00:00:00Z \
AION_SENTINEL_TO=2026-09-03T00:00:00Z \
AION_SENTINEL_COLLECTION=sentinel-2-l2a \
node scripts/run-sentinel.js
```

The CLI writes the received PNG to `artifacts/sentinel/`. This local filesystem output is not claimed to be durable Railway storage.

## Source

Copernicus Data Space Sentinel Hub APIs:
- Catalog API
- Process API
- Sentinel-1 GRD documentation

The AION adapter remains a service consumer and does not claim ownership of any satellite.
