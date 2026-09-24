# Sentinel Journal - Security Learnings

## 2026-09-17 - Unbounded Virtual Keyboard Input Buffer & DoS Risk
**Vulnerability:** The mobile hidden keyboard helper element (`#keyboard-helper`) processed `beforeinput` events without checking character data length or clearing `.value`, allowing oversized inputs/pasting to lock up browser UI threads and cause memory accumulation.
**Learning:** Virtual keyboard helper input elements in browser emulators can act as an unthrottled vector for client-side DoS if `beforeinput`/`input` payloads are not size-capped and reset.
**Prevention:** Always validate `e.data` length (`val.length > 256`), check numeric charcode validity, and reset `input.value = ""` inside helper input event handlers.

## 2026-09-17 - Service Worker Response Stream Reuse & Cache Failures
**Vulnerability:** Asynchronous `response.clone()` inside Service Worker `getCache().then()` callbacks was called after returning the original `response` object to the browser, causing `TypeError: Response body is already used` and leaving cached resources un-updated or failing.
**Learning:** Returning a `Response` stream to the fetch event or browser locks/consumes the stream immediately, making subsequent asynchronous `.clone()` calls fail and corrupting background revalidation.
**Prevention:** Synchronously create a clone (`const copy = response.clone()`) BEFORE returning the response or awaiting asynchronous promises like `caches.open()`.
