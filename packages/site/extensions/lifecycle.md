# Lifecycle and cleanup

An extension may be loaded again while you develop it. Treat registrations, event handlers, timers, and object URLs as resources with an owner and an end.

## Register after activation

Call `await activate()` before using APIs that need a host connection. Handle errors from async work rather than starting unobserved promises.

```ts
import { activate, registerCommand, showNotification } from '@lvce-editor/api'

const main = async (): Promise<void> => {
  await activate()
  registerCommand({
    id: 'example.greet',
    async execute() {
      await showNotification('info', 'Hello from my extension')
    },
  })
}

main().catch(console.error)
```

## Dispose resources you replace

Registration APIs such as `registerCommand()` return a `Disposable`. Call `dispose()` when your own code removes or replaces that registration. Use a stable ID, and do not register the same ID repeatedly without disposing the previous registration.

```ts
const registration = registerCommand({
  id: 'example.temporary',
  execute() {},
})

// When this feature is removed or replaced:
registration.dispose()
```

The host owns the lifetime of an isolated extension context. Your code still owns timers, subscriptions, workers, and URLs it creates while that context is alive. Cancel obsolete async work and release its resources. Do not invent a `deactivate` export or subscription API based on another editor; check the LVCE API you are using.

## Check reload behavior

Run a command, rebuild or reload the extension, and run it again. There should be one result per invocation. Cancel a prompt and verify that it leaves the previous state intact. These checks catch duplicate registration and stale async work early.
