// Private, fork-only app icons.
//
// This file is a build-safe stub: it ships with an empty map so a fresh clone
// always compiles. Add personal entries locally, then run
//   git update-index --skip-worktree lib/private-icons.js
// so your private edits are never tracked or pushed (the public fork keeps the
// empty stub). Private icon components live in lib/components/icons/private/,
// which is gitignored.
//
// Local example (requires `import * as Uebersicht from "uebersicht";`
// and `const { React } = Uebersicht;` at the top):
//   const Coordinator = React.lazy(
//     () => import("./components/icons/private/coordinator.jsx"),
//   );
//   export const privateApps = { Coordinator: Coordinator };

export const privateApps = {};
