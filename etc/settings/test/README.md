# Settings restoration checks

Run from the repository root with Node.js 20 or later:

```sh
node --experimental-vm-modules etc/settings/test/restore_settings.mjs
node etc/settings/test/reset_application.mjs
```

The checks use the actual Pinia settings/access stores and App persistence watchers with in-memory local storage. They cover recursive unknown-field filtering, API checkbox consistency, independent defaults, malformed JSON and object shapes, strict primitive types, finite numbers, history-list replacement, coordinate pairs and authorization requirements. Obsolete source switches, advanced authorization fields, province switches, tokens and multi-API fields are ignored and removed from saved settings without overriding current values. Geographic calculations are stubbed because restoration does not use them.

Replay checks use the production status state to verify that station replay time starts at zero, is excluded from saved settings, and survives settings restoration within the current session. Old saved `displaySeisNet.delay` values are discarded.

Reset checks exercise the actual settings component handlers with simulated confirmation, storage and page reload APIs. They cover cancellation, repeated clicks, clearing all keys before reload, storage failures and late authorization responses. The App watcher checks use the production status store's `setLocalStorageItem` action to verify that queued and later settings changes cannot repopulate storage during reset. These checks do not clear real application data or restart the application.
