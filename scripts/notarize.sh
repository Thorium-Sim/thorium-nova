#!/bin/bash
# Create a temporary zip of the binary for notarization
echo "Signing and Notarizing thoriumNovaServer-$BUILD_ARCH"

# Create a temporary keychain
security create-keychain -p "temppass" build.keychain
security default-keychain -s build.keychain
security unlock-keychain -p "temppass" build.keychain
security set-keychain-settings build.keychain

# Import certificate from base64 environment variable
echo "$APPLE_CERTIFICATE" | base64 --decode > certificate.p12
security import certificate.p12 -k build.keychain -P "$APPLE_CERTIFICATE_PASSWORD" -T /usr/bin/codesign

# Allow codesign to access the certificate
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "temppass" build.keychain

security find-identity -v -p codesigning build.keychain-db

codesign -s "F8073E0C8C2848A0313B8CA4741551AC2C449BD2" -f --timestamp --entitlements ./desktop/Entitlements.plist -o runtime "./binaries/server-$BUILD_ARCH"

zip -j "server-$BUILD_ARCH.zip" "./binaries/server-$BUILD_ARCH"

# Submit for notarization
xcrun notarytool submit "server-$BUILD_ARCH.zip" \
  --apple-id "$APPLE_ID" \
  --password "$APPLE_PASSWORD" \
  --team-id "$APPLE_TEAM_ID"

# Clean up the zip file
rm "server-$BUILD_ARCH.zip"