# Divi Layout Builder

A React + TypeScript web app for building Divi layouts by dragging preloaded Sections and Modules from local pack assets onto a canvas.

## Features

- Preloaded local library from `src/assets/packs`
- Library browser with:
  - pack filter
  - search
  - tabs for Sections and Modules
- Drag/drop from sidebar to canvas and reorder canvas items
- Per-item canvas controls: rename (local), duplicate, delete
- Export options:
  - **Primary:** best-guess Divi layout wrapper (`divi-layout.json`)
  - **Fallback:** sections-only JSON array (`divi-sections-only.json`)
- No backend required

## Run locally

```bash
npm install
npm run dev
```

## Pack structure

```text
src/assets/packs/
  pack-manifest.json
  pack-aba-core/
    pack.json
    sections/*.json
    modules/*.json
  pack-landing-variants/
    pack.json
    sections/*.json
    modules/*.json
```

- `pack-manifest.json` controls which packs are loaded.
- Each `pack.json` defines metadata:
  - `id`
  - `name`
  - `description`
  - `tags`

## Add new packs quickly

Use the import script to create a pack folder and update the manifest automatically.

```bash
npm run import-pack -- --source=incoming-pack --id=pack-my-items --name="My Items" --description="Imported pack" --tags=marketing,hero
```

### What the script does

- Reads JSON files from `--source` (defaults to `incoming-pack`)
- Detects section/module type from each file
- Generates this structure:
  - `src/assets/packs/<pack-id>/sections/*.json`
  - `src/assets/packs/<pack-id>/modules/*.json`
  - `src/assets/packs/<pack-id>/pack.json`
- Updates `src/assets/packs/pack-manifest.json`

## Export behavior

- **Primary export** wraps built sections in:

```json
{
  "meta": { "format": "divi-layout-builder/v1", "exportedAt": "..." },
  "layout": [ ...sections ]
}
```

- **Fallback export** writes only the final sections array.

### Module drop behavior on empty canvas

If the first dropped item is a module, the app auto-creates a minimal default section wrapper and inserts the module into its first row.

## Tests

```bash
npm run test
```

Covers parser detection, section/module extraction across fixture shapes, and ordered export output.
