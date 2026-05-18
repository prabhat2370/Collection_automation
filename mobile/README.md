# Mobile Collection Flow (Appium + WebdriverIO)

Replaces the web-based Playwright Collection flow (`tests/collection.spec.js`) with an Android-app-driven one using Appium and the **Ripplr DMS** APK.

The original web spec is kept as a backup. Web is runnable via `npm run collection:web`; mobile via `npm run collection:mobile`.

---

## Status

**Auto-installed (already done):**
- Appium server (`npm i -g appium`)
- UiAutomator2 driver (`appium driver install uiautomator2`)
- WebdriverIO dev dependencies (in this repo)
- All page objects, spec, config, and helpers scaffolded
- APK copied to `mobile/apk/dms_v2_pre_prod_v0.1.52.apk`

**Requires manual setup by user (Phase 1):**
1. Install **Android Studio** — https://developer.android.com/studio
2. Open Android Studio → **More Actions → SDK Manager**:
   - SDK Platforms tab → check **Android 13.0 (API 33)**
   - SDK Tools tab → confirm checked: Platform-Tools, Build-Tools, Emulator, Command-line Tools
3. **More Actions → Virtual Device Manager → Create Device** → Pixel 6 → API 33 → name it exactly **`Pixel_6`** (this name is hardcoded in `wdio.conf.js`)
4. Set Windows environment variables (User scope):
   - `ANDROID_HOME` = `C:\Users\User\AppData\Local\Android\Sdk`
   - Append to `Path`: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\emulator`
   - **Restart VS Code / terminal** after this
5. Install **Appium Inspector** (GUI for locator exploration): https://github.com/appium/appium-inspector/releases
6. Manually launch the AVD once and confirm DMS app login works with mobile `9886996369` / PIN `1234`.

**Verify Phase 1:**
```
adb devices                    # should list emulator-5554
appium --version               # should print 2.x.x
appium driver list --installed # should show uiautomator2@7.2.3
```

---

## Run the mobile collection flow

```
# 1. Boot the emulator (from Android Studio AVD Manager, or:)
emulator -avd Pixel_6 &

# 2. Run the spec
npm run collection:mobile
```

WebdriverIO's `@wdio/appium-service` auto-starts the Appium server on port 4723 for the duration of the run.

---

## Folder structure

```
mobile/
├── wdio.conf.js                ← WebdriverIO + Appium capabilities
├── apk/
│   └── dms_v2_pre_prod_v0.1.52.apk   (gitignored — fetch out-of-band)
├── pages/
│   ├── BaseAppPage.js          ← shared waits, scroll, tap-by-text
│   ├── LoginAppPage.js         ← mobile + PIN entry
│   ├── LandingAppPage.js       ← post-login landing screen (Collection card, Cheque Bounce card)
│   ├── InvoiceListAppPage.js   ← invoice-number search + tap
│   └── CollectionAppPage.js    ← mirrors pages/collectionPage.js method-for-method
├── tests/
│   └── collection.e2e.js       ← mirrors tests/collection.spec.js; includes post-login landing assertions
└── utils/
    ├── appiumHelpers.js        ← low-level waits, swipes, keyboard
    ├── locators.js             ← CENTRALIZED content-desc locators — edit this after Appium Inspector walkthrough
    └── refsWriter.js           ← writes ../test-data/runtime/collectionRefs.json (preserves the handoff contract)
```

---

## Shared with the Playwright suite (do not duplicate)

| File | Purpose |
|---|---|
| `test-data/users.js` | `USERS.collection` (mobile/PIN) |
| `test-data/collection.js` | `AMOUNTS`, `BANKS`, `CONFIRMATION` |
| `utils/excelReader.js` | `firstOBCData.invoiceNo` for invoice navigation |
| `test-data/runtime/collectionRefs.json` | Handoff JSON (gitignored) consumed by `web/pages/cashVerificationPage.js` and `web/pages/deliveryAllocationPage.js` |
| `allure-results/` | Reporter output dir — WDIO Allure writes here too |

---

## Locator strategy (Flutter app)

The DMS app is built in Flutter, so the Android native view tree is essentially one `FlutterView` Canvas with no `resource-id`. We locate by Flutter accessibility semantics (`content-desc`) and visible text.

**Every locator is centralized in `mobile/utils/locators.js`.** The current values are PLACEHOLDERS — walk the app once with Appium Inspector and replace each with the real `content-desc` (or file a one-line ticket asking the dev team to add a `Semantics(label:)` if the widget exposes nothing).

WebdriverIO accessibility-id syntax: `~<content-desc>` (leading `~`). Text fallback: `//*[@text='...']`.

---

## Troubleshooting

- **`adb devices` shows nothing** → emulator isn't booted, or `platform-tools` isn't on PATH.
- **Appium fails with "ANDROID_HOME not set"** → restart your terminal after setting the env var.
- **Element not found by `~content_desc`** → the Flutter widget has no Semantics label. Use Appium Inspector to find it; if none exists, fall back to `//*[@text='...']` or escalate to the dev team.
- **App reinstalls on every run** → set `noReset: true` in `wdio.conf.js` if you want to keep app state between runs (currently `false` for clean runs).


------------
Prefer locators in this priority: resource-id > content-desc > accessibility id > xpath (xpath is brittle)
appium --allow-cors