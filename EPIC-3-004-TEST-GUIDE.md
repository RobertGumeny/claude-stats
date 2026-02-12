# EPIC-3-004 Manual Testing Guide

## Overview
This guide provides step-by-step instructions to manually test the React Router navigation implementation.

## Prerequisites
1. API server running on port 3001: `npm run server`
2. Dev server running on port 5173: `npm run dev`
3. At least one project with sessions in `~/.claude/projects/`

## Test Cases

### Test 1: URL Pattern - Projects Root
**Expected URL:** `/`

**Steps:**
1. Navigate to `http://localhost:5173/`
2. Verify the Projects page loads
3. Verify header shows "Claude Code Session Analyzer"
4. Verify total cost is displayed
5. Verify project cards are visible

**Acceptance Criteria:**
- ✅ URL is exactly `/`
- ✅ No breadcrumb navigation (on root page)
- ✅ Header and refresh button visible

---

### Test 2: URL Pattern - Session List
**Expected URL:** `/project/:name`

**Steps:**
1. Start at `/`
2. Click on any project card
3. Verify URL updates to `/project/[project-name]`
4. Verify breadcrumb shows: `Projects / [project-name]`
5. Verify "Projects" in breadcrumb is clickable
6. Verify current page ([project-name]) is not clickable
7. Verify session cards are displayed

**Acceptance Criteria:**
- ✅ URL matches pattern `/project/:name`
- ✅ Breadcrumb navigation shows current location
- ✅ Project name with spaces is properly URL encoded

---

### Test 3: URL Pattern - Session Detail
**Expected URL:** `/session/:projectName/:sessionId`

**Steps:**
1. Navigate to a project (e.g., `/project/my-project`)
2. Click on any session card
3. Verify URL updates to `/session/[project-name]/[session-id]`
4. Verify breadcrumb shows: `Projects / [project-name] / [session-id-truncated]`
5. Verify all breadcrumb links are clickable except current page
6. Verify session detail content loads

**Acceptance Criteria:**
- ✅ URL matches pattern `/session/:projectName/:sessionId`
- ✅ Breadcrumb shows full navigation path
- ✅ Session ID is truncated in breadcrumb for readability

---

### Test 4: Browser Back Button
**Steps:**
1. Navigate: Projects → Session List → Session Detail
2. Click browser back button
3. Verify you return to Session List
4. Verify URL is `/project/[project-name]`
5. Click browser back button again
6. Verify you return to Projects
7. Verify URL is `/`

**Acceptance Criteria:**
- ✅ Back button works correctly at each level
- ✅ State is preserved (no re-fetching on back)
- ✅ URL updates correctly

---

### Test 5: Browser Forward Button
**Steps:**
1. Navigate to Session Detail
2. Click back twice to reach Projects
3. Click browser forward button
4. Verify you navigate to Session List
5. Click browser forward button again
6. Verify you navigate to Session Detail

**Acceptance Criteria:**
- ✅ Forward button works correctly
- ✅ Navigation state is preserved
- ✅ URLs match expected patterns

---

### Test 6: Breadcrumb Navigation - Back to Projects
**Steps:**
1. Navigate to Session Detail
2. Click "Projects" in breadcrumb
3. Verify you navigate to Projects page
4. Verify URL is `/`

**Acceptance Criteria:**
- ✅ Breadcrumb link navigates correctly
- ✅ Navigation is instant (uses React Router)
- ✅ No page refresh

---

### Test 7: Breadcrumb Navigation - Back to Sessions
**Steps:**
1. Navigate to Session Detail
2. Click project name in breadcrumb
3. Verify you navigate to Session List for that project
4. Verify URL is `/project/[project-name]`

**Acceptance Criteria:**
- ✅ Breadcrumb link navigates to correct project
- ✅ Session list loads for correct project
- ✅ No page refresh

---

### Test 8: Direct URL Access - Session List
**Steps:**
1. Open browser
2. Navigate directly to `http://localhost:5173/project/[valid-project-name]`
3. Verify session list loads

**Acceptance Criteria:**
- ✅ Direct URL access works
- ✅ Sessions load for specified project
- ✅ Breadcrumb shows correct navigation path

---

### Test 9: Direct URL Access - Session Detail
**Steps:**
1. Open browser
2. Navigate directly to `http://localhost:5173/session/[project-name]/[session-id]`
3. Verify session detail loads

**Acceptance Criteria:**
- ✅ Direct URL access works
- ✅ Session detail loads correctly
- ✅ Breadcrumb shows full navigation path

---

### Test 10: Special Characters in URLs
**Steps:**
1. If you have a project with spaces in the name, click it
2. Verify URL properly encodes spaces (e.g., `my%20project`)
3. Verify breadcrumb displays unencoded name (e.g., "my project")
4. Navigate to session detail
5. Verify both project name and session ID are properly encoded

**Acceptance Criteria:**
- ✅ Special characters are URL encoded
- ✅ Display text is user-friendly (decoded)
- ✅ Navigation works with encoded URLs

---

## Expected Results Summary

All tests should pass with the following outcomes:

1. ✅ URL patterns match: `/`, `/project/:name`, `/session/:projectName/:sessionId`
2. ✅ Breadcrumb navigation shows current location
3. ✅ Browser back/forward buttons work correctly
4. ✅ Direct URL access works for all routes
5. ✅ No full page refreshes during navigation
6. ✅ State preservation works (scroll position, filters)

## Known Limitations

- Scroll position preservation is browser-dependent
- Filter state resets on navigation (expected in v1)
- No route guards for invalid project/session IDs (API handles validation)

## Troubleshooting

**Problem:** 404 error on direct URL access
**Solution:** Ensure dev server is configured to handle client-side routing (Vite handles this automatically)

**Problem:** Breadcrumbs not showing
**Solution:** Check that Breadcrumb component is imported and used in SessionList and SessionDetail

**Problem:** Navigation not working
**Solution:** Verify BrowserRouter wraps the Routes in App.tsx
