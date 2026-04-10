#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME="Fastener Joint Calculator"
OUTPUT_PATH="${1:-$HOME/Desktop/${APP_NAME}.app}"
DIST_DIR="$REPO_ROOT/dist"
SOURCE_ICON="$REPO_ROOT/public/app-icon.png"
PORT=41730
TMP_DIR="$(mktemp -d)"
ICONSET_DIR="$TMP_DIR/app.iconset"
ICON_ICNS="$TMP_DIR/app.icns"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if [ ! -d "$DIST_DIR" ]; then
  echo "dist/ not found. Run: npm run build" >&2
  exit 1
fi

if [ ! -f "$SOURCE_ICON" ]; then
  echo "Icon not found at $SOURCE_ICON" >&2
  exit 1
fi

mkdir -p "$ICONSET_DIR"
for spec in \
  "16 icon_16x16.png" \
  "32 icon_16x16@2x.png" \
  "32 icon_32x32.png" \
  "64 icon_32x32@2x.png" \
  "128 icon_128x128.png" \
  "256 icon_128x128@2x.png" \
  "256 icon_256x256.png" \
  "512 icon_256x256@2x.png" \
  "512 icon_512x512.png" \
  "1024 icon_512x512@2x.png"; do
  set -- $spec
  size="$1"
  name="$2"
  sips -z "$size" "$size" "$SOURCE_ICON" --out "$ICONSET_DIR/$name" >/dev/null
done
iconutil -c icns "$ICONSET_DIR" -o "$ICON_ICNS"

rm -rf "$OUTPUT_PATH"
mkdir -p "$OUTPUT_PATH/Contents/MacOS" "$OUTPUT_PATH/Contents/Resources/dist"

cat > "$OUTPUT_PATH/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>en</string>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundleIconFile</key>
  <string>app.icns</string>
  <key>CFBundleIdentifier</key>
  <string>io.github.ecdaerol.fastener-joint-calculator</string>
  <key>CFBundleInfoDictionaryVersion</key>
  <string>6.0</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>1.0.0</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
PLIST

cat > "$OUTPUT_PATH/Contents/MacOS/launch" <<'LAUNCH'
#!/bin/bash
set -e
APP_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$APP_ROOT/Resources/dist"
PORT=41730
PIDS=$(/usr/sbin/lsof -tiTCP:${PORT} -sTCP:LISTEN || true)
if [ -n "$PIDS" ]; then
  kill $PIDS >/dev/null 2>&1 || true
  sleep 1
fi
cd "$DIST_DIR"
nohup /usr/bin/python3 -m http.server ${PORT} >/tmp/torque-preload-calculator.log 2>&1 &
sleep 1
/usr/bin/open "http://127.0.0.1:${PORT}"
LAUNCH
chmod +x "$OUTPUT_PATH/Contents/MacOS/launch"

cp -R "$DIST_DIR/"* "$OUTPUT_PATH/Contents/Resources/dist/"
cp "$ICON_ICNS" "$OUTPUT_PATH/Contents/Resources/app.icns"
/usr/bin/touch "$OUTPUT_PATH"

ZIP_PATH="${OUTPUT_PATH%.app}.zip"
rm -f "$ZIP_PATH"
/usr/bin/ditto -c -k --sequesterRsrc --keepParent "$OUTPUT_PATH" "$ZIP_PATH"

echo "Built app: $OUTPUT_PATH"
echo "Built share package: $ZIP_PATH"
