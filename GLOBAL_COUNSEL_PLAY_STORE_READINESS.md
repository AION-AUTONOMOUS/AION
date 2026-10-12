# GLOBAL COUNSEL — Google Play launch readiness
Last checked: 2026-10-12

## Implemented in GitHub main
- Independent GLOBAL COUNSEL branding on the web entry page.
- Standalone PWA manifest and SVG icon.
- App-specific privacy policy URL.
- PWA service-worker cache includes the counsel page, manifest, privacy page, and icon.
- Railway API bridge now recognizes the Adyen create-session route.

## Hard blockers before public launch
1. No Android App Bundle (AAB) or signed APK exists in this repository at this checkpoint; this is a PWA setup, not a Play Store upload artifact.
2. Google Play Console account status and registration-fee payment are unknown. The one-time registration fee is currently listed by Google as US$25.
3. Production payment is not enabled: the counsel page uses Adyen test-mode logic, and Railway's known variable inventory did not include ADYEN_API_KEY, ADYEN_MERCHANT_ACCOUNT, or ADYEN_CLIENT_KEY. The Adyen endpoint must return a clear unavailable response until a real merchant configuration and server-side verification are complete.
4. The legal-case file security gate is explicitly closed. Do not accept confidential case documents or sensitive personal data until authentication, per-case authorization, private encrypted storage, malware scanning, audit logging, retention/deletion, and security tests are implemented and independently checked.
5. The privacy and Data safety declarations must be reviewed against actual production behavior and third-party SDKs before submission.
6. If the Play Console account is a new personal account created after 2023-11-13, Google requires a closed test with at least 12 testers opted in continuously for 14 days before production access; approval of production access may take seven days or longer.

## Next actions
- Generate and validate a signed Android App Bundle from the standalone web app using a Trusted Web Activity/PWA packaging workflow, including a verified HTTPS origin and Digital Asset Links association.
- Verify the Play Console account type, identity, fee, device verification, and track eligibility.
- Test the app on Android, including navigation, privacy link, offline behavior, screen sizes, accessibility, and the disabled/unconfigured payment path.
- Do not represent this app as a licensed law firm or claim that the Google Play public release is approved until Google confirms it.
