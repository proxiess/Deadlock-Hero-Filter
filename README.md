# Deadlock Hero Filter

A dependency-free local webpage for filtering Deadlock heroes and editing their tags.

## Files

- `index.html` — page structure
- `styles.css` — visual design
- `app.js` — filtering, editing, import/export and localStorage
- `heroes.json` — all hero metadata and explicit portrait URLs

## Run it

The most reliable method is a tiny local HTTP server because browsers may block `fetch("heroes.json")` when `index.html` is opened directly with `file://`.

If Python is installed:

    python -m http.server 8000

Run that command from this folder, then open:

    http://localhost:8000

No packages or build step are required.

## Filtering logic

Within each category, selected filters are OR:

    Tank OR Brawler

Across categories, categories are AND:

    (Tank OR Brawler)
    AND
    (Sustain OR Healer)
    AND
    (Long OR Extreme)
    AND
    (Difficulty 2 OR Difficulty 3)

Heroes that fail the combined criteria remain visible but are grayscale and faded.

## Editing heroes

1. Click `Edit mode`.
2. Click `Edit` on a hero.
3. Toggle roles, characteristics, range, objective, and power curve tags.
4. Select exactly one difficulty.
5. Click `Save hero`.

Edits are stored in browser `localStorage`, so they survive reopening the page in the same browser.

Use `Export JSON` to create a portable `heroes.json`. Replace the project JSON with that file if you want those changes to become the new baseline.

`Import JSON` loads a previously exported data file.

## Wiki tags

The current baseline stores each matched hero's source tags from Deadlock Wiki in `wikiTags`.
Those tags are translated into the app's filter fields where they clearly match the available
filters. Tags that do not map cleanly are preserved in `wikiTags` but not used as filters.

The wiki currently lists 32 available heroes. Extra local heroes that are not on that current
roster are kept in `heroes.json`, but their existing filter data is not replaced by wiki data.

## Adding a filter

The filter categories are defined in `heroes.json`:

    "filterGroups": {
      "roles": ["Tank", "Brawler", "Carry", "..."],
      "characteristics": ["Disabler", "Stunner", "..."],
      "range": ["Melee", "Short", "Medium", "Long", "Extreme"],
      "objective": ["Lane Pressure", "Split Push", "..."],
      "powerCurve": ["Early Game", "Mid Game", "Late Game", "Scaling"],
      "difficulty": [1, 2, 3, 4, 5]
    }

Add another category there and add the corresponding property to each hero. For example:

    "lanes": ["Solo", "Duo"]

Then add this one line to `CONFIG.filterGroups` in `app.js`:

    lanes: { label: "Lane", field: "lanes" }

The existing rendering and filtering code will automatically create the buttons and apply the same OR-within / AND-between behavior.

## Portraits

Portrait URLs are stored explicitly in `heroes.json` and point to Deadlock Wiki's file redirect endpoint. This means the app does not need to scrape the wiki at runtime.

If a wiki image filename changes, update only that hero's `portrait` field.

The current wiki roster is a living source and currently lists 44 playable heroes; update `heroes.json` when the roster changes.
