#!/bin/bash

set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

LOG_DIR="./scripts/build-scripts/logs"
mkdir -p "$LOG_DIR"

PUSH_ENABLED=1
COMMIT_MESSAGE="fix: automated build sync"

usage() {
	echo "Usage: ./scripts/web/build-and-deploy.sh [--skip-git] [--no-push] [--push] [--message='msg'] [commit message]"
	echo "  --skip-git       Build and commit, but skip git push (alias of --no-push)"
	echo "  --no-push        Build and commit, but skip git push"
	echo "  --push           Push with: git push -u origin main (default behavior)"
	echo "  --message=...    Set commit message"
}

for arg in "$@"; do
	case "$arg" in
		--skip-git)
			PUSH_ENABLED=0
			;;
		--no-push)
			PUSH_ENABLED=0
			;;
		--push)
			PUSH_ENABLED=1
			;;
		--message=*)
			COMMIT_MESSAGE="${arg#*=}"
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			if [[ "$arg" != --* ]]; then
				COMMIT_MESSAGE="$arg"
			else
				echo "[FRACTURED EARTH] Unknown option: $arg"
				usage
				exit 1
			fi
			;;
	esac
done

echo "[FRACTURED EARTH] Build options: PUSH_ENABLED=$PUSH_ENABLED, COMMIT_MESSAGE='$COMMIT_MESSAGE'"
echo "[FRACTURED EARTH] Logging to $LOG_DIR"

echo "[FRACTURED EARTH] Starting clean build..."
./gradlew clean --stacktrace --info --debug --warning-mode all | tee "$LOG_DIR/clean.log"

echo "[FRACTURED EARTH] Building debug APK..."
./gradlew :android-app:assembleDebug --stacktrace --info --debug --warning-mode all | tee "$LOG_DIR/assembleDebug.log"

echo "[FRACTURED EARTH] Building release APK..."
./gradlew :android-app:assembleRelease --stacktrace --info --debug --warning-mode all | tee "$LOG_DIR/assembleRelease.log"

echo "[FRACTURED EARTH] Building release AAB..."
./gradlew :android-app:bundleRelease --stacktrace --info --debug --warning-mode all | tee "$LOG_DIR/bundleRelease.log"

git add .
if git diff --cached --quiet; then
	echo "[FRACTURED EARTH] No changes to commit."
else
	git commit -m "$COMMIT_MESSAGE"
fi

if [[ "$PUSH_ENABLED" -eq 1 ]]; then
	echo "[FRACTURED EARTH] Pushing to origin/main using upstream mode (no force push)..."
	git push -u origin main
else
	echo "[FRACTURED EARTH] --skip-git/--no-push enabled. Skipping git push."
fi

echo "[FRACTURED EARTH] Build workflow complete."
