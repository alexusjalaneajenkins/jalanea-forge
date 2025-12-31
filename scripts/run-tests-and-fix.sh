#!/bin/bash

# Jalnaea Dev - Automated Testing & Auto-Fix Script
# This script runs Playwright tests and triggers Claude Code to fix any failures

set -e

# Configuration
PROJECT_DIR="/Users/alexusjenkins/Documents/Jalanea Forge - AI Product Designer/jalanea-lab"
LOG_DIR="$PROJECT_DIR/test-logs"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
LOG_FILE="$LOG_DIR/test-run-$TIMESTAMP.log"

# Create log directory
mkdir -p "$LOG_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to send notification (optional - uses macOS notifications)
notify() {
    osascript -e "display notification \"$1\" with title \"Jalnaea Dev Tests\""
}

log "=========================================="
log "Starting Jalnaea Dev Automated Tests"
log "=========================================="

cd "$PROJECT_DIR"

# Run Playwright tests
log "Running Playwright tests..."

if npx playwright test --reporter=json 2>&1 | tee -a "$LOG_FILE"; then
    log "✅ All tests passed!"
    notify "All tests passed!"

    # Clean up old logs (keep last 10)
    ls -t "$LOG_DIR"/test-run-*.log 2>/dev/null | tail -n +11 | xargs -r rm

    exit 0
else
    log "❌ Some tests failed!"
    notify "Tests failed - Claude Code will attempt to fix"

    # Extract failure details from test results
    RESULTS_FILE="$PROJECT_DIR/test-results/results.json"

    if [ -f "$RESULTS_FILE" ]; then
        # Get failed tests
        FAILED_TESTS=$(cat "$RESULTS_FILE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
failures = []
for suite in data.get('suites', []):
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            if test.get('status') == 'unexpected':
                for result in test.get('results', []):
                    if result.get('status') == 'failed':
                        error = result.get('error', {}).get('message', 'Unknown error')
                        failures.append(f\"{spec.get('title')}: {error[:200]}\")
print('\\n'.join(failures[:5]))  # Limit to 5 failures
" 2>/dev/null || echo "Could not parse test results")

        log "Failed tests:"
        log "$FAILED_TESTS"
    fi

    # Create a prompt for Claude Code
    FIX_PROMPT="The automated Playwright tests for jalnaea.dev failed. Here are the failures:

$FAILED_TESTS

Please:
1. Analyze the test failures
2. Check the relevant source code files
3. Fix any bugs in the application code
4. Run 'npm run build' to verify the fix compiles
5. If the fix works, commit and push with message 'fix: resolve test failures'
6. Deploy to Vercel with 'vercel --prod'

Project directory: $PROJECT_DIR"

    log "Triggering Claude Code to fix issues..."

    # Run Claude Code in headless/print mode
    if command -v claude &> /dev/null; then
        cd "$PROJECT_DIR"
        echo "$FIX_PROMPT" | claude --print 2>&1 | tee -a "$LOG_FILE"

        log "Claude Code fix attempt completed"

        # Re-run tests to verify fix
        log "Re-running tests to verify fix..."
        if npx playwright test 2>&1 | tee -a "$LOG_FILE"; then
            log "✅ Fix successful - all tests now pass!"
            notify "Claude Code fixed the issues - tests now pass!"
        else
            log "⚠️ Some tests still failing after fix attempt"
            notify "Tests still failing - manual intervention needed"
        fi
    else
        log "⚠️ Claude Code CLI not found. Please install it to enable auto-fix."
        notify "Claude Code not installed - manual fix needed"
    fi
fi

log "=========================================="
log "Test run completed"
log "=========================================="
