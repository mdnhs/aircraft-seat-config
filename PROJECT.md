# Aircraft Seat Configuration — Project Outline

> AI agent reference document. Read this before touching any code.

---

## What This App Does

An interactive drag-and-drop aircraft cabin seat configuration tool. Users can visually design seat layouts for aircraft by dragging equipment (seats, lavatories, baby cots, wheelchairs, etc.) onto a cabin seat grid. State is persisted in the URL so configurations are shareable.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS v4 + CSS variables (oklch) | 4 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/react | 6.3.1 / 0.4.0 |
| Multi-select | @viselect/vanilla | 3.9.0 |
| URL State | nuqs | 2.8.9 |
| Validation | Zod | 3.25.76 |
| Component primitives | @base-ui/react | 1.4.0 |
| Icons | lucide-react | 1.8.0 |
| Class utilities | clsx + tailwind-merge via `cn()` | — |
| Font | Poppins (Google Fonts, all weights) | — |

> **Warning:** This uses Next.js 16. APIs and file conventions may differ from Next.js 13/14/15. Always check `node_modules/next/dist/docs/` before writing framework-level code.

---

## Project Structure

```
aircraft-seat-config/
├── app/
│   ├── page.tsx              # Entry: renders <AircraftConfig> in <Suspense>
│   ├── layout.tsx            # Root layout: Poppins font, NuqsAdapter, TooltipProvider
│   └── globals.css           # Tailwind v4 imports, oklch CSS vars, selection-area styles
├── components/
│   ├── aircrafts/            # All business logic lives here
│   │   ├── types.ts          # Tool, SeatConfig, CabinConfig interfaces
│   │   ├── constants.tsx     # TOOLS array, AIRCRAFT_TYPE, REG_NO, TOTAL_SEATS, INITIAL_CABINS
│   │   ├── AircraftConfig.tsx     # Root state component: DndContext, nuqs state, cabin CRUD
│   │   ├── AircraftHeader.tsx     # Aircraft metadata display (type, reg, seat counts)
│   │   ├── AircraftToolbar.tsx    # Tab nav: Zones / Wing / Exit Row / Emergency Exit (UI only)
│   │   ├── AircraftSeatMap.tsx    # Cabin grid renderer, EditCabinDialog, EditLabelsDialog
│   │   ├── Seat.tsx               # Droppable seat cell with equipment icon + selection state
│   │   ├── DraggableTool.tsx      # Draggable tool palette item (left sidebar)
│   │   └── AddCabinDialog.tsx     # Add/insert cabin dialog with Zod validation
│   └── ui/                   # shadcn + base-ui primitives (do not modify unless adding new ones)
│       └── button, card, dialog, input, label, badge, select, separator,
│           tabs, context-menu, tooltip
└── lib/
    └── utils.ts              # cn() = tailwind-merge(clsx(...))
```

---

## Data Models

```typescript
// components/aircrafts/types.ts

interface Tool {
  id: string;           // "seat" | "lav" | "baby-cot" | "whchr" | "strchr" | "block" | "delete"
  label: string;
  icon: React.ReactNode;
}

interface SeatConfig {
  [key: string]: string; // key: "rowNumber-colIndex" e.g. "1-0", "2-3"
                         // value: "seat" | "lav" | "lav-occupied" | "baby-cot"
                         //        | "whchr" | "strchr" | "block" | "removed"
}

interface CabinConfig {
  id: string;
  label: string;         // "Economy" | "Business" | "Premium Economy"
  startRow: number;
  endRow: number;
  seatFormat: string;    // e.g. "3-3", "2-2-2", "2-4-2"
  seatSize: "lg" | "md" | "sm";
  customLabels?: string[]; // Column headers, defaults to A, B, C...
}
```

---

## State Architecture

All persistent state lives in the URL via `nuqs`. No Redux, no Zustand, no Context API for data.

```typescript
// AircraftConfig.tsx
const [seatConfig, setSeatConfig] = useQueryState<SeatConfig>("config", parseAsJson(...));
const [cabins, setCabins]         = useQueryState<CabinConfig[]>("cabins", parseAsArrayOf(...));
```

Local React state (not persisted):
- `mounted` — hydration guard
- `selectedSeats: string[]` — currently selected seat IDs for multi-drop
- `activeId: string | null` — currently dragged tool ID (for DragOverlay)

Dialog/editing state lives locally inside `AircraftSeatMap.tsx`.

---

## Key Business Logic

### Drag-and-Drop Flow (`AircraftConfig.tsx`)
1. `handleDragStart` → sets `activeId`
2. `handleDragEnd` → receives `active.id` (tool) + `over.id` (seat key)
   - If seats are selected and drop target is in selection → apply tool to all selected seats
   - **LAV special case**: occupies 2 rows (current row = `"lav"`, next row same col = `"lav-occupied"`). When overwriting a lav, both halves are deleted first.
   - **Delete tool**: removes equipment or marks as `"removed"` (keeps the cell, no equipment)
   - **Seat tool**: if dropped on a lav cell, clears both lav halves before applying

### Cabin CRUD + Row Recalculation (`AircraftConfig.tsx`)
- After any add/edit/delete of a cabin, `recalculateRows()` runs
- Sequentially renumbers all rows across all cabins
- Re-maps `seatConfig` keys to new row numbers (preserves equipment assignments)

### Multi-Select (`AircraftSeatMap.tsx`)
- `@viselect/vanilla` powers click-drag area selection
- Selected cells get `.selected` styling (blue highlight)
- Dropping a tool onto any selected seat applies it to all selected seats

### Column Labels
- Default labels derived from `seatFormat` (A, B, C... with gaps for aisles)
- Per-cabin custom labels editable via `EditLabelsDialog`

---

## Equipment Types Reference

| Value | Meaning | Notes |
|-------|---------|-------|
| `"seat"` | Normal passenger seat | Default |
| `"lav"` | Lavatory (top half) | Always paired with `"lav-occupied"` on next row |
| `"lav-occupied"` | Lavatory (bottom half) | Auto-managed, not user-selectable |
| `"baby-cot"` | Bassinet position | — |
| `"whchr"` | Wheelchair space | — |
| `"strchr"` | Stretcher space | — |
| `"block"` | Blocked seat | — |
| `"removed"` | Cell cleared | No icon rendered |

---

## Styling Rules

- Use `cn()` from `@/lib/utils` for all conditional class merging
- Color tokens: `--primary`, `--secondary`, `--accent`, `--destructive`, `--border`, `--sidebar`
- Never hardcode colors — use CSS variable tokens
- Dark mode: `.dark` class on `<html>` (not `prefers-color-scheme`)
- Seat sizing: `seatSize: "lg" | "md" | "sm"` drives Tailwind size classes per cabin
- `.selection-area` and `.selection-boundary` CSS classes are required by viselect — do not remove

---

## Component Responsibilities (One-Line Summary)

| Component | Owns |
|-----------|------|
| `AircraftConfig` | All state + drag logic + cabin CRUD |
| `AircraftSeatMap` | Cabin rendering + selection + dialogs |
| `AircraftHeader` | Read-only aircraft metadata display |
| `AircraftToolbar` | Tab UI (currently decorative) |
| `Seat` | Single droppable cell + icon rendering |
| `DraggableTool` | Single draggable tool in sidebar |
| `AddCabinDialog` | Add/insert cabin form with validation |

---

## Constants (`components/aircrafts/constants.tsx`)

```typescript
AIRCRAFT_TYPE = "B737-800"
REG_NO        = "N123AA"
TOTAL_SEATS   = 96
JUMP_SEATS    = 4
TOOLS         = [ /* 7 tool definitions */ ]
INITIAL_CABINS = [ /* default cabin layout */ ]
```

---

## What Is NOT Implemented

- **AircraftToolbar tabs** (Zones, Wing, Exit Row, Emergency Exit) — UI exists, no logic
- **Backend / API routes** — fully client-side, no `app/api/`
- **Authentication** — none
- **Persistence beyond URL** — no database, no local storage

---

## Patterns to Follow

1. **State changes always go through `setSeatConfig` / `setCabins`** — never mutate directly
2. **Seat key format**: `"${rowNumber}-${colIndex}"` — both zero-indexed row starts at 1
3. **After cabin mutation** always call `recalculateRows()` to keep rows consistent
4. **New UI components** → install via shadcn CLI, place in `components/ui/`
5. **New aircraft-domain components** → place in `components/aircrafts/`
6. **Validation** → use Zod schemas, consistent with `AddCabinDialog` pattern
7. **No comments unless the WHY is non-obvious**

---

## Running the Project

```bash
npm run dev    # Development server
npm run build  # Production build
npm run lint   # ESLint check
```
