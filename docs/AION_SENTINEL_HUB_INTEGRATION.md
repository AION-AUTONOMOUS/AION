# AION Sentinel Hub Integration
AION Space now contains a real Copernicus Data Space / Sentinel Hub adapter.
Runtime path: AION Space -> OAuth2 -> Sentinel Hub Catalog/Process APIs -> real satellite data -> evidence.
Required environment variables: SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET.
Never commit these values or print them in logs.
The adapter is not a mock. Without valid provider credentials it deliberately reports authorization-gated and refuses execution.
Default collection: sentinel-2-l2a.
