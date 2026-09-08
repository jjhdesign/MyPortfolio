# Portfolio Website — Structure & Handoff

## Overview

Single-file portfolio site (`index.html`). No build system, no framework. Pure HTML/CSS/JS.  
Hosted on GitHub Pages. All project data lives in flat text files — no database, no CMS.

---

## File Structure

```
/
├── index.html              # Entire site (HTML + CSS + JS in one file)
├── categories.txt          # Category list for filter bar
├── about/
│   └── about.txt           # About page content
└── projects/
    ├── 2024/
    │   ├── 1/
    │   │   ├── info.txt    # Project metadata + description
    │   │   ├── thumbnail.jpg
    │   │   ├── 1.jpg
    │   │   ├── 2.jpg
    │   │   └── ...
    │   ├── 2/
    │   └── ...
    ├── 2025/
    │   └── ...
    └── 2026/
        └── ...
```

---

## How Projects Work

### Directory naming

- Path: `projects/{year}/{id}/`
- `{year}`: 4-digit folder year (used for year filter)
- `{id}`: integer starting from 1, sequential per year

The site probes for projects up to a hardcoded max count per year (defined in `initProjects()` in `index.html`):

```js
const config = [
  { y: 2026, count: 5 },
  { y: 2025, count: 15 },
  { y: 2024, count: 10 }
];
```

**If you add a project that exceeds the count, it won't appear.** Update this config when adding new slots.

### info.txt format

```
Title: Project Name
Category: Branding
Date: 2025.03 - 2025.06
Contribution: Design 100%
Type: Personal / Class / Client name
Color: #161616
Award: Award name (optional)
===
Description text here.

Second paragraph here.
```

- Everything above `===` is metadata (key: value pairs)
- Everything below `===` is the description (shown in project drawer)
- Blank lines between paragraphs are rendered as separate `<p>` tags
- `Color` sets the thumbnail background color (visible before image loads)
- `Award` field is optional — omit entirely if no award
- `Date` / `Year` field: shown in detail view. The year filter uses the **folder year**, not this value.
- Encoding: UTF-8 preferred. EUC-KR also supported (auto-detected).

### Thumbnail logic

The site tries these filenames in order:
1. `thumbnail.jpg`
2. `thumbnail.jpeg`
3. `thumbnail.png`
4. `1.jpg`
5. `1.jpeg`
6. `1.png`

**Always provide `thumbnail.jpg` or `thumbnail.jpeg` for best results.**

### Detail image loading

Images in the detail view load sequentially: `1.jpg`, `2.jpg`, `3.jpg`, ...  
Supported formats: `jpg`, `jpeg`, `png`, `gif`, `mp4`  
Loading stops after **5 consecutive missing files**.  
Numbering must be continuous (gaps cause early termination).

---

## Adding a New Project

1. Create folder: `projects/{year}/{next_id}/`
2. Add `info.txt` with required fields
3. Add `thumbnail.jpg` + numbered images (`1.jpg`, `2.jpg`, ...)
4. If the new id exceeds the `count` for that year in `index.html`, update the config:
   ```js
   { y: 2025, count: 16 }  // was 15, now 16
   ```
5. Push to GitHub — GitHub Pages serves immediately.

---

## Adding a New Year

1. Create folder: `projects/{new_year}/1/` etc.
2. Add a new entry to `config` in `index.html`:
   ```js
   { y: 2027, count: 5 }
   ```
3. Also add the year to filter bars in `index.html` (two places: desktop `.filter-row` and mobile `#year-list`)  
   OR rely on dynamic year generation — the JS already generates year filters from existing data automatically.

---

## Categories

Defined in `categories.txt` (one per line):

```
Branding
UI/UX
Marketing
Editorial
Web
```

- The filter bar reads this file at runtime
- Category matching is **case-insensitive** (e.g., `BRANDING` matches `Branding`)
- To add a category: add a line to `categories.txt`
- `info.txt` Category field must match exactly (case-insensitive)

---

## About Page (`about/about.txt`)

```
Name: Jaehyun<br>Jeong

[Profile]
Birth: 2002.05.10
Phone: 010-9880-8014
Email: bogus_j@naver.com

[Awards]
2024.12: Award name here

[Experience]
2026.01 —: Role at Organization

[Education]
2024.03 —: University, Major
```

- `Name:` line sets the large heading (supports `<br>` for line break)
- `[Section Name]` creates a new section header
- `Key: Value` lines render as two-column rows
- Lines without a colon render as full-width single-column rows
- Encoding: UTF-8 or EUC-KR (auto-detected)

---

## Site Pages

Three pages, toggled via JS (no routing, no URL change):

| Page ID      | Triggered by            | Notes                         |
|-------------|-------------------------|-------------------------------|
| `page-work`  | Nav "Work" / logo click | Shows project grid + filters  |
| `page-about` | Nav "About" click       | Rendered from `about.txt`     |
| `page-detail`| Click on project card   | Images + bottom drawer        |

---

## Project Drawer (Detail Page)

Bottom sheet that slides up from the detail view.  
Shows: Title, Date, Category, Contribution, Type, Award (if present), Description.  
Toggle with "View details" / "Close" handle.

---

## Responsive Breakpoints

| Breakpoint   | Change                                   |
|-------------|------------------------------------------|
| ≤ 930px     | 2-column grid, mobile dropdown filters   |
| ≤ 550px     | 1-column grid, hamburger nav menu        |
| ≤ 600px     | Drawer content stacks vertically         |

---

## Hosting & Deployment

- Hosted on **GitHub Pages**
- Push to `master` branch → auto-deploy
- Cache busting: image URLs use `?v=8` query param. Increment this number in `index.html` (search `?v=8`) when thumbnails/images aren't refreshing after an update.
- **Does not work from `file://`** — must be served over HTTP(S). Use Live Server (VS Code) or GitHub Pages for local testing.

---

## Key JS Functions (index.html)

| Function         | Purpose                                              |
|-----------------|------------------------------------------------------|
| `initProjects()` | Loads all `info.txt` files, populates `works` array  |
| `parseInfoText()` | Parses a single `info.txt` into a work object       |
| `renderGrid()`   | Re-renders grid based on active category/year filter |
| `showDetail(uid)`| Opens detail page for a given project                |
| `initAbout()`    | Loads and renders `about/about.txt`                  |
| `smartFetchText()` | Fetches text with UTF-8/EUC-KR auto-detection      |
| `fallbackMedia()` | Thumbnail fallback chain on image load error        |

---

## Common Tasks Quick Reference

| Task                        | What to change                                              |
|-----------------------------|-------------------------------------------------------------|
| Add project                 | New folder in `projects/{year}/{id}/`, add `info.txt`       |
| Increase project slot count | Update `config` array in `initProjects()` in `index.html`  |
| Add category                | Add line to `categories.txt`                                |
| Update About page           | Edit `about/about.txt`                                      |
| Fix stale image cache       | Increment `?v=8` → `?v=9` globally in `index.html`         |
| Add new year                | Add `{ y: YYYY, count: N }` to `config` in `index.html`    |
