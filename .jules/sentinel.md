# Sentinel Journal - Security Learnings

## 2026-09-17 - Unbounded Virtual Keyboard Input Buffer & DoS Risk
**Vulnerability:** The mobile hidden keyboard helper element (`#keyboard-helper`) processed `beforeinput` events without checking character data length or clearing `.value`, allowing oversized inputs/pasting to lock up browser UI threads and cause memory accumulation.
**Learning:** Virtual keyboard helper input elements in browser emulators can act as an unthrottled vector for client-side DoS if `beforeinput`/`input` payloads are not size-capped and reset.
**Prevention:** Always validate `e.data` length (`val.length > 256`), check numeric charcode validity, and reset `input.value = ""` inside helper input event handlers.

## 2026-09-18 - Service Worker Uncaught TypeError on HTTP 206 Partial Content & Wildcard Vary Responses
**Vulnerability:** Service Worker fetch handlers passed HTTP 206 Partial Content and `Vary: *` responses directly to `cache.put()`, triggering uncaught `TypeError` exceptions that degraded offline availability and asset caching.
**Learning:** Cache Storage API specification prohibits caching HTTP 206 responses and responses with wildcard `Vary: *` headers, throwing runtime exceptions even when `response.ok` is `true`.
**Prevention:** Explicitly check `response.status !== 206` and ensure `Vary` header does not contain `*` inside SW `isCacheable` helpers before invoking `cache.put()`.
