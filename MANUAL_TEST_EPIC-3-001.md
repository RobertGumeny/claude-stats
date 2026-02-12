# Manual Test Plan: EPIC-3-001 - Project List View

## Prerequisites
1. Server must be running: `npm run server`
2. Client must be running: `npm run dev`
3. Claude Code projects directory exists at `~/.claude/projects/` with some session data

## Test Cases

### TC1: Initial Page Load
**Steps:**
1. Open browser to `http://localhost:5173`
2. Observe loading state

**Expected:**
- Spinning loader appears with "Scanning Claude projects..." message
- Loading state is visible during API call
- After scan completes, project cards appear

### TC2: Project Cards Display
**Steps:**
1. Wait for projects to load
2. Observe project cards

**Expected:**
- Each project card shows:
  - Project name (bold header)
  - Session count (number)
  - Total cost (green, 4 decimal places, format: $X.XXXX)
  - Last activity timestamp (formatted as "Mon DD, YYYY, H:MM AM/PM")
- Cards are in grid layout (3 columns on desktop)
- Cards have hover effect (border changes on hover)

### TC3: Total Cost Header
**Steps:**
1. Observe header area

**Expected:**
- Header shows "Total Cost" label
- Total cost is displayed in large green text
- Cost is sum of all project costs
- Format: $X.XXXX (4 decimal places)

### TC4: Search Functionality
**Steps:**
1. Type a project name (partial or full) in search bar
2. Observe real-time filtering

**Expected:**
- Projects filter immediately as you type (no delay, no search button)
- Only matching projects shown
- Search is case-insensitive
- Clear search shows all projects again

### TC5: Sort Dropdown - Most Expensive (Default)
**Steps:**
1. Observe initial sort order
2. Verify "Most Expensive" is selected in dropdown

**Expected:**
- Projects sorted by totalCost descending (highest cost first)
- Dropdown shows "Most Expensive" selected

### TC6: Sort Dropdown - Most Recent
**Steps:**
1. Select "Most Recent" from dropdown
2. Observe reorder

**Expected:**
- Projects immediately reorder
- Projects sorted by lastActivity descending (most recent first)
- No page reload

### TC7: Sort Dropdown - Alphabetical
**Steps:**
1. Select "Alphabetical" from dropdown
2. Observe reorder

**Expected:**
- Projects immediately reorder
- Projects sorted A-Z by name
- Case-insensitive sort
- No page reload

### TC8: Sort Dropdown - Most Sessions
**Steps:**
1. Select "Most Sessions" from dropdown (if available)
2. Observe reorder

**Expected:**
- Projects immediately reorder
- Projects sorted by totalSessions descending
- No page reload

### TC9: Project Card Click
**Steps:**
1. Click anywhere on a project card
2. Observe action

**Expected:**
- Alert appears with message: "Navigation to project '[name]' will be implemented in EPIC-3-004"
- Console logs: "Project clicked: [name]"
- (Note: Actual navigation will be implemented in EPIC-3-004)

### TC10: Refresh Button
**Steps:**
1. Click "Refresh Projects" button
2. Observe behavior

**Expected:**
- Button text changes to "Scanning..."
- Button is disabled during scan
- Loading spinner appears
- Projects refresh with latest data from file system
- Button returns to "Refresh Projects" after scan

### TC11: Error State - Server Not Running
**Steps:**
1. Stop the API server (Ctrl+C)
2. Click "Refresh Projects"
3. Observe error state

**Expected:**
- Error message appears in red/warning color
- Message: "Failed to connect to API server. Make sure the server is running on port 3001."
- No project cards shown
- Header total cost shows $0.0000

### TC12: Error State - No Projects Directory
**Steps:**
1. Ensure `~/.claude/projects/` doesn't exist or is empty
2. Refresh page

**Expected:**
- Error message appears with helpful guidance
- Message mentions directory path
- Suggests running Claude Code at least once

### TC13: Empty Search Results
**Steps:**
1. Type a search term that matches no projects
2. Observe empty state

**Expected:**
- Message: "No projects match your search"
- No project cards shown
- Search bar remains populated
- Can clear search to see all projects again

### TC14: Responsive Layout
**Steps:**
1. Resize browser window
2. Test different widths: mobile (<768px), tablet (768-1279px), desktop (1280px+)

**Expected:**
- Desktop (1280px+): 3 columns
- Tablet (768-1279px): 2 columns
- Mobile (<768px): 1 column
- Search and sort stack vertically on mobile
- All content remains readable and accessible

## Acceptance Criteria Verification

✅ **Displays project cards in grid layout with name, session count, total cost, last activity**
- Check TC2

✅ **Search bar filters projects in real-time (no search button needed)**
- Check TC4

✅ **Sort dropdown works: Most expensive (default), Most recent, Alphabetical**
- Check TC5, TC6, TC7

✅ **Clicking card navigates to session list for that project**
- Check TC9 (navigation placeholder working, actual navigation in EPIC-3-004)

## Notes
- All costs should display with exactly 4 decimal places
- Timestamps should be human-readable (not ISO strings)
- Loading states should be smooth with spinner
- Error states should be friendly and actionable
