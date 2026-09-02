# Claude Stats — Architectural Summary

> Produced 2026-03-05. Written to support planning of Prototype 0 (rebuild).

---

## 1. What the Tool Does

**Claude Stats** is a browser-based desktop application that reads Claude Code session log files stored locally on disk and surfaces token usage, cost breakdowns, and agent behavior patterns through an interactive UI.

**Problem it solves:** Claude Code writes detailed JSONL log files for every session, but provides no built-in visibility into how many tokens were consumed, what things cost, or how much work was sidechain (sub-agent) vs. main-thread. Claude Stats fills that gap by parsing those logs and displaying structured analytics.

**Target user:** A developer running Claude Code locally who wants to understand their AI-assisted coding costs and usage patterns without sending data to any external service.

---

## 2. How It Works — End to End

### User Flow

1. User runs `npm run dev:all` from the project root.
2. Two servers start concurrently:
   - **Vite dev server** at `http://localhost:5173` (frontend)
   - **Express API server** at `http://localhost:3001` (backend)
3. User opens the browser. The React app loads and immediately fetches the project list from the API.
4. User browses projects → clicks into a project → clicks into a session.
5. User optionally clicks **Refresh** to force a re-scan of all log files.

### Data Flow (Request → Response)

```
Browser (React)
  → GET /api/projects
    → Express scans ~/.claude/projects/ recursively
    → Finds all *.jsonl files
    → Streams each file line-by-line (readline interface)
    → Parses each line as JSON (skips malformed lines)
    → Extracts token usage from message.usage fields
    → Calculates per-message costs
    → Aggregates by session, then by project
    → Stores result in in-memory cache
  ← Returns JSON: projects[] with totals + metadata

Browser
  → GET /api/sessions/:projectName
    → Reads from cache (or re-scans if cache empty)
  ← Returns sessions[] sorted by recency

Browser
  → GET /api/session-detail/:projectName/:sessionId
    → Reads from cache
  ← Returns full messages[] for the session

Browser
  → POST /api/refresh
    → Clears in-memory cache
    → Triggers full re-scan
  ← Returns { projectsScanned, durationMs }
```

---

## 3. Data Sources

### Source Location

All log data is read from:
```
~/.claude/projects/
```

### Directory Structure

```
~/.claude/projects/
├── <project-slug-1>/
│   ├── <session-id-1>.jsonl
│   ├── <session-id-2>.jsonl
│   └── ...
├── <project-slug-2>/
│   └── ...
```

Each `.jsonl` file represents one Claude Code session. File names correspond to session IDs. The scanner discovers projects by listing subdirectories, then finds all `.jsonl` files within each.

### Log File Format

Each `.jsonl` file contains one JSON object per line. A typical entry:

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

**Key fields consumed by the parser:**

| Field | Used For |
|---|---|
| `isSidechain` | Main vs. sidechain thread classification |
| `sessionId` | Session grouping |
| `agentId` | Agent identification |
| `parentUuid` | Message threading |
| `gitBranch` | Metadata (stored, not yet surfaced) |
| `timestamp` | Chronological ordering, duration calculation |
| `message.id` | Unique message ID |
| `message.role` | `"user"` or `"assistant"` |
| `message.model` | Model identifier (used for pricing lookup) |
| `message.usage.*` | All four token type counts |
| `message.content` | Optional message content/transcript text |

### Supported Providers

**Currently supported: Claude only.**

- Provider is inferred from `message.model` (e.g., `"claude-sonnet-4-5-20250929"`).
- Pricing is hardcoded for **Claude Sonnet 4.5 only**.
- No support for Codex, Gemini, or other models. Non-Claude log entries would be parsed for structure but cost calculations would be incorrect or zero.

---

## 4. Token Counting

### Source

Token counts are **read directly from provider-supplied metadata**, not estimated. The `message.usage` object in each log entry contains exact counts as reported by the Claude API at the time the message was generated.

### Four Token Types Tracked

| Field | Description |
|---|---|
| `input_tokens` | Standard prompt tokens |
| `cache_creation_input_tokens` | Tokens written to the prompt cache |
| `cache_read_input_tokens` | Tokens served from the prompt cache |
| `output_tokens` | Model-generated completion tokens |

### Pricing (Claude Sonnet 4.5)

```typescript
export const PRICING = {
  input:        3.00,  // $ per million tokens
  cacheWrite:   3.75,  // $ per million tokens
  cacheRead5m:  0.30,  // $ per million tokens (5-minute tier — assumed for all reads)
  cacheRead1h:  0.15,  // $ per million tokens (1-hour tier — defined but unused)
  output:      15.00,  // $ per million tokens
};
```

### Cost Formula (per message)

```
cost = (
  (input_tokens            × 3.00) +
  (cache_creation_tokens   × 3.75) +
  (cache_read_tokens       × 0.30) +
  (output_tokens           × 15.00)
) / 1_000_000
```

All costs are rounded to 4 decimal places. Session and project totals are the sum of individual message costs.

### Cache Tier Limitation

The tool currently assumes **all cache reads are 5-minute tier** (`$0.30/M`). The 1-hour tier (`$0.15/M`) rate is defined in the pricing object but never applied. This means cost estimates for cache-heavy sessions may be slightly overstated.

---

## 5. Conversation Summaries

### What Exists Today

The tool **does not reconstruct or surface conversation transcripts**. Message content is captured in the parsed `MessageData` struct (`content: string | null`) and is displayed in an expandable row detail panel in the message table, but there is no:

- Conversation thread view
- Turn-by-turn transcript rendering
- Semantic grouping of exchanges
- Summary generation of any kind

### What Is Stored

```typescript
interface MessageData {
  messageId:   string;
  timestamp:   string;
  isSidechain: boolean;
  role:        string;         // "user" | "assistant"
  model:       string;
  usage:       TokenUsage;
  content:     string | null;  // Extracted raw text, if present
  sessionId?:  string;
  agentId?:    string;
  parentUuid?: string;
}
```

The `content` field is populated by `extractContent()` in `server/parser.ts`, which:
1. Returns `null` if no content field present.
2. Returns the string directly if content is a plain string.
3. Joins all `{ type: 'text', text: '...' }` blocks if content is an array.

### What Would Be Needed to Add Summaries

- Use `parentUuid` to thread messages into conversation trees.
- Group messages by `sessionId` + `agentId` to separate main-thread from sidechain exchanges.
- Either: render the raw content in a readable transcript UI, or call a model API to generate a summary string.
- Store summaries separately (they are not in the log files — they must be derived).

---

## 6. Output Format

### Primary Output: Browser UI

The tool produces no file output, no CLI output, and no exported reports. All output is delivered as an interactive single-page application in the browser.

### Three Views

**Project List (`/`)**
- All discovered projects as cards
- Per-project: name, total cost, session count, last activity date
- Search bar (client-side filter)
- Sort by: Most Recent, Most Expensive, Most Sessions
- Header: aggregate cost across all projects

**Session List (`/project/:name`)**
- All sessions for a project as cards
- Per-session: session ID (truncated), message count, total cost, sidechain percentage, date range
- Sort by: Most Recent, Most Expensive, Longest

**Session Detail (`/session/:projectName/:sessionId`)**
- **SummaryCard:** total cost, message count (main + sidechain), input/output token totals, cache hit rate, session duration
- **Filter controls:** thread type (All / Main / Sidechain), role (User / Assistant checkboxes)
- **MessageTable:** virtualized table for all messages
  - Columns: Timestamp (HH:MM:SS), Role, Type (Main/Sidechain), Model, Token counts, Cost
  - Inline `TokenBar`: colored horizontal bar showing proportion of input / cache_write / cache_read / output tokens
  - Expandable rows: full message ID, model name, detailed token breakdown, raw content text
  - Copy buttons for IDs

### API Response Shapes

**`GET /api/projects`**
```json
{
  "projects": [{
    "name": "project-name",
    "path": "/full/path/to/project",
    "totalSessions": 5,
    "totalCost": 0.1234,
    "lastActivity": "2026-02-18T17:55:15Z",
    "sessions": [...]
  }],
  "metadata": {
    "totalProjects": 3,
    "scanDurationMs": 1234,
    "scannedAt": "2026-02-18T18:00:00Z"
  }
}
```

**`GET /api/session-detail/:projectName/:sessionId`**
```json
{
  "projectName": "project-name",
  "sessionDetail": {
    "sessionId": "14d75d9b-...",
    "messageCount": 47,
    "totalCost": 0.0824,
    "sidechainCount": 15,
    "sidechainPercentage": 32,
    "totalTokens": 133282,
    "firstMessage": "2026-02-11T21:05:55Z",
    "lastMessage": "2026-02-11T21:20:47Z",
    "messages": [{
      "messageId": "msg_0164z...",
      "timestamp": "2026-02-11T21:05:55Z",
      "isSidechain": false,
      "role": "assistant",
      "model": "claude-sonnet-4-5-20250929",
      "usage": {
        "input_tokens": 5,
        "cache_creation_input_tokens": 466,
        "cache_read_input_tokens": 22661,
        "output_tokens": 6
      },
      "cost": 0.0086,
      "content": "..."
    }]
  }
}
```

---

## 7. Known Limitations and Rough Edges

| Area | Issue |
|---|---|
| **Cache tier pricing** | All cache reads assumed to be 5-minute tier ($0.30/M). 1-hour tier ($0.15/M) is never applied, slightly overstating costs for long-cached sessions. |
| **Provider support** | Only Claude is supported. Codex, Gemini, and other providers are not detected or priced. |
| **Model pricing** | Only Claude Sonnet 4.5 pricing is implemented. Other Claude models (Haiku, Opus, newer Sonnet versions) will be priced incorrectly. |
| **No transcript view** | Message content is captured but not presented as a readable conversation. No threading or turn reconstruction. |
| **No file export** | No CSV, JSON, or PDF export of any kind. |
| **No trending / history** | No time-series views, budget tracking, or comparison across time periods. |
| **Performance on large repos** | Full re-scan on every refresh. 50+ projects takes 2-3 seconds. 10MB+ JSONL files may be slow. No incremental scanning. |
| **Silent error handling** | Corrupted JSONL lines are skipped silently. No user-visible indicator that parse errors occurred. |
| **In-memory cache only** | Cache is lost on server restart. Every startup requires a full re-scan. |
| **No authentication** | Localhost only. No multi-user or team sharing. |
| **Content extraction gaps** | Nested content block structures may yield incomplete text. Tool-use content blocks not fully handled. |
| **No search within sessions** | No way to search message content across sessions or within a session. |
| **gitBranch captured but unused** | The `gitBranch` field is parsed and stored but never surfaced in the UI. |

---

## 8. File and Package Structure

### Root

```
claude-stats/
├── index.html                   # HTML shell — mounts React app
├── package.json                 # Scripts: dev:all, build, test, lint
├── tsconfig.json                # Frontend TS config
├── tsconfig.server.json         # Backend TS config
├── tsconfig.node.json           # Vite/tooling TS config
├── vite.config.ts               # Vite build config (proxy to :3001 in dev)
├── vitest.config.ts             # Test runner config
├── tailwind.config.js           # Tailwind CSS 4 config
├── postcss.config.js            # PostCSS for Tailwind
├── PRD.md                       # Product requirements document
├── CLAUDE.md                    # Agent instructions
├── project-state.yaml           # Orchestrator state snapshot
├── tasks.yaml                   # Task backlog
└── backlog.yaml                 # Legacy backlog (pre-tasks.yaml)
```

### Frontend — `src/`

```
src/
├── main.tsx                     # Entry: renders <App /> in StrictMode
├── App.tsx                      # React Router setup, layout shell
├── index.css                    # Tailwind directives + CSS custom properties (theme tokens)
│
├── types/
│   └── index.ts                 # All shared TypeScript interfaces:
│                                #   Project, Session, SessionDetail,
│                                #   MessageData, TokenUsage, ScanMetadata
│
├── components/
│   ├── ProjectListPage.tsx      # Route: / — fetches projects, renders ProjectList
│   ├── ProjectList.tsx          # Search bar + sort controls + ProjectCard grid
│   ├── ProjectCard.tsx          # Single project card: name, cost, session count, date
│   ├── SessionListPage.tsx      # Route: /project/:name — router wrapper
│   ├── SessionList.tsx          # Sort controls + SessionCard list
│   ├── SessionCard.tsx          # Single session card: cost, message count, sidechain %
│   ├── SessionDetail.tsx        # Route: /session/:p/:s — filter controls, SummaryCard, MessageTable
│   ├── MessageTable.tsx         # react-window virtualized list — renders MessageRow items
│   ├── SummaryCard.tsx          # Summary stats: cost, tokens, cache hit rate, duration
│   ├── TokenBar.tsx             # Inline SVG bar: colored segments for each token type
│   ├── RefreshButton.tsx        # POST /api/refresh button with loading spinner
│   ├── CopyButton.tsx           # Clipboard copy with transient "Copied!" state
│   └── Breadcrumb.tsx           # Navigation breadcrumbs
│
├── hooks/
│   ├── useRefresh.ts            # Calls POST /api/refresh, returns { refresh, loading, result }
│   └── useClipboard.ts          # navigator.clipboard.writeText with execCommand fallback
│
└── utils/
    ├── costCalculator.ts        # calculateMessageCost, calculateTotalCost, formatCost
    └── formatters.ts            # formatTokenCount (K/M), formatDuration, truncateId
```

### Backend — `server/`

```
server/
├── index.ts                     # Express app: registers routes, starts on :3001
│                                #   GET  /api/projects
│                                #   GET  /api/sessions/:projectName
│                                #   GET  /api/session-detail/:projectName/:sessionId
│                                #   POST /api/refresh
│
├── scanner.ts                   # Filesystem scanning:
│                                #   scanProjects() — reads ~/.claude/projects/
│                                #   findJsonlFiles() — recursive glob for *.jsonl
│                                #   aggregateProject() — groups sessions under a project
│                                #   In-memory cache with clearCache()
│
├── parser.ts                    # JSONL parsing:
│                                #   parseSessionFile(path) — streams file line by line
│                                #   parseLine(raw) — JSON.parse + field extraction
│                                #   extractContent(content) — handles string | ContentBlock[]
│                                #   Returns MessageData[]
│
├── costCalculator.ts            # Backend-side cost calculation (mirrors src/utils/costCalculator.ts)
│                                #   PRICING constants, calculateMessageCost, calculateTotalCost
│
└── errorHandler.ts              # Express error middleware:
│                                #   ApiError class (status, code, message)
│                                #   Logger class (info, warn, error, debug → stdout)
│                                #   handleError() middleware
```

### Documentation — `docs/kb/`

```
docs/kb/
├── architecture/
│   └── typescript-type-system.md
├── dependencies/
│   ├── express.md
│   ├── react-19.md
│   ├── react-router-dom.md
│   ├── react-window.md
│   └── tailwind-css-4.md
├── features/
│   ├── api-endpoints.md
│   ├── cost-calculator.md
│   ├── filesystem-scanner.md
│   ├── project-list-view.md
│   ├── session-detail-view.md
│   └── session-list-view.md
└── infrastructure/
    ├── backend-typescript-configuration.md
    ├── structured-logging.md
    └── tailwind-css-4-configuration.md
```

---

## Appendix: Key Technology Versions

| Package | Version |
|---|---|
| React | 19.0 |
| react-router-dom | 7.13 |
| react-window | 2.2.7 |
| Express | 5.2.1 |
| TypeScript | 5.9 |
| Vite | 6.0 |
| Vitest | 4.0 |
| Tailwind CSS | 4.1 |
| tsx (Node.js TS runner) | 4.21 |
| concurrently | 9.1 |
