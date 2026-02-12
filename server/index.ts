import express, { Request, Response } from 'express';
import cors from 'cors';
import { scanAllProjects, getProjectSessions, getSessionDetail, clearCache } from './scanner.js';
import {
  errorHandler,
  asyncHandler,
  validationError,
  notFoundError,
  Logger,
  ApiError
} from './errorHandler.js';

const app = express();
const PORT = 3001;

// Enable CORS for local development
app.use(cors());
app.use(express.json());

/**
 * GET /api/projects
 * Returns list of all Claude Code projects with aggregated summary data
 * Each project includes: name, totalSessions, totalCost, lastActivity, and sessions array
 */
app.get('/api/projects', asyncHandler(async (req: Request, res: Response) => {
  Logger.info('Scanning all projects');
  const result = await scanAllProjects();

  if (!result.success) {
    Logger.error('Failed to scan projects', new Error(result.error));
    throw new ApiError(result.error, 500, {
      reason: 'Projects directory not found or inaccessible'
    });
  }

  Logger.info('Successfully scanned projects', {
    projectCount: result.projects.length,
    scanDuration: `${result.metadata.scanDurationMs}ms`
  });

  res.json({
    projects: result.projects,
    metadata: result.metadata
  });
}));

/**
 * GET /api/sessions/:projectName
 * Returns all sessions for a specific project with summary statistics
 * Includes: totalCost, messageCount, sidechainCount, sidechainPercentage per session
 * Returns 404 if project name not found
 */
app.get('/api/sessions/:projectName', asyncHandler(async (req: Request, res: Response) => {
  const { projectName } = req.params;

  // Validate project name parameter
  if (!projectName || !projectName.trim()) {
    throw validationError('Project name is required', {
      parameter: 'projectName',
      received: projectName
    });
  }

  Logger.info('Fetching sessions for project', { projectName });
  const result = await getProjectSessions(projectName);

  if (!result.success) {
    Logger.warn('Project not found', { projectName });
    throw notFoundError('Project', projectName);
  }

  Logger.info('Successfully fetched project sessions', {
    projectName,
    sessionCount: result.sessions.length
  });

  res.json({
    projectName: result.projectName,
    sessions: result.sessions,
    totalSessions: result.sessions.length
  });
}));

/**
 * GET /api/session-detail/:projectName/:sessionId
 * Returns full message-level breakdown for a single session
 * Includes: complete messages array with individual message costs
 * Returns 404 if project or session not found
 */
app.get('/api/session-detail/:projectName/:sessionId', asyncHandler(async (req: Request, res: Response) => {
  const { projectName, sessionId } = req.params;

  // Validate project name parameter
  if (!projectName || !projectName.trim()) {
    throw validationError('Project name is required', {
      parameter: 'projectName',
      received: projectName
    });
  }

  // Validate session ID parameter
  if (!sessionId || !sessionId.trim()) {
    throw validationError('Session ID is required', {
      parameter: 'sessionId',
      received: sessionId
    });
  }

  Logger.info('Fetching session detail', { projectName, sessionId });
  const result = await getSessionDetail(projectName, sessionId);

  if (!result.success) {
    Logger.warn('Session not found', { projectName, sessionId });
    throw notFoundError('Session', sessionId);
  }

  Logger.info('Successfully fetched session detail', {
    projectName,
    sessionId,
    messageCount: result.sessionDetail.messageCount
  });

  res.json({
    projectName: result.projectName,
    sessionDetail: result.sessionDetail
  });
}));

/**
 * POST /api/refresh
 * Triggers re-scan of file system and clears in-memory cache
 * Returns success status with timestamp of refresh
 */
app.post('/api/refresh', asyncHandler(async (req: Request, res: Response) => {
  Logger.info('Refresh requested - clearing cache and re-scanning');
  const startTime = Date.now();

  // Clear the cache to force a fresh scan
  clearCache();

  // Re-scan all projects (with useCache=false to bypass cache)
  const result = await scanAllProjects(false);

  const duration = Date.now() - startTime;

  if (!result.success) {
    Logger.error('Refresh failed', new Error(result.error), { duration });
    throw new ApiError('Failed to refresh project data', 500, {
      error: result.error,
      durationMs: duration
    });
  }

  Logger.info('Refresh completed successfully', {
    projectsScanned: result.metadata.totalProjects,
    durationMs: duration
  });

  res.json({
    success: true,
    message: 'Cache cleared and projects re-scanned successfully',
    timestamp: new Date().toISOString(),
    durationMs: duration,
    projectsScanned: result.metadata.totalProjects
  });
}));

/**
 * GET /api/health
 * Simple health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * 404 handler for invalid routes
 * Must be defined after all valid routes
 */
app.use((req: Request, res: Response) => {
  Logger.warn('Route not found', {
    method: req.method,
    path: req.path
  });

  res.status(404).json({
    status: 404,
    message: `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Global error handler
 * Must be defined after all routes and middleware
 */
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Claude Stats API server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  - GET /api/projects - List all Claude Code projects with aggregated data`);
  console.log(`  - GET /api/sessions/:projectName - Get all sessions for a specific project`);
  console.log(`  - GET /api/session-detail/:projectName/:sessionId - Get full message breakdown for a session`);
  console.log(`  - POST /api/refresh - Clear cache and re-scan all projects`);
  console.log(`  - GET /api/health - Health check`);
});
