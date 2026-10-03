# AION Sentinel Hub — Live Satellite Integration

AION Space integrates the Copernicus Data Space Ecosystem through Sentinel Hub APIs.

## Live path
AION Space -> OAuth2 client credentials -> Sentinel Hub Catalog/Process APIs -> real Sentinel data -> evidence.

Supported collections:
- `sentinel-2-l2a`: RGB optical imagery with cloud filtering.
- `sentinel-1-grd`: VV/VH radar visualization.

The Process API is handled as binary PNG data. Without valid provider credentials, the adapter fails closed and reports `authorization-gated`; it never returns synthetic satellite data as a successful live result.

## Railway variables
- `SENTINEL_HUB_CLIENT_ID`
- `SENTINEL_HUB_CLIENT_SECRET`

Never commit or log these values.

## API
- `GET /api/space-sentinel?path=health`
- `POST /api/space-sentinel?path=catalog`
- `POST /api/space-sentinel?path=process` -> `image/png`

Example body:
```json
{"bbox":[6.10,46.10,6.30,46.30],"from":"2026-09-20T00:00:00Z","to":"2026-10-03T23:59:59Z","collection":"sentinel-2-l2a","width":1024,"height":1024,"maxCloudCoverage":35}
```

## CLI runner
Set the provider credentials and:
```bash
AION_SENTINEL_BBOX="6.10,46.10,6.30,46.30" AION_SENTINEL_FROM="2026-09-20T00:00:00Z" AION_SENTINEL_TO="2026-10-03T23:59:59Z" node scripts/run-sentinel.js
```

The runner writes the returned PNG under `artifacts/sentinel/` in the executing filesystem. This is an execution artifact, not a claim of durable object storage.

## No-fake-execution
No credentials = authorization-gated. Invalid provider responses = failed request. Only a successful provider response is treated as live satellite data.
