# AION Free Public Earth & Space Data Connector

## Purpose

This connector adds on-demand access to public-source event metadata, space-weather measurements, and Copernicus Earth-observation catalogue metadata without API credentials. It does not establish a radio link to a spacecraft, task a satellite, or imply a live licensed commercial product.

## Live API

- `GET /api/earth-data?path=health` — shows connector configuration and public source endpoints.
- `GET /api/earth-data?path=overview` — fetches NASA EONET open events, NOAA solar-wind speed summary, and Copernicus STAC metadata in parallel; reports partial availability if a provider is unavailable.
- `GET /api/earth-data?path=events` — open natural-event metadata from NASA EONET.
- `GET /api/earth-data?path=space-weather` — recent solar-wind speed measurements from NOAA SWPC.
- `GET /api/earth-data?path=catalog` — metadata search against Copernicus Data Space STAC.
- `POST /api/earth-data?path=catalog` — optional JSON body: `{"bbox":[minLon,minLat,maxLon,maxLat],"from":"ISO-8601","to":"ISO-8601","limit":10}`.

The default catalogue query searches the world for the previous 30 days, with a maximum of 20 metadata items. Actual imagery asset retrieval, OAuth-protected processing, and commercial-provider tasking remain separate workflows.

## Free public provider documentation

- NASA EONET API v3: https://eonet.gsfc.nasa.gov/docs/v3
- NOAA SWPC data services: https://www.swpc.noaa.gov/ and https://services.swpc.noaa.gov/
- Copernicus Data Space APIs: https://documentation.dataspace.copernicus.eu/APIs.html

## Safeguards

- No provider secrets are needed or stored by this free connector.
- Responses include source attribution and retrieval timestamps.
- Provider errors are reported; missing data are not replaced with invented or cached values.
- This is a software-to-public-API integration over the internet, not a direct RF connection to a satellite.
