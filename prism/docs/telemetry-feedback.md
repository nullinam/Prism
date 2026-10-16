# PRISM telemetry and feedback

This document describes the lightweight Vercel reporting feature and a client contract for PRISM's planned platforms. The current repository implements the web client and shared Tauri desktop code; the bundle configuration currently names Windows MSI/NSIS targets, and no signed desktop installer is published. Android and iOS clients are planned and do not send these events yet. Do not describe telemetry as active on a platform until its client actually sends the documented event.

## What is stored

Tool activity is optional and disabled by default. When enabled, PRISM accepts only these fields: platform, app version, tool ID/name, action (`opened`, `started`, `completed`, `cancelled`, or `failed`), and server timestamp. It keeps the latest 2,000 events.

Feedback is a separate, user-triggered action. The user chooses a 1–5 rating; a note up to 500 characters is optional. The form is collapsed until opened and includes **Skip**. Skipping sends nothing. Only explicit submissions that pass conservative spam checks are retained, capped at the latest 500 records. A negative rating or criticism is not spam by itself.

Neither endpoint accepts or records filenames, paths, file sizes, file contents, tool inputs, passwords, or generated outputs. The server uses a keyed hash of the request IP for rate limiting (3 feedback submissions/hour; 600 activity events/hour). It does not add the raw IP to stored records. The hosting provider may process normal connection data to serve a request.

## Vercel storage setup

1. In the Vercel project for PRISM, add an Upstash Redis database through Marketplace. Review its current plan and billing before provisioning.
2. Connect it to the PRISM Vercel project and add the environment variables `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Production and Preview as appropriate.
3. Generate a long, random `PRISM_ADMIN_TOKEN` and add it as a server-side Vercel environment variable. Do not place it in source, Vite variables (`VITE_*`), a URL, or client bundle.
4. Redeploy after setting variables. Verify that `/api/activity` and `/api/feedback` report storage unavailable until the Redis variables are set.
5. Open `/admin.html` and enter the admin token to see aggregates and the latest records. The token remains in that tab's session storage; choose **Forget token and close report** when done. The report endpoint requires the token on every request and is not public.

No feature can retain production submissions until the Vercel project has a storage connection and these variables. Feedback must never claim success when storage is unavailable.

## Client event contract

Clients send a small JSON `POST` to `https://prism-khaki-one.vercel.app/api/activity` only after the user enables anonymous tool activity. Example:

```json
{
  "platform": "windows",
  "appVersion": "0.0.43",
  "toolId": 1,
  "toolName": "Crop image",
  "action": "completed"
}
```

Allowed platform values are `web`, `windows`, `macos`, `linux`, `android`, and `ios`. The web client detects the current platform, and the API validates the enum. Native clients should provide the platform from their build/runtime, use the same consent preference across launches, and keep the feature off until the user opts in. Send only lifecycle actions; do not send filenames, file counts, exact sizes, inputs, error messages that may contain user data, or content-derived information. Event delivery is best effort and must never block a tool or change its result.

Native requests may omit the browser `Origin` header. Do not add a long-lived app secret to a client binary. Rate limits and strict schema validation apply to the public ingestion endpoint.

## Feedback contract

`POST /api/feedback` accepts `platform`, `appVersion`, `toolId`, `toolName`, `rating`, optional `comment`, and a spam honeypot field. Body limit: 8 KB. Rating must be 1–5. Comment maximum: 500 characters. Feedback is sent only after pressing Submit; leaving the note blank is valid. Skip/cancel does not submit. Clear the locally saved draft if the user requests it or after successful submission.

## Limits and future storage

Redis lists suit the first release's small, capped event log and rate-limit counters. They are not a full analytics warehouse. If PRISM needs longer retention, user accounts, deletion requests, joins, or larger-scale reporting, migrate to a managed Postgres database and document the retention and access policy before collecting more data. Keep the admin report read-only and private.

## Privacy review checklist for future clients

- Confirm activity starts disabled and the user can turn it off later.
- Inspect network requests to verify payloads contain only the schema above.
- Submit blank-note feedback and verify rating-only submission works.
- Skip feedback and verify no request occurs.
- Use a synthetic test file and verify it never appears in any request, log, or stored record.
- Check retention caps and ensure `/api/admin` rejects missing or incorrect tokens.
- Update the privacy page before introducing new fields, services, or retention periods.
