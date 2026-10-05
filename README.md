# Deadlock Hero Filter

A dependency-free local webpage for filtering Deadlock heroes and editing their tags.

## Files

* `index.html` - page structure
* `styles.css` - visual design
* `app.js` - filtering, editing, import/export, and localStorage
* `heroes.json` - hero metadata and explicit portrait URLs

## Run It

The most reliable method is a tiny local HTTP server because browsers may block `fetch("heroes.json")` when `index.html` is opened directly with `file://`.

If Python is installed, run this command from this folder:

```sh
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

No packages or build step are required.

## Filtering Logic

Heroes must match every selected filter to be highlighted.

For example, selecting `Tank` highlights heroes tagged as `Tank`. Selecting `Tank` plus `Ganker` only highlights heroes tagged with both `Tank` and `Ganker`. Adding `Melee` further narrows the highlighted heroes to those with all three tags.

This same AND logic applies across all active filters, including multiple selections inside the same category. Heroes that do not match remain visible but are grayscale and faded.

## Filter Categories

The current filter categories are:

* `Roles`
* `Characteristics`
* `Range`
* `Scaling focus` - `Early`, `Mid`, `Late`, `Consistent`
* `mechanics` - `1` through `5`
* `Aim` - `1` through `5`
* `decision-making` - `1` through `5`

## Editing Heroes

1. Click `Edit mode`.
2. Click `Edit` on a hero.
3. Toggle roles, characteristics, range, and scaling focus tags.
4. Select one value each for mechanics, Aim, and decision-making.
5. Click `Save hero`.

Edits are stored in browser `localStorage`, so they survive reopening the page in the same browser.

Use `Export JSON` to create a portable `heroes.json`. Replace the project JSON with that file if you want those changes to become the new baseline.

`Import JSON` loads a previously exported data file.

## Wiki Tags

The current baseline stores each matched hero's source tags from Deadlock Wiki in `wikiTags`. Those tags are translated into the app's filter fields where they clearly match the available filters. Tags that do not map cleanly are preserved in `wikiTags` but not used as filters.

Extra local heroes that are not on the current wiki roster are kept in `heroes.json`, but their existing filter data is not replaced by wiki data.

## Adding A Filter

The visible filter categories are defined in `CONFIG.filterGroups` and `CONFIG.defaultFilterGroups` in `app.js`. The exported `heroes.json` also includes `filterGroups` for portability.

To add a list-based filter category, add it to `CONFIG.filterGroups`:

```js
lanes: { label: "Lane", field: "lanes" }
```

Then add the available values to `CONFIG.defaultFilterGroups`:

```js
lanes: ["Solo", "Duo"]
```

Each hero should also include the matching field:

```json
"lanes": ["Solo"]
```

For number-based single-value filters, add `type: "number"` in `CONFIG.filterGroups`.

The existing rendering and filtering code will automatically create the buttons and require heroes to match every selected value.

## Portraits

Portrait URLs are stored explicitly in `heroes.json` and point to Deadlock Wiki's file redirect endpoint. This means the app does not need to scrape the wiki at runtime.

If a wiki image filename changes, update only that hero's `portrait` field.
