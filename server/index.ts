import express, { Request, Response } from 'express';
import cors from 'cors';
import { scanAllProjects, getProjectSessions, getSessionDetail } from './scanner.js';

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
app.get('/api/projects', async (req: Request, res: Response) => {
  try {
    const result = await scanAllProjects();

    if (!result.success) {
      return res.status(404).json({
        error: result.error,
        projects: []
      });
    }

    res.json({
      projects: result.projects,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Error in /api/projects:', error);
    res.status(500).json({
      error: 'Internal server error while scanning projects',
      projects: []
    });
  }
});

/**
 * GET /api/sessions/:projectName
 * Returns all sessions for a specific project with summary statistics
 * Includes: totalCost, messageCount, sidechainCount, sidechainPercentage per session
 * Returns 404 if project name not found
 */
app.get('/api/sessions/:projectName', async (req: Request, res: Response) => {
  try {
    const { projectName } = req.params;

    if (!projectName || !projectName.trim()) {
      return res.status(400).json({
        error: 'Project name is required',
        sessions: []
      });
    }

    const result = await getProjectSessions(projectName);

    if (!result.success) {
      return res.status(404).json({
        error: result.error,
        projectName: result.projectName,
        sessions: []
      });
    }

    res.json({
      projectName: result.projectName,
      sessions: result.sessions,
      totalSessions: result.sessions.length
    });
  } catch (error) {
    console.error('Error in /api/sessions/:projectName:', error);
    res.status(500).json({
      error: 'Internal server error while fetching project sessions',
      sessions: []
    });
  }
});

/**
 * GET /api/session-detail/:projectName/:sessionId
 * Returns full message-level breakdown for a single session
 * Includes: complete messages array with individual message costs
 * Returns 404 if project or session not found
 */
app.get('/api/session-detail/:projectName/:sessionId', async (req: Request, res: Response) => {
  try {
    const { projectName, sessionId } = req.params;

    if (!projectName || !projectName.trim()) {
      return res.status(400).json({
        error: 'Project name is required',
        sessionDetail: null
      });
    }

    if (!sessionId || !sessionId.trim()) {
      return res.status(400).json({
        error: 'Session ID is required',
        sessionDetail: null
      });
    }

    const result = await getSessionDetail(projectName, sessionId);

    if (!result.success) {
      return res.status(404).json({
        error: result.error,
        projectName: result.projectName,
        sessionId: result.sessionId,
        sessionDetail: null
      });
    }

    res.json({
      projectName: result.projectName,
      sessionDetail: result.sessionDetail
    });
  } catch (error) {
    console.error('Error in /api/session-detail/:projectName/:sessionId:', error);
    res.status(500).json({
      error: 'Internal server error while fetching session detail',
      sessionDetail: null
    });
  }
});

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

app.listen(PORT, () => {
  console.log(`Claude Stats API server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  - GET /api/projects - List all Claude Code projects with aggregated data`);
  console.log(`  - GET /api/sessions/:projectName - Get all sessions for a specific project`);
  console.log(`  - GET /api/session-detail/:projectName/:sessionId - Get full message breakdown for a session`);
  console.log(`  - GET /api/health - Health check`);
});
