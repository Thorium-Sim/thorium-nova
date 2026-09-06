#!/bin/bash
echo "Setting up keychain for signing and notarizing Mac apps."

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