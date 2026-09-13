# Cart edit safeguards

Unsaved active cart configuration changes block React Router navigation and
offer Keep editing or Discard edits and leave. Browser reload, closing and plain
anchor navigation use the native beforeunload warning (browser-dependent).
Successful save bypasses the guard and displays a status message in the cart.
Normal studio drafts are not blocked and continue autosaving.

The router wrapper now uses createBrowserRouter/RouterProvider so useBlocker can
handle in-app navigation, including history navigation. Existing route elements
remain unchanged. No new dependencies or stylesheet changes were introduced.

Lint, TypeScript/Vite build and diff whitespace checks pass. Browser checks verify
editing a saved character, blocked cancel navigation, Keep editing retaining the
change, restoring the original character and save confirmation. The user's saved
design and quantity are unchanged by that test. Discard flow now also passes:
temporary Z edit discarded, original HELLO configuration and quantity preserved.
Native reload was attempted, but the in-app browser exposed no inspectable
beforeunload dialog and retained the edited page. This is not a verified native
warning test. The user subsequently confirmed the requested manual browser
refresh-and-cancel check works, completing this verification checkpoint.
Captured console history includes a transient Vite App-is-not-defined error from
the intermediate router rename; the completed source passes lint/build.
