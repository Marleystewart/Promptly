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

## Still to do

- Set the signing team to `4QH2Q5C457` in Xcode. The project has no team yet, so
  it does not build to a device.
- Enable the Push Notifications capability on the Xcode target.
- Verify end to end on a real device. The Simulator can display a notification
  from a local payload but does not register with APNs, so it cannot prove this.
