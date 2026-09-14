# Native push (iOS)

## Why this is a second transport, not a setting

iOS exposes the Web Push API to Safari and to a Home Screen PWA. It does not
expose it to `WKWebView`, which is what Capacitor runs. So inside the Promptly
app there is no `PushManager` at all, and the VAPID path the website uses
cannot work there.

The app registers with APNs instead and sends the resulting device token to the
server. A student may have both: the site open in a browser and the app on a
phone. Those are two addresses for one person, so `deliverPush()` sends to both
and counts the alert as delivered if either lands.

## What was added

| Piece | Where |
| --- | --- |
| APNs sender | `api/_shared/apns.js` |
| Token storage and retention | `api/_shared/store.js` |
| Registration endpoint action | `api/subscribe.js`, `action: "register-device"` |
| Fan-out to both transports | `api/_shared/alerts.js`, `deliverPush()` |
| Client registration | `script.js`, `enableNativePushAlerts()` |
| Device token forwarding | `ios/App/App/AppDelegate.swift` |

No new API function file. We are at Vercel's 12-function ceiling and
`tests/api-functions.test.js` asserts it, so registration rides inside
`subscribe.js` behind an `action`, like `watch` and `ping` already do.

## Environment variables

Set these in Vercel before native push does anything.

```
APNS_KEY_ID       the 10-character Key ID of the .p8 APNs auth key
APNS_TEAM_ID      4QH2Q5C457
APNS_PRIVATE_KEY  the .p8 file contents, including the BEGIN/END lines
APNS_BUNDLE_ID    com.thealmargroup.promptly  (the default; only set to override)
APNS_USE_SANDBOX  "true" only while testing a Debug build from Xcode
```

Two things that cost time if you get them wrong.

Vercel stores an environment variable on one line, so a pasted `.p8` arrives
with literal `\n` instead of newlines and a PEM parser rejects it with an
unhelpful error. `readPrivateKey()` repairs that, and a test covers it.

A Debug build from Xcode registers against the APNs **sandbox**. Sending a
sandbox token to production returns `BadDeviceToken`, which is indistinguishable
from an uninstalled app, and the token gets pruned. Set `APNS_USE_SANDBOX=true`
while testing on a development build, and unset it for TestFlight and the App
Store, which both use production.

## Getting the key

App Store Connect, Users and Access, Integrations, Keys. Create a key with the
Apple Push Notifications service enabled. The `.p8` downloads exactly once.

## Signing

`DEVELOPMENT_TEAM` is `4QH2Q5C457` on both Debug and Release, signing stays
automatic, and each configuration points at its own entitlements file:

| Configuration | Entitlements | `aps-environment` | Server setting |
| --- | --- | --- | --- |
| Debug | `App/App.entitlements` | `development` | `APNS_USE_SANDBOX=true` |
| Release | `App/AppRelease.entitlements` | `production` | `APNS_USE_SANDBOX` unset |

The split is the whole point. A token minted by a Debug build is rejected by
production APNs with `BadDeviceToken`, and our own pruning correctly reads that
as "the app was uninstalled" and throws the token away. The symptom is a phone
that registers happily and never receives anything.

`tests/ios-signing.test.js` pins all of this, including that the two
environments never cross.

## Still to do

- Verify end to end on a real device. The Simulator does not register with APNs,
  so it cannot prove any of this.
- Create the APNs key in App Store Connect and set the environment variables.

Note that the signing settings above were written directly into the Xcode
project file and validated as a plist, but **not** confirmed by a real build:
Xcode is not installed on the machine they were made on, only the Command Line
Tools. The first `xcodebuild` or Xcode open is what will actually prove them.
