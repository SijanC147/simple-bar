---
name: add-simple-bar-icon
description: Create new SVG icon components for simple-bar from SVG content. Takes an SVG string (or just inner path/group elements) and a title, creates a JSX icon component, registers it in icons.jsx, and maps it in app-icons.js. Use when adding icons, creating icon components from SVGs, or when the user wants to add a new app icon to simple-bar.
---

# Add Simple-Bar Icon

## Inputs

1. **SVG content**: A full `<svg>...</svg>` element, or just inner elements (`<path>`, `<g>`, `<circle>`, etc.)
2. **Title**: The component name in PascalCase (e.g. `ChatGPT`, `Cursor`, `MyNewApp`)
3. **App name(s)** (optional): Display name(s) for `app-icons.js`. Defaults to the title.

## Step 1: Extract and prepare SVG internals

If a full `<svg>` tag is provided, strip the outer `<svg>` wrapper and keep only the children elements.

**Convert SVG/HTML attributes to JSX camelCase:**

| SVG attribute      | JSX attribute    |
|--------------------|------------------|
| `fill-rule`        | `fillRule`       |
| `clip-rule`        | `clipRule`       |
| `stroke-width`     | `strokeWidth`    |
| `stroke-linecap`   | `strokeLinecap`  |
| `stroke-linejoin`  | `strokeLinejoin` |
| `fill-opacity`     | `fillOpacity`    |
| `stroke-opacity`   | `strokeOpacity`  |
| `stroke-dasharray` | `strokeDasharray`|
| `stroke-dashoffset`| `strokeDashoffset`|
| `class`            | `className`      |

**Remove these attributes entirely:** `xmlns`, `xmlns:xlink`, `xml:space`

**Check the viewBox:** If the SVG uses a viewBox other than `0 0 24 24`, note the width and height values to pass to the `Icon` component. If the viewBox is not 24x24, the paths may need to be rescaled or the Icon dimensions overridden.

## Step 2: Derive the kebab-case filename

Convert the PascalCase title to kebab-case:
- Insert a hyphen before each uppercase letter that follows a lowercase letter or digit
- For consecutive uppercase letters (acronyms) followed by a lowercase letter, split before the last uppercase letter of the group
- Lowercase everything

| PascalCase          | kebab-case           |
|---------------------|----------------------|
| `Cursor`            | `cursor`             |
| `ChatGPT`           | `chat-gpt`           |
| `MyNewApp`          | `my-new-app`         |
| `VSCode`            | `vs-code`            |
| `GoogleChrome`      | `google-chrome`      |
| `AffinityDesigner`  | `affinity-designer`  |

## Step 3: Create the icon JSX file

Create `lib/components/icons/library/<kebab-case>.jsx`:

```jsx
import Icon from "../icon.jsx";

export default function ComponentName(props) {
  return (
    <Icon {...props}>
      {/* SVG inner elements here */}
    </Icon>
  );
}
```

If the original SVG viewBox is **not** `0 0 24 24`, pass explicit dimensions:

```jsx
<Icon {...props} width={W} height={H}>
```

### Format rules

- The function name is the PascalCase title exactly as provided
- Use `export default function` (not arrow functions, not named exports)
- Spread `{...props}` on the `Icon` component
- Preserve all `fill`, `stroke`, and other styling attributes from the original SVG paths
- Keep multi-path SVGs as multiple sibling elements inside `<Icon>`

## Step 4: Register in icons.jsx

Add a lazy export to `lib/components/icons/icons.jsx` in **alphabetical order** among the existing exports.

For short import paths (single-word or short names):

```jsx
export const Name = React.lazy(() => import("./library/kebab-name.jsx"));
```

For longer import paths, use the multi-line format:

```jsx
export const LongerName = React.lazy(
  () => import("./library/longer-name.jsx"),
);
```

**Important:** Insert the new export line at the correct alphabetical position. Compare against the surrounding export names to find the right spot.

## Step 5: Add to app-icons.js

Add an entry to the `apps` object in `lib/app-icons.js` in **alphabetical order**.

For single-word app names that are valid JS identifiers:

```js
  AppName: Icons.AppName,
```

For multi-word app names or names with special characters, use quotes:

```js
  "App Name": Icons.AppName,
```

If the user provides multiple app name variants (e.g. an app that goes by different names), add separate entries for each, all pointing to the same icon.

## Verification checklist

After completing all steps, verify:

- [ ] SVG attributes are converted to JSX camelCase
- [ ] No `xmlns` or similar XML-only attributes remain
- [ ] JSX file created at `lib/components/icons/library/<kebab-case>.jsx`
- [ ] File uses `import Icon from "../icon.jsx"`
- [ ] Function name matches the PascalCase title
- [ ] Export in `icons.jsx` is in alphabetical order
- [ ] Entry in `app-icons.js` is in alphabetical order
- [ ] ViewBox dimensions handled if not 24x24
