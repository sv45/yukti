# Handoff: Yukti — Clinical Decision Support (EPL Pathway)

A bedside CDS tool for ER clinicians, with a side-by-side **calculator/pathway view** and a **citation-grounded RAG chat panel ("Ask Yukti")**.

---

## About the Design Files

The files under `design_files/` are **design references built as a static HTML/React prototype**. They show intended look and behavior — colors, typography, spacing, structural hierarchy, interaction patterns. They are **not production code to copy directly**.

The task is to **recreate these designs in the target codebase's own environment** (likely Next.js + your component library), using its established patterns. If no codebase exists yet, pick the framework that best fits the team's plans (Next.js + React + TypeScript is the natural default) and use this bundle as the visual + interaction spec.

The prototype uses inline JSX via Babel + plain CSS to keep the file count low and the design legible — production should use proper TS/CSS-in-JS or CSS modules.

---

## Fidelity

**Hi-fi for the visual system, mid-fi for content.**

- **Visual system (colors, type, spacing, radii, components, layout, interaction patterns):** treat as final. Pixel-perfect. Recreate exactly.
- **Clinical content (recommendation copy, dosing specifics, exact citation text, the SRU criteria language):** treat as placeholder. The clinician (Anvitha) is iterating on this — wire it up so it's editable from a content/data layer rather than hard-coded into JSX.

---

## Product context

**Yukti** is a clinical decision-support tool. Two regions on screen:

1. **Left: structured calculator/pathway** — MDCalc-style. Provider enters discrete clinical inputs (GA, Rh status, exam findings, ultrasound findings, optionally hCG trend). The pathway computes interpretation (e.g. "meets SRU 2013 criteria for nonviability"), risk band, and management recommendations.
2. **Right: Ask Yukti** — a chat panel grounded in approved guidelines. Every response cites the same numbered references the calculator does. Auto-injects pathway context (GA, Rh status, hemodynamic stability) into queries.

**Localization is core.** A given institution has a "local protocol" that can override national guidelines on specific items (e.g. RhoGAM dose, referral pathway). Locally-adapted recommendations carry a visible "Locally adapted" tag. The institution chip in the header is the scope: it's the site picker, and everything below adapts to that site's protocol.

---

## Screens / Views

There is **one main screen**, with multiple condition tabs at the top. Only the **Early Pregnancy Loss** tab is built out in this prototype; the others (PUL/Ectopic, Medication Abortion, Contraception & EC) are stubbed as "Soon" badges.

### Layout (3 rows × 2 columns)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER   60px   logo + wordmark        site chip       │
├─────────────────────────────────────────────────────────┤
│  TABS     44px   EPL · PUL · Med Abortion · Contra      │
├─────────────────────────────────────────────────────────┤
│                                          │              │
│  CDS pathway (left)                      │   Ask Yukti  │
│  max-width 920px, centered               │   360px      │
│  vertical scroll                         │   sticky     │
│                                          │              │
└─────────────────────────────────────────────────────────┘
```

Body grid: `grid-template-columns: 1fr 360px`. The right rail is sticky and fills the viewport below the chrome.

---

### Header

- **Background**: `var(--yk-sage-50)` (#F2F5F1).
- **Border-bottom**: 1px `var(--yk-sage-200)`.
- **Padding**: `0 20px 0 14px`.
- **Brand cluster (left)**: 36×36 sage circle (`bg: --yk-sage-500` / `border: --yk-sage-600`) containing a 24×24 logo image, gap 12px, then wordmark "yukti" — 16px, weight 600, letter-spacing -0.02em, color `var(--yk-ink-900)`.
- **Site chip (right)**: pill, white bg, 1px `--yk-sage-300` border, radius 999px, padding `5px 12px`, 12.5px text. Layout: bold institution name + dot separator + smaller location text + caret. Hover: bg `--yk-sage-100`, border `--yk-sage-500`.

> **Open question** (with the clinician): what does the site chip really represent — institution only, or institution + city? The current chip shows both. The decision affects whether clicking it opens a site picker (probably yes) and whether the city ever changes independently (probably no). Treat the chip as "site picker" and put the city inside the dropdown rather than on the chip surface.

### Tabs

- **Background**: `var(--yk-sage-50)`.
- **Border-bottom**: 1px `var(--yk-sage-200)`.
- Each tab: transparent bg, 13.5px text, `var(--yk-ink-600)` color. Selected: `var(--yk-ink-900)`, weight 600, 2px bottom border in `--yk-sage-500` (hover `--yk-sage-600`).
- Disabled tabs render their label faded with a small "Soon" pill (`.tab__badge`).

### CDS pathway (main column)

Padding 28px / 32px / 80px. max-width 920px. Centered.

**Page header**: 22px title (`--yk-ink-900`, weight 600, letter-spacing -0.02em), 13px subtitle (`--yk-ink-600`, max 60ch), then a slim inline "local protocol" line:

```
[M] Memorial Regional protocol · 3 local adaptations    View differences
```

The `[M]` is a 14×14 sage-500 filled circle with white "M". Type is 12px, color `--yk-ink-600`. "View differences" is an underlined link in `--yk-sage-700`.

**Emergent alert (conditional)** — appears at top when red-flag findings present (unstable hemodynamics / heavy bleeding / large free fluid / signs of infection). Risk-high colors, 4px left bar, "!" badge, action button to ask Yukti for stabilization steps.

**Sections** — repeating card pattern:

- White card, 1px `--yk-sage-200` border, radius 10px, margin-bottom 14px.
- Section header: padding 12px 18px 11px, `bg: --yk-sage-50`, border-bottom 1px `--yk-sage-100`. Contains the section title (14.5px, weight 600). Section eyebrow numbers and subtitles exist in the source but are hidden by default — the deliberate choice is "less chrome."
- Body: a stack of `.row` elements.

**Row pattern** (the workhorse of the calculator):

- Grid: `minmax(220px, 1fr) auto`, gap 14px, padding 10px 18px.
- Min-height 46px. Border-bottom 1px `--yk-sage-100` between rows.
- Label cell: 13.5px label + optional 11.5px hint + optional citation superscript.
- Right cell (`.row__right`, flex, gap 10px): control + optional `.pts` flag pill.
- The pills are **deliberately suppressed** for routine answers — they only render when the answer is clinically meaningful (`→ consult OB`, `incomplete`, `+RhIG`, `type & screen`). The high-flag variant uses the risk-high color tokens.

**Controls used:**

- `Segmented` — pill group, sage-50 background, 6px radius. Inactive options: transparent bg, `--yk-ink-700`. Hover: `--yk-sage-100`. Selected: solid `--yk-sage-500` bg, white text, hover `--yk-sage-600`. This is the **primary control** — we use it for almost every clinical input.
- `NumInput` — number + unit pair. White bg, 1px `--yk-ink-200`, radius 6px. Mono font (IBM Plex Mono). Right-aligned, tabular nums. Unit on the right in a 50%-tinted strip. Focus: 1px `--yk-sage-500` border + 3px `rgba(150,166,149,0.25)` ring.

**Result block** — appears at the bottom of a section when a computed result is available. Background `--yk-paper`, top border 1px `--yk-sage-200` (was originally ink — adopt sage). Layout: label + primary value (mono, 18px) + detail line + risk band pill.

**Risk band pill** — `risk-band--low/mod/high/info`. Uses the `--yk-risk-*` tokens (clinical color, never decoration). 999px radius, 6px 12px, 12px weight 600 + a 7px filled dot in `currentColor`.

**Recommendation block** (Diagnosis & Management section):

- Grid: `28px 1fr auto`. Gap 14px.
- Bullet (`.rec__bullet`): 22px sage-500 filled circle, white "A"/"B"/"C" inside, mono 11px.
- Title 14px weight 600, body 13px `--yk-ink-700` line-height 1.55, `<strong>` bumps to ink-900.
- Optional `.quote` block — 12.5px italic, 3px left border in `--yk-ink-200`, smart curly quotes wrapping the content via `::before/::after`.
- Optional tag chips inline (`.tag`, `.tag-local`).
- Right cell: an "Ask Yukti about this →" button (`.rec__ask`) that injects the recommendation as a prompt into the chat panel.

**Branch table** (Disposition section):

- Two columns: 110px monospaced uppercase condition + flowing action prose. Dashed bottom border between rows.

**Reference list** (footer of the column): white card, numbered list. Counters render as 22×22 sage-100 squares. Each `.refs__item` has a `scroll-margin-top` so anchored jumps from citations land below the sticky chrome. `:target` highlights the row in sage-100.

**Disclaimer**: dashed border, sage/ink-50 bg, 12px centered. Standard "for clinical decision support only — not a substitute for clinical judgment."

### Ask Yukti (right rail)

- Sticky, 360px wide, full viewport height below chrome.
- White surface, sage-200 left border.
- **Header strip**: sage-50 bg, sage-200 bottom border. Title "Ask Yukti" with a 7px sage-500 dot + sage-100 halo. Sub-line in `--yk-ink-500`.
- **Context strip** (`.rail__ctx`): a 1-line summary of the current pathway state, mono-formatted: `CONTEXT  GA 8w1d · Rh N · stable`. Sage-50 bg.
- **Body**: scrollable message list. User bubbles right-aligned, sage-500 fill, white text, 14/14/4/14 radius. Bot messages left-aligned, no fill, 13px text, with an uppercase mono "Sources" line above the message and inline `.msg__chip` pills for each citation (sage-100 fill, sage-200 border, click to scroll-jump to the reference).
- **Empty state**: centered icon (36px sage-100 circle, sage-700 icon) + 240px wrapped copy.
- **Suggestions**: vertical list of `.suggest` buttons above the input, sage-50 fill on hover.
- **Input bar**: pill, white bg, 1px `--yk-ink-200`. Focus: sage-500 border + sage-tinted ring. Send button 30×30 sage-500 circle on the right; hover sage-600.
- **Footer**: 11px disclaimer, top border 1px `--yk-sage-100`.

> **Mock the chat for now.** Real RAG comes later. The prototype's `AskYukti.jsx` keys mocked answers off keywords — replace with the actual retrieval call when the backend is ready. Keep the citation-chip contract: every answer must come with an array of reference IDs that resolve to entries in `data/refs.js`.

---

## EPL pathway — section content (current state)

These are the sections in order. The exact clinical copy is being iterated and should live in a content layer (CMS, JSON in repo, or Sanity/Contentful) so the clinician can edit without touching code.

1. **Patient context** — Gestational age (weeks + days, two `NumInput`s side by side), Rh status (segmented).
2. **Clinical findings** — Hemodynamic status, vaginal bleeding, signs of infection, products of conception at os. Each is its own row with a segmented control.
3. **Transvaginal ultrasound** — Six independent rows (this is the recently-redesigned section; was a single 10-option mega-row, now decomposed into orthogonal questions):
   - IUP seen? (na / yes / no)
   - Cardiac activity? (na / present / absent)
   - CRL band (none / <7mm / ≥7mm)
   - MSD band (none / <25mm no embryo / ≥25mm no embryo)
   - Time since sac without YS (na / <2w / ≥2w)
   - Time since sac with YS (na / <11d / ≥11d)
   - Free fluid in cul-de-sac (none / trace / mod / large)
   - The system computes which SRU 2013 criterion is met and renders a Result block.
4. **β-hCG (optional)** — Collapsed by default. Section header has a `+ Add hCG trend` toggle button (`.hcg-toggle`). When expanded: initial hCG, 48h repeat hCG, computed % change, interpretation block. **This collapse is intentional** — not all providers use the field; routine cases shouldn't see it.
5. **Diagnosis & Management** — Synthesis tag (right-side of section header). Recommendations are rendered with `Recommendation` component. Local-adaptation tag appears when the recommendation is overridden by site protocol.
6. **Disposition** — Branch table.

---

## Interactions & Behavior

- **Pathway state** lives in a single object on `App` and is passed down via props. State keys are listed in `App.jsx`.
- **Citation chips** (`.row__cite`, `.msg__chip`) are anchor links to `#ref-<id>` on the reference-list footer. The list uses `scroll-margin-top` to clear the sticky chrome on jump.
- **Ask Yukti button on a recommendation** sets a pending prompt on App state; the rail consumes it and immediately fires a synthetic message into the chat. Use this pattern: parent owns "pending question," child reads-and-clears.
- **Local-protocol differences button** in the inline banner — currently a no-op. Should open a modal/drawer listing every place the site protocol overrides national guidance.
- **Tab switching** — currently only EPL is implemented. Other tabs are disabled-looking with a "Soon" pill.

### Hover & focus

- All hover transitions are `0.12s` linear on `background`, `color`, `border-color`.
- Focus rings on inputs: 3px sage tint at ~25% alpha (`rgba(150,166,149,0.25)`).
- Buttons have visible `:focus-visible` styles using the same sage ring.

---

## State Management

The prototype uses one `useState` on `App` holding the pathway object, plus separate state for active tab, institution, and the pending Ask-Yukti prompt. In a real implementation:

- Pathway state belongs in a store (Zustand / Redux Toolkit / React Query for persisted draft).
- A "draft encounter" should persist to localStorage so a refresh doesn't wipe inputs.
- Final values + computed interpretation should be serializable for handoff to the EHR.
- Localization (which protocol overrides apply) should be a server-fetched config keyed on institution, not bundled.

---

## Design Tokens

All tokens live in `design_files/styles/tokens.css`. The full file is the source of truth — bring it across verbatim and only change what the codebase requires.

### Color — Brand sage (anchor: #96A695)

| Token | Hex | Use |
|---|---|---|
| `--yk-sage-50`  | `#F2F5F1` | App, header, tabs, section header backgrounds; chip surfaces |
| `--yk-sage-100` | `#E6EBE5` | Hover surface for tinted controls; chat bot chips; reference number squares |
| `--yk-sage-200` | `#D6DDD5` | Card borders; rail border; chip border |
| `--yk-sage-300` | `#C6CFC5` | Site chip border; toggle border |
| `--yk-sage-400` | `#B0BCAF` | (reserved — currently unused) |
| `--yk-sage-500` | `#96A695` | **PRIMARY brand.** Logo badge fill, active segmented option, send button, recommendation bullets, user message bubbles, focus rings |
| `--yk-sage-550` | `#8FA18F` | Subtle hover for tinted surfaces |
| `--yk-sage-600` | `#6E8270` | **HOVER** for solid sage surfaces |
| `--yk-sage-700` | `#5B7159` | Links, citation color, strong sage icons |
| `--yk-sage-800` | `#3F5340` | (reserved) |
| `--yk-sage-900` | `#2C3A2D` | Strong text on sage tints |

> Sage is **the** color. Use clinical risk colors (`--yk-risk-*`) only for actual risk states, never for emphasis. There is no secondary brand color. There is no purple — earlier prototypes had a localization purple; that's been removed.

### Color — Ink (true black for body text)

| Token | Hex |
|---|---|
| `--yk-ink-900` | `#000000` |
| `--yk-ink-800` | `#15171A` |
| `--yk-ink-700` | `#2A2D32` |
| `--yk-ink-600` | `#4B5159` |
| `--yk-ink-500` | `#6A7079` |
| `--yk-ink-400` | `#8E939B` |
| `--yk-ink-300` | `#B7BCC2` |
| `--yk-ink-200` | `#D6DADE` |
| `--yk-ink-150` | `#E4E7EA` |
| `--yk-ink-100` | `#EEF0F2` |
| `--yk-ink-50` | `#F6F7F8` |

### Color — Clinical risk (semantic only)

| Surface bg | fg | border | Use |
|---|---|---|---|
| `--yk-risk-low-bg` `#E8F3EC` | `--yk-risk-low-fg` `#1F6B3A` | `--yk-risk-low-bd` `#BFE0CB` | Reassuring / viable / falling hCG consistent with EPL |
| `--yk-risk-mod-bg` `#FBF1DC` | `--yk-risk-mod-fg` `#8A5A0B` | `--yk-risk-mod-bd` `#ECD79E` | Suggestive / monitor / repeat scan |
| `--yk-risk-high-bg` `#FBE6E3` | `--yk-risk-high-fg` `#9B2914` | `--yk-risk-high-bd` `#F0BFB6` | Definitive failure / red-flag finding / consult OB |
| `--yk-info-bg` `#E3EEF0` | `--yk-info-fg` `#1A4F5A` | `--yk-info-bd` `#C7DDE1` | Reference-only / wrong-pathway routing |

### Typography

| Family | Use |
|---|---|
| Inter (400/500/600/700) | All sans copy |
| IBM Plex Mono (400/500) | Numeric values, citations, codes, "CONTEXT" labels |

Body: 14px / 1.45. Sizes used (px): 22 (page title), 18 (mono primary), 16 (header wordmark), 14.5 (section title), 14 (rec title), 13.5 (row label, tab label), 13 (rec body, msg, input), 12.5 (subtitles, hints in some places), 12 (small UI), 11.5 (hints, sources line), 11 (mono refs, code), 10.5 (chips, eyebrow). Letter-spacing -0.02em on display titles, -0.005em on section titles, +0.06em / +0.08em on uppercase eyebrow labels.

### Spacing & sizing

- Header: 60px. Tabs: 44px. Right rail: 360px. CDS max-width: 920px.
- Section card padding: 0 (children manage padding); section header padding 12/18/11.
- Row padding: 10/18; min-height 46.
- Result block padding: 14/18.

### Radius

| Token | Value | Use |
|---|---|---|
| `--yk-radius-sm` | 4px | Inner segmented option |
| `--yk-radius-md` | 6px | Inputs, buttons, hCG toggle |
| `--yk-radius-lg` | 10px | Section cards, references card |
| `--yk-radius-xl` | 14px | (Reserved — message bubbles use raw 14px) |
| 999px | — | All chips, pills, badges, send button, focus rings |

### Shadow

| Token | Value | Use |
|---|---|---|
| `--yk-shadow-sm` | `0 1px 2px rgba(17,24,28,0.04), 0 1px 1px rgba(17,24,28,0.03)` | Active segmented option |
| `--yk-shadow-md` | `0 4px 12px rgba(17,24,28,0.06), 0 1px 2px rgba(17,24,28,0.04)` | (Reserved for elevated overlays) |

### Transitions

`0.12s` on `background`, `color`, `border-color`, `box-shadow` for all hover/focus/press states.

---

## Assets

- **Logo**: `assets/yukti-logo.png` — referenced inside the 36px circle badge in the header. The brand circle should sit on top of `--yk-sage-50`.

That's it for assets. All other "iconography" in the prototype is text glyphs, mono characters, or CSS dots — no icon library is used. Decide on an icon set when integrating (Lucide is a sane default; keep stroke 1.5).

---

## Files in this bundle

```
design_handoff_yukti/
  README.md                                    ← you are here
  design_files/
    Yukti EPL Pathway.html                     ← entry point — open this to see the full prototype
    styles/
      tokens.css                               ← design tokens (single source of truth)
      app.css                                  ← component styles
    components/
      App.jsx                                  ← shell, state, tabs
      EPLPathway.jsx                           ← main calculator (left column)
      AskYukti.jsx                             ← chat rail (right column)
      primitives.jsx                           ← Section, Row, Segmented, NumInput, Recommendation, Cite, RiskBand, ResultBlock
    data/
      refs.js                                  ← reference list (citations resolve to these)
```

---

## Implementation notes for Claude Code

- Bring `tokens.css` across as-is (or port to your token system unchanged — values are intentional).
- The primitives in `primitives.jsx` are the pattern library: `Section`, `Row`, `Segmented`, `NumInput`, `Recommendation`, `RiskBand`, `Cite`, `ResultBlock`. Build these as real components first; then the EPL pathway becomes data-driven on top of them.
- Segmented controls do a lot of work in this design — invest in making yours flexible (variants for ≤3 options vs many; wrapping behavior; keyboard nav).
- Keep clinical content out of JSX. Define each pathway as a config (sections → rows → control config + scoring rules → recommendations) and render generically.
- The "Locally adapted" tag, the inline local-protocol banner, and the locally-overridden recommendations should all read from one localization config so a site admin can flip a single source of truth.
- Citation chips are a contract: every recommendation, every chat answer, every adapted item references one or more refs in `refs.js` by ID. Don't break this — it's the trust spine of the product.
