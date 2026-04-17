#!/bin/bash

# rn-keystore-setup.sh
# Secure React Native Android release builder with project-local backups.

set -euo pipefail
umask 077

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

info()    { echo -e "${CYAN}${BOLD}  →${RESET}  $1"; }
success() { echo -e "${GREEN}${BOLD}  ✔${RESET}  $1"; }
warn()    { echo -e "${YELLOW}${BOLD}  !${RESET}  $1"; }
error()   { echo -e "${RED}${BOLD}  x${RESET}  $1"; }
divider() { echo -e "${DIM}  ----------------------------------------${RESET}"; }

banner() {
  echo ""
  echo -e "${CYAN}${BOLD}  ==========================================${RESET}"
  echo -e "${CYAN}${BOLD}   React Native Android Release Tool (Safe) ${RESET}"
  echo -e "${CYAN}${BOLD}  ==========================================${RESET}"
  echo ""
}

usage() {
  cat <<'EOF'
Usage: ./apk.sh [options]

Options:
  --reuse-latest          Reuse latest backup keystore and saved secrets.
  --artifact-dir <path>   Custom artifact root (default: ./release-artifacts).
  --keystore <path>       Import and use an existing keystore file.
  --alias <value>         Override key alias.
  --help                  Show this help.
EOF
}

prompt() {
  local varname="$1"
  local message="$2"
  local default="${3:-}"
  local input=""
  if [ -n "$default" ]; then
    echo -ne "  ${BOLD}${message}${RESET} ${DIM}(${default})${RESET}: "
  else
    echo -ne "  ${BOLD}${message}${RESET}: "
  fi
  read -r input
  if [ -z "$input" ] && [ -n "$default" ]; then
    input="$default"
  fi
  eval "$varname=\"\$input\""
}

prompt_password() {
  local varname="$1"
  local message="$2"
  local input=""
  echo -ne "  ${BOLD}${message}${RESET}: "
  read -rs input
  echo ""
  eval "$varname=\"\$input\""
}

ensure_command() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    error "$cmd not found. $hint"
    exit 1
  fi
}

ensure_file_mode_600() {
  local target="$1"
  chmod 600 "$target" 2>/dev/null || true
}

get_project_name() {
  if [ -f "$CWD/package.json" ]; then
    local name
    name=$(awk -F'"' '/"name"[[:space:]]*:/ {print $4; exit}' "$CWD/package.json")
    if [ -n "$name" ]; then
      echo "$name"
      return
    fi
  fi
  basename "$CWD"
}

sanitize_keystore_name() {
  local candidate="$1"
  if [[ "$candidate" != *.keystore ]] && [[ "$candidate" != *.jks ]]; then
    echo "${candidate}.keystore"
    return
  fi
  echo "$candidate"
}

save_secrets_file() {
  local file="$1"
  cat > "$file" <<EOF
MYAPP_RELEASE_STORE_PASSWORD='$STORE_PASSWORD'
MYAPP_RELEASE_KEY_PASSWORD='$KEY_PASSWORD'
MYAPP_RELEASE_KEY_ALIAS='$KEY_ALIAS'
MYAPP_RELEASE_STORE_FILE='$KEYSTORE_FILENAME'
EOF
  ensure_file_mode_600 "$file"
}

load_secrets_file() {
  local file="$1"
  [ ! -f "$file" ] && return 1
  local line key value
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|'#'*) continue ;;
    esac
    key="${line%%=*}"
    value="${line#*=}"
    value="${value%\'}"
    value="${value#\'}"
    case "$key" in
      MYAPP_RELEASE_STORE_PASSWORD) STORE_PASSWORD="$value" ;;
      MYAPP_RELEASE_KEY_PASSWORD) KEY_PASSWORD="$value" ;;
      MYAPP_RELEASE_KEY_ALIAS) KEY_ALIAS="$value" ;;
      MYAPP_RELEASE_STORE_FILE) KEYSTORE_FILENAME="$value" ;;
    esac
  done < "$file"
  return 0
}

write_metadata() {
  local metadata_file="$1"
  cat > "$metadata_file" <<EOF
Project:        $PROJECT_NAME
Generated:      $(date)
Keystore file:  $KEYSTORE_FILENAME
Key alias:      $KEY_ALIAS
Certificate DN: ${DNAME:-N/A}
Artifact root:  $ARTIFACT_ROOT
Release folder: $RELEASE_DIR
Original keystore path: $KEYSTORE_PATH
EOF
  ensure_file_mode_600 "$metadata_file"
}

write_checksums() {
  local checksum_file="$1"
  : > "$checksum_file"
  for candidate in "$AAB_DEST" "$APK_DEST" "$KEYSTORE_BACKUP"; do
    if [ -f "$candidate" ]; then
      shasum -a 256 "$candidate" >> "$checksum_file"
    fi
  done
  ensure_file_mode_600 "$checksum_file"
}

patch_gradle_properties() {
  local props="$ANDROID_DIR/gradle.properties"
  [ ! -f "$props" ] && touch "$props"
  local tmp
  tmp=$(mktemp)
  awk '!/^MYAPP_RELEASE_/' "$props" > "$tmp"
  cat "$tmp" > "$props"
  rm -f "$tmp"
  cat >> "$props" <<EOF

# --- rn-keystore-setup (safe, no plain-text passwords) ---
MYAPP_RELEASE_STORE_FILE=$KEYSTORE_FILENAME
MYAPP_RELEASE_KEY_ALIAS=$KEY_ALIAS
EOF
}

patch_build_gradle() {
  local build_file="$ANDROID_DIR/app/build.gradle"
  [ ! -f "$build_file" ] && { error "android/app/build.gradle not found"; exit 1; }

  if grep -q "storePassword (findProperty('MYAPP_RELEASE_STORE_PASSWORD')" "$build_file"; then
    warn "build.gradle already configured for env/property signing"
  else
    if grep -q "signingConfigs {" "$build_file"; then
      awk '
        /signingConfigs \{/ { in_sc=1 }
        in_sc && /debug \{/ { in_debug=1 }
        in_debug && /\}/ {
          print
          if (!released) {
            print "        release {"
            print "            storeFile file(findProperty('\''MYAPP_RELEASE_STORE_FILE'\'') ?: System.getenv('\''MYAPP_RELEASE_STORE_FILE'\''))"
            print "            storePassword (findProperty('\''MYAPP_RELEASE_STORE_PASSWORD'\'') ?: System.getenv('\''MYAPP_RELEASE_STORE_PASSWORD'\''))"
            print "            keyAlias (findProperty('\''MYAPP_RELEASE_KEY_ALIAS'\'') ?: System.getenv('\''MYAPP_RELEASE_KEY_ALIAS'\''))"
            print "            keyPassword (findProperty('\''MYAPP_RELEASE_KEY_PASSWORD'\'') ?: System.getenv('\''MYAPP_RELEASE_KEY_PASSWORD'\''))"
            print "        }"
            released=1
          }
          in_debug=0
          next
        }
        { print }
      ' "$build_file" > "$build_file.tmp" && mv "$build_file.tmp" "$build_file"
    else
      awk '
        /buildTypes \{/ && !injected {
          print "    signingConfigs {"
          print "        release {"
          print "            storeFile file(findProperty('\''MYAPP_RELEASE_STORE_FILE'\'') ?: System.getenv('\''MYAPP_RELEASE_STORE_FILE'\''))"
          print "            storePassword (findProperty('\''MYAPP_RELEASE_STORE_PASSWORD'\'') ?: System.getenv('\''MYAPP_RELEASE_STORE_PASSWORD'\''))"
          print "            keyAlias (findProperty('\''MYAPP_RELEASE_KEY_ALIAS'\'') ?: System.getenv('\''MYAPP_RELEASE_KEY_ALIAS'\''))"
          print "            keyPassword (findProperty('\''MYAPP_RELEASE_KEY_PASSWORD'\'') ?: System.getenv('\''MYAPP_RELEASE_KEY_PASSWORD'\''))"
          print "        }"
          print "    }"
          injected=1
        }
        { print }
      ' "$build_file" > "$build_file.tmp" && mv "$build_file.tmp" "$build_file"
    fi
  fi

  awk '
    /buildTypes \{/ { in_bt=1 }
    in_bt && /debug \{/ { in_debug=1; print; next }
    in_debug && /signingConfig/ { print "            signingConfig signingConfigs.debug"; next }
    in_debug && /\}/ { in_debug=0 }
    { print }
  ' "$build_file" > "$build_file.tmp" && mv "$build_file.tmp" "$build_file"

  awk '
    /buildTypes \{/ { in_bt=1 }
    in_bt && /release \{/ { in_release=1; saw_sign=0; print; next }
    in_release && /signingConfig/ { print "            signingConfig signingConfigs.release"; saw_sign=1; next }
    in_release && /\}/ {
      if (!saw_sign) print "            signingConfig signingConfigs.release"
      in_release=0
    }
    { print }
  ' "$build_file" > "$build_file.tmp" && mv "$build_file.tmp" "$build_file"
}

update_gitignore() {
  local gitignore="$CWD/.gitignore"
  [ ! -f "$gitignore" ] && touch "$gitignore"
  local entries=(
    "android/app/*.jks"
    "android/app/*.keystore"
    "release-artifacts/.keystore-secrets.env"
    "release-artifacts/**/keystore/*"
  )
  for entry in "${entries[@]}"; do
    if ! grep -qF "$entry" "$gitignore"; then
      echo "$entry" >> "$gitignore"
    fi
  done
}

REUSE_LATEST=false
CUSTOM_ARTIFACT_DIR=""
IMPORT_KEYSTORE=""
CLI_KEY_ALIAS=""

while [ $# -gt 0 ]; do
  case "$1" in
    --reuse-latest) REUSE_LATEST=true ;;
    --artifact-dir) CUSTOM_ARTIFACT_DIR="${2:-}"; shift ;;
    --keystore) IMPORT_KEYSTORE="${2:-}"; shift ;;
    --alias) CLI_KEY_ALIAS="${2:-}"; shift ;;
    --help) usage; exit 0 ;;
    *) error "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

banner

CWD="$(pwd)"
ANDROID_DIR="$CWD/android"
PROJECT_NAME="$(get_project_name)"
ARTIFACT_ROOT="${CUSTOM_ARTIFACT_DIR:-$CWD/release-artifacts}"
SECRETS_FILE="$ARTIFACT_ROOT/.keystore-secrets.env"
TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
RELEASE_DIR="$ARTIFACT_ROOT/releases/$TIMESTAMP"
LATEST_DIR="$ARTIFACT_ROOT/latest"

mkdir -p "$ARTIFACT_ROOT" "$RELEASE_DIR/artifacts" "$RELEASE_DIR/keystore" "$RELEASE_DIR/metadata"

ensure_command keytool "Install JDK and add keytool to PATH."
ensure_command shasum "Expected in macOS; install coreutils if missing."

[ ! -d "$ANDROID_DIR" ] && { error "No android folder found in $CWD"; exit 1; }
[ ! -f "$ANDROID_DIR/gradlew" ] && { error "gradlew not found in android/"; exit 1; }

success "Environment checks passed"

KEYSTORE_FILENAME=""
KEY_ALIAS="$CLI_KEY_ALIAS"
STORE_PASSWORD=""
KEY_PASSWORD=""
DNAME=""

if load_secrets_file "$SECRETS_FILE"; then
  info "Loaded saved signing secrets from local secure file"
fi

if [ -n "$CLI_KEY_ALIAS" ]; then
  KEY_ALIAS="$CLI_KEY_ALIAS"
fi

if [ "$REUSE_LATEST" = true ]; then
  info "Reuse mode enabled"
  if [ -z "$IMPORT_KEYSTORE" ]; then
    IMPORT_KEYSTORE="$(ls -1 "$LATEST_DIR"/keystore/*.keystore "$LATEST_DIR"/keystore/*.jks 2>/dev/null | head -1 || true)"
  fi
  if [ -z "$IMPORT_KEYSTORE" ] || [ ! -f "$IMPORT_KEYSTORE" ]; then
    error "No keystore found for reuse. Pass --keystore or run once without --reuse-latest."
    exit 1
  fi
  KEYSTORE_FILENAME="$(basename "$IMPORT_KEYSTORE")"
else
  divider
  echo -e "  ${BOLD}Keystore Configuration${RESET}"
  divider
  prompt KEYSTORE_FILENAME "Keystore filename" "${KEYSTORE_FILENAME:-release.keystore}"
  KEYSTORE_FILENAME="$(sanitize_keystore_name "$KEYSTORE_FILENAME")"
fi

[ -z "$KEY_ALIAS" ] && prompt KEY_ALIAS "Key alias" "my-key-alias"
if [ -z "$STORE_PASSWORD" ]; then
  prompt_password STORE_PASSWORD "Keystore password (min 6 chars)"
fi
if [ "${#STORE_PASSWORD}" -lt 6 ]; then
  error "Keystore password must be at least 6 characters."
  exit 1
fi

if [ -z "$KEY_PASSWORD" ]; then
  echo -ne "  ${BOLD}Use same password for key?${RESET} ${DIM}(Y/n)${RESET}: "
  read -r same_pass
  if [[ "$same_pass" =~ ^[Nn]$ ]]; then
    prompt_password KEY_PASSWORD "Key password (min 6 chars)"
  else
    KEY_PASSWORD="$STORE_PASSWORD"
  fi
fi
if [ "${#KEY_PASSWORD}" -lt 6 ]; then
  error "Key password must be at least 6 characters."
  exit 1
fi

KEYSTORE_PATH="$ANDROID_DIR/app/$KEYSTORE_FILENAME"

if [ -n "$IMPORT_KEYSTORE" ] && [ -f "$IMPORT_KEYSTORE" ]; then
  info "Importing keystore from $IMPORT_KEYSTORE"
  cp "$IMPORT_KEYSTORE" "$KEYSTORE_PATH"
  ensure_file_mode_600 "$KEYSTORE_PATH"
elif [ ! -f "$KEYSTORE_PATH" ]; then
  divider
  echo -e "  ${BOLD}Certificate Info${RESET} ${DIM}(for new keystore)${RESET}"
  divider
  prompt CERT_NAME "Your full name" "Unknown"
  prompt CERT_ORG "Organization" "Unknown"
  prompt CERT_COUNTRY "Country code (2 chars)" "BD"
  CERT_COUNTRY=$(echo "$CERT_COUNTRY" | tr '[:lower:]' '[:upper:]')
  DNAME="CN=${CERT_NAME}, O=${CERT_ORG}, C=${CERT_COUNTRY}"
  info "Generating new keystore"
  keytool -genkey -v \
    -keystore "$KEYSTORE_PATH" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias "$KEY_ALIAS" \
    -storepass "$STORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "$DNAME" \
    2>/dev/null
  ensure_file_mode_600 "$KEYSTORE_PATH"
  success "Generated android/app/$KEYSTORE_FILENAME"
else
  info "Using existing keystore at android/app/$KEYSTORE_FILENAME"
fi

save_secrets_file "$SECRETS_FILE"
success "Saved local secrets file at $SECRETS_FILE (gitignored)"

patch_gradle_properties
success "Updated android/gradle.properties (non-secret fields only)"

patch_build_gradle
success "Patched android/app/build.gradle for env/property signing"

update_gitignore
success "Updated .gitignore with release security entries"

info "Building release AAB + APK..."
(
  cd "$ANDROID_DIR"
  chmod +x gradlew
  MYAPP_RELEASE_STORE_FILE="$KEYSTORE_FILENAME" \
  MYAPP_RELEASE_KEY_ALIAS="$KEY_ALIAS" \
  MYAPP_RELEASE_STORE_PASSWORD="$STORE_PASSWORD" \
  MYAPP_RELEASE_KEY_PASSWORD="$KEY_PASSWORD" \
  ./gradlew clean bundleRelease assembleRelease
)
success "Release build completed"

AAB_SOURCE="$ANDROID_DIR/app/build/outputs/bundle/release/app-release.aab"
APK_SOURCE="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
AAB_DEST="$RELEASE_DIR/artifacts/app-release.aab"
APK_DEST="$RELEASE_DIR/artifacts/app-release.apk"
KEYSTORE_BACKUP="$RELEASE_DIR/keystore/$KEYSTORE_FILENAME"
META_FILE="$RELEASE_DIR/metadata/keystore-info.txt"
SHA_FILE="$RELEASE_DIR/metadata/sha256sums.txt"

if [ -f "$AAB_SOURCE" ]; then
  cp "$AAB_SOURCE" "$AAB_DEST"
  ensure_file_mode_600 "$AAB_DEST"
else
  AAB_DEST=""
  warn "AAB not found"
fi

if [ -f "$APK_SOURCE" ]; then
  cp "$APK_SOURCE" "$APK_DEST"
  ensure_file_mode_600 "$APK_DEST"
else
  APK_DEST=""
  warn "APK not found"
fi

cp "$KEYSTORE_PATH" "$KEYSTORE_BACKUP"
ensure_file_mode_600 "$KEYSTORE_BACKUP"

write_metadata "$META_FILE"
write_checksums "$SHA_FILE"

rm -rf "$LATEST_DIR"
cp -R "$RELEASE_DIR" "$LATEST_DIR"

echo ""
success "All done"
echo -e "  ${GREEN}${BOLD}Release folder:${RESET} ${YELLOW}$RELEASE_DIR${RESET}"
echo -e "  ${GREEN}${BOLD}Latest folder:${RESET}  ${YELLOW}$LATEST_DIR${RESET}"
echo -e "  ${DIM}To reuse in future: ./apk.sh --reuse-latest${RESET}"
echo ""