# Mobile Build Guide

## 1. Prerequisites

- Node.js (installed)
- Android Studio + Android SDK + JDK (required for Android builds)
- Xcode on macOS (required for iOS builds)

## 2. Android Signing Setup

Create a release keystore (one time):

```powershell
keytool -genkeypair -v -keystore release-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Create `android/keystore.properties` from `android/keystore.properties.example` and update values:

```properties
storeFile=../release-keystore.jks
storePassword=your_store_password
keyAlias=upload
keyPassword=your_key_password
```

Alternative to file: set env vars:
- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

## 3. Build Commands

From project root:

```powershell
npm run build:android:debug
npm run build:android:release:apk
npm run build:android:release:aab
```

Outputs:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## 4. iOS Build (macOS only)

```bash
npm run sync:ios
npm run open:ios
```

Then in Xcode:
1. Select signing team + bundle identifier.
2. Product -> Archive.
3. Distribute via TestFlight/App Store.
