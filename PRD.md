# PRD: Claude Code Session Analyzer

## Overview

A lightweight, browser-based desktop application for analyzing Claude Code session logs in real-time. Helps developers track costs, understand agent behavior, and optimize their AI-assisted coding workflows.

---

## Problem Statement

**Current Pain Points:**

- Claude Code session logs are scattered across `~/.claude/projects/` in JSONL format
- No visibility into token usage, costs, or agent behavior patterns
- Difficult to understand what sub-agents are doing behind the scenes
- No easy way to track spending across multiple coding sessions
- Manual log parsing is time-consuming and error-prone

**User Need:**
Developers using Claude Code (especially those building orchestration tools or running multiple sessions) need a quick, visual way to:

1. See all their projects and sessions at a glance
2. Understand token usage and associated costs
3. Identify optimization opportunities (excessive sidechain calls, cache inefficiency)
4. Debug agent behavior during complex workflows

---

## Goals & Non-Goals

### Goals

- ✅ Real-time log scanning with auto-refresh
- ✅ Intuitive drill-down navigation (Projects → Sessions → Messages)
- ✅ Accurate cost calculations for Claude Sonnet 4.5 pricing
- ✅ Visual breakdown of token types (input, cache, output)
- ✅ Sidechain vs. main thread analysis
- ✅ Zero-config local deployment (runs on localhost)
- ✅ Fast initial load (<2s for typical project count)

### Non-Goals

- ❌ Cloud deployment or multi-user support
- ❌ Historical trending (v1 focuses on current state)
- ❌ Log editing or session replay
- ❌ Integration with Anthropic API for live session monitoring
- ❌ Cross-platform packaging (Electron/Tauri) in v1

---

## User Stories

### Primary Personas

**1. Solo Developer (Testing Orchestrator)**

- "I want to see which of my test sessions cost the most so I can optimize my prompts"
- "I need to verify my sub-agents aren't making redundant API calls"

**2. Power User (Heavy Claude Code Usage)**

- "I want to track my monthly Claude Code spending across all projects"
- "I need to understand cache hit rates to see if context is being reused efficiently"

### User Flows

#### Flow 1: Quick Cost Check

1. User opens app (localhost:5173)
2. Sees list of all projects with total cost displayed
3. Clicks project → sees all sessions sorted by date
4. Identifies expensive session at a glance
5. Clicks session → sees per-message breakdown

#### Flow 2: Debug Sidechain Behavior

1. User runs Claude Code session with orchestrator
2. Refreshes analyzer app (auto-scans new logs)
3. Clicks into latest session
4. Filters view to "Sidechain Only"
5. Sees which sub-agents fired, in what order, with token costs
6. Identifies redundant analysis step
7. Adjusts orchestrator prompts

#### Flow 3: Monthly Budget Review

1. User opens app at end of month
2. Sees total spend across all projects in header
3. Exports session data to CSV
4. Reviews top 10 most expensive sessions

---

## Features & Requirements

### Core Features (V1 - MVP)

#### 1. Project Scanner

**Description:** Auto-scan `~/.claude/projects/` on page load and manual refresh

**Requirements:**

- Read all directories in `~/.claude/projects/`
- For each project, scan all `.jsonl` files
- Parse JSONL format (one JSON object per line)
- Handle malformed JSON gracefully (skip and log warning)
- Cache results in memory (no persistent storage in v1)
- Provide manual "Refresh" button
- **Performance:** Scan 50 projects with 200 sessions in <3s

**Edge Cases:**

- Empty project directory → show "No sessions found"
- Corrupted JSONL file → skip file, show warning badge
- Missing `.claude/projects/` → friendly error message

---

#### 2. Project List View

**Description:** Homepage showing all projects with summary stats

**UI Components:**

- Header: "Claude Code Session Analyzer" + total cost across all projects
- Search bar: Filter projects by name
- Project cards (grid layout):
  - Project name
  - Session count
  - Total cost
  - Last activity timestamp
  - Click anywhere on card to drill down

**Data Displayed:**

- Project name (directory name)
- Number of sessions
- Total cost (sum of all sessions)
- Most recent session timestamp

**Sorting Options:**

- Most expensive (default)
- Most recent
- Alphabetical
- Session count (descending)

**Acceptance Criteria:**

- Projects load within 2s on typical hardware
- Search filters in real-time (no search button needed)
- Cost displayed with 4 decimal places (`$0.0086`)

---

#### 3. Session List View

**Description:** Shows all sessions for a selected project

**UI Components:**

- Breadcrumb: `Projects > {ProjectName}`
- Back button
- Session cards (list layout):
  - Filename
  - Session ID (truncated with copy button)
  - Message count
  - Total cost
  - Sidechain percentage
  - Timestamp range (first → last message)
  - Click to view details

**Data Displayed:**

- Session filename (e.g., `14d75d9b-session.jsonl`)
- Session ID from logs
- Total messages in session
- Cost breakdown: `$X.XX (Y% sidechain)`
- Time range: "Jan 15, 2:30 PM → 2:45 PM"

**Sorting Options:**

- Most recent (default)
- Most expensive
- Longest (by message count)

**Acceptance Criteria:**

- Sessions sorted by timestamp descending by default
- Sidechain percentage displayed as badge (red if >70%)
- Clicking session navigates to detail view

---

#### 4. Session Detail View

**Description:** Deep dive into a single session with per-message analysis

**UI Layout:**

```
┌─────────────────────────────────────────┐
│ Breadcrumb + Back Button                │
├─────────────────────────────────────────┤
│ SESSION SUMMARY CARD                    │
│ • Total Cost: $0.0824                   │
│ • Messages: 47 (32 main, 15 sidechain) │
│ • Tokens: 125K in, 8.2K out             │
│ • Cache Hit Rate: 18.5x                 │
│ • Duration: 15m 32s                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ FILTERS                                 │
│ [ All ] [ Main Thread ] [ Sidechain ]  │
│ [ Show User ] [ Show Assistant ]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ MESSAGE TABLE                           │
│ Timestamp | Role | Type | Tokens | Cost │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ 2:30:01  | Asst | Main | 1.2K   | $0.02│
│ 2:30:15  | Asst | Side | 850    | $0.01│
│ ...                                     │
└─────────────────────────────────────────┘
```

**Data Displayed Per Message:**

- Message ID (truncated, hover for full)
- Timestamp (HH:MM:SS)
- Role (User/Assistant)
- Type (Main Thread/Sidechain) with icon
- Model used (e.g., "Sonnet 4.5")
- Token breakdown:
  - Input tokens
  - Cache write tokens
  - Cache read tokens
  - Output tokens
- Individual message cost
- Expandable content preview (first 200 chars)

**Interactive Features:**

- Click row to expand full message content
- Filter by message type (main/sidechain)
- Filter by role (user/assistant)
- Sort by cost, timestamp, or tokens
- Copy message ID on click

**Token Visualization:**

- Small inline bar chart showing token type distribution
- Tooltip on hover with exact counts

**Acceptance Criteria:**

- All messages render within 1s for sessions <100 messages
- Filters apply instantly (no loading state)
- Expandable message content shows formatted JSON
- Copy-to-clipboard works for all IDs

---

#### 5. Cost Calculator

**Description:** Backend utility for accurate cost calculations

**Pricing Model (Claude Sonnet 4.5):**

```javascript
const PRICING = {
  input: 3.0, // per million tokens
  cacheWrite: 3.75, // cache creation
  cacheRead5m: 0.3, // 5-minute cache tier
  cacheRead1h: 0.15, // 1-hour cache tier (future)
  output: 15.0, // generated tokens
};
```

**Formula:**

```
messageCost = (
  (input_tokens × $3.00) +
  (cache_creation_input_tokens × $3.75) +
  (cache_read_input_tokens × $0.30) +
  (output_tokens × $15.00)
) / 1,000,000
```

**Requirements:**

- Handle missing token fields (default to 0)
- Support cache tier detection (5m vs 1h)
- Round costs to 4 decimal places
- Return cost in USD ($)

**Edge Cases:**

- Missing usage object → return $0.00, log warning
- Negative token counts → treat as 0
- Unexpected token fields → ignore gracefully

---

#### 6. Real-Time Refresh

**Description:** Manual and auto-refresh capabilities

**V1 Implementation:**

- Manual refresh button in header
- Keyboard shortcut: `Cmd/Ctrl + R` (browser default works)
- Re-scans entire `~/.claude/projects/` directory
- Shows loading spinner during scan
- Preserves navigation state (stays on current view)

**Nice-to-Have (V1.1):**

- Auto-refresh every 30s (toggleable)
- File system watcher for instant updates
- Badge notification for new sessions

**Acceptance Criteria:**

- Refresh completes in <3s for typical project count
- Loading state visible during scan
- No navigation disruption (stay on current project/session)

---

### Technical Architecture

#### Tech Stack

```
Frontend:  React 19 + TypeScript + Tailwind CSS + Vite
Backend:   Node.js (Express) simple API server
Scanning:  Node.js fs/promises for file I/O
Dev:       Concurrent dev servers (Vite + Express)
Build:     Static build with pre-computed data (future)
```

#### File Structure

```
claude-session-analyzer/
├── src/                          # React app
│   ├── components/
│   │   ├── ProjectList.tsx
│   │   ├── SessionList.tsx
│   │   ├── SessionDetail.tsx
│   │   ├── MessageTable.tsx
│   │   └── SummaryCard.tsx
│   ├── utils/
│   │   ├── costCalculator.ts
│   │   └── formatters.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── server/                       # Express API
│   ├── scanner.js               # File system scanner
│   ├── api.js                   # REST endpoints
│   └── utils/
│       └── parser.js            # JSONL parser
├── package.json
├── vite.config.ts
└── tsconfig.json
```

#### API Endpoints

```typescript
GET /api/projects
Response: Project[]

GET /api/sessions/:projectName
Response: Session[]

GET /api/session-detail/:projectName/:sessionId
Response: SessionDetail
```

#### Data Models

```typescript
interface Project {
  name: string;
  path: string;
  totalSessions: number;
  totalCost: number;
  lastActivity: string; // ISO timestamp
  sessions: Session[];
}

interface Session {
  filename: string;
  sessionId: string;
  messageCount: number;
  totalCost: number;
  sidechainCount: number;
  sidechainPercentage: number;
  totalTokens: number;
  firstMessage: string; // ISO timestamp
  lastMessage: string;
}

interface SessionDetail extends Session {
  messages: Message[];
}

interface Message {
  messageId: string;
  timestamp: string;
  isSidechain: boolean;
  role: "user" | "assistant";
  model: string;
  usage: {
    input_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
  };
  cost: number;
  content?: string; // Optional message content preview
}
```

---

### UI/UX Design

#### Design Principles

1. **Speed First:** Every interaction feels instant
2. **Scannable:** Key metrics visible without scrolling
3. **Drill-Down:** Progressive disclosure (overview → detail)
4. **Developer-Friendly:** Monospace fonts for IDs, copy buttons everywhere

#### Color Palette (Dark Theme)

```css
Background: zinc-900, zinc-800, zinc-700
Text: slate-100, slate-400, slate-300
Borders: zinc-700, zinc-600
Accents:
  - Cost/Money: green-400
  - Sidechain: amber-500
  - Warning: red-400
  - Primary Action: blue-500
```

#### Typography

- Headers: Inter/System Font (sans-serif)
- Body: Inter
- Code/IDs: Fira Code/SF Mono (monospace)

#### Responsive Breakpoints

- Desktop: 1280px+ (primary target)
- Tablet: 768px-1279px (functional, not optimized)
- Mobile: <768px (v2 - out of scope)

---

### Performance Requirements

| Metric                             | Target  | Maximum |
| ---------------------------------- | ------- | ------- |
| Initial page load                  | <1s     | 2s      |
| Project scan (50 projects)         | <2s     | 3s      |
| Session list render (200 sessions) | <500ms  | 1s      |
| Message table render (100 msgs)    | <300ms  | 800ms   |
| Filter application                 | Instant | 100ms   |
| Refresh (re-scan)                  | <2s     | 4s      |

**Bundle Size Targets:**

- JS bundle: <200KB gzipped
- CSS: <20KB gzipped
- Total page weight: <300KB

---

### Security & Privacy

**Data Handling:**

- All data processed locally (no external API calls)
- Logs never leave user's machine
- No telemetry or analytics
- No authentication required (localhost only)

**File Access:**

- Read-only access to `~/.claude/projects/`
- No write operations to log files
- Respects file permissions

**Dependencies:**

- Minimal third-party packages
- Regular security audits via `npm audit`

---

### Success Metrics

**V1 Launch Criteria:**

- Successfully scans and displays 50+ projects
- Cost calculations match manual calculations (100% accuracy)
- Zero crashes on malformed JSONL files
- <3s refresh time on typical hardware
- Usable without documentation (self-explanatory UI)

**Adoption Signals (Post-Launch):**

- Used daily by developer building orchestrator
- Identifies at least one cost optimization opportunity per week
- Saves >10 minutes vs. manual log analysis

---

### Future Enhancements (V2+)

#### Short-Term (V1.1)

- [ ] CSV export for all views
- [ ] Auto-refresh toggle (30s interval)
- [ ] Keyboard shortcuts (arrow keys for navigation)
- [ ] Dark/light theme toggle
- [ ] Token usage charts (line graph over time)

#### Medium-Term (V1.5)

- [ ] File system watcher (instant updates)
- [ ] Historical trending (cost over time)
- [ ] Budget alerts (notify when threshold exceeded)
- [ ] Session comparison (side-by-side diff)
- [ ] Filter presets (save common filter combinations)

#### Long-Term (V2.0)

- [ ] Desktop app packaging (Tauri)
- [ ] Multi-model support (Opus, Haiku pricing)
- [ ] Session notes/tagging
- [ ] Export to Excel with charts
- [ ] Integration with Anthropic API for live monitoring
- [ ] Team sharing (export anonymized reports)

---

### Open Questions

1. **Cache Tier Detection:** How to distinguish 5-minute vs 1-hour cache reads? (Logs may not specify)
   - **Decision:** Assume 5-minute tier for v1, add heuristic in v1.1

2. **Session Grouping:** Should we group sessions by date/time proximity?
   - **Decision:** Not in v1, keep flat list sorted by timestamp

3. **Content Preview:** Show full message content in table or separate modal?
   - **Decision:** Expandable rows in table, full content in expansion

4. **Error Handling:** How to display projects with parse errors?
   - **Decision:** Show project with error badge, display parse error count, link to error log

5. **Performance:** At what session count should we paginate?
   - **Decision:** Virtualize message table at 200+ messages, no pagination needed

---

### Development Phases

#### Phase 1: Foundation (Week 1)

- [ ] Set up Vite + React + TypeScript project
- [ ] Create Express server with file scanner
- [ ] Implement JSONL parser
- [ ] Build cost calculator utility
- [ ] Basic routing (Projects → Sessions → Detail)

#### Phase 2: Core UI (Week 2)

- [ ] Project list with search
- [ ] Session list with sorting
- [ ] Session detail with message table
- [ ] Summary cards for all views
- [ ] Loading states and error handling

#### Phase 3: Polish (Week 3)

- [ ] Filters for session detail view
- [ ] Copy-to-clipboard for IDs
- [ ] Expandable message content
- [ ] Keyboard navigation
- [ ] Responsive tweaks

#### Phase 4: Testing & Launch (Week 4)

- [ ] Manual QA with real logs
- [ ] Performance testing (100+ projects)
- [ ] Edge case testing (corrupted files)
- [ ] Documentation (README)
- [ ] Internal dogfooding

**Total Timeline:** 3-4 weeks (solo developer, part-time)

---

### Risks & Mitigations

| Risk                        | Impact | Likelihood | Mitigation                                |
| --------------------------- | ------ | ---------- | ----------------------------------------- |
| Log format changes          | High   | Low        | Version detection, fallback parsers       |
| Large session files (>10MB) | Medium | Medium     | Streaming parser, pagination              |
| Corrupted JSONL             | Low    | High       | Robust error handling, skip bad lines     |
| Slow file I/O on HDD        | Medium | Low        | Show progress indicator, consider caching |
| Users forget to refresh     | Low    | High       | Add auto-refresh toggle in v1.1           |

---

### Appendix: Example Log Entry

```json
{
  "parentUuid": "ec625a62-801f-4a31-8949-93fcccc34556",
  "isSidechain": true,
  "userType": "external",
  "cwd": "C:\\source\\portfolio-meta\\projects\\fix-the-friction",
  "sessionId": "14d75d9b-0b75-4fa9-acf5-dd86098f4513",
  "version": "2.1.39",
  "gitBranch": "feature/EPIC-1",
  "agentId": "a76ef17",
  "slug": "federated-scribbling-crayon",
  "message": {
    "model": "claude-sonnet-4-5-20250929",
    "id": "msg_0164zsTmFX94HAqLVBzTZ2xz",
    "type": "message",
    "role": "assistant",
    "content": [{ "type": "text", "text": "..." }],
    "usage": {
      "input_tokens": 5,
      "cache_creation_input_tokens": 466,
      "cache_read_input_tokens": 22661,
      "output_tokens": 6
    }
  },
  "timestamp": "2026-02-11T21:05:55.505Z"
}
```
