# Sentinel Journal - Security Learnings

## 2026-09-17 - Unbounded Virtual Keyboard Input Buffer & DoS Risk
**Vulnerability:** The mobile hidden keyboard helper element (`#keyboard-helper`) processed `beforeinput` events without checking character data length or clearing `.value`, allowing oversized inputs/pasting to lock up browser UI threads and cause memory accumulation.
**Learning:** Virtual keyboard helper input elements in browser emulators can act as an unthrottled vector for client-side DoS if `beforeinput`/`input` payloads are not size-capped and reset.
**Prevention:** Always validate `e.data` length (`val.length > 256`), check numeric charcode validity, and reset `input.value = ""` inside helper input event handlers.
