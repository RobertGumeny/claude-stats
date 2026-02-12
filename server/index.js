import express from 'express';
import cors from 'cors';
import { scanAllProjects } from './scanner.js';

const app = express();
const PORT = 3001;

// Enable CORS for local development
app.use(cors());
app.use(express.json());

/**
 * GET /api/projects
 * Returns list of all Claude Code projects with their session files
 */
app.get('/api/projects', async (req, res) => {
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
 * Returns list of all sessions for a specific project
 */
app.get('/api/sessions/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const result = await scanAllProjects();

    if (!result.success) {
      return res.status(404).json({
        error: result.error,
        sessions: []
      });
    }

    // Find the requested project
    const project = result.projects.find(p => p.name === projectName);

    if (!project) {
      return res.status(404).json({
        error: `Project "${projectName}" not found`,
        sessions: []
      });
    }

    res.json({
      projectName: project.name,
      sessions: project.sessions,
      metadata: {
        totalSessions: project.sessions.length,
        totalCost: project.totalCost
      }
    });
  } catch (error) {
    console.error('Error in /api/sessions/:projectName:', error);
    res.status(500).json({
      error: 'Internal server error while fetching sessions',
      sessions: []
    });
  }
});

/**
 * GET /api/session-detail/:projectName/:sessionId
 * Returns detailed information for a specific session including all messages
 */
app.get('/api/session-detail/:projectName/:sessionId', async (req, res) => {
  try {
    const { projectName, sessionId } = req.params;
    const result = await scanAllProjects();

    if (!result.success) {
      return res.status(404).json({
        error: result.error,
        sessionDetail: null
      });
    }

    // Find the requested project
    const project = result.projects.find(p => p.name === projectName);

    if (!project) {
      return res.status(404).json({
        error: `Project "${projectName}" not found`,
        sessionDetail: null
      });
    }

    // Find the requested session
    const session = project.sessions.find(s => s.sessionId === sessionId);

    if (!session) {
      return res.status(404).json({
        error: `Session "${sessionId}" not found in project "${projectName}"`,
        sessionDetail: null
      });
    }

    // Import parser and cost calculator to get detailed messages
    const { parseJsonlFile } = await import('./parser.js');
    const { calculateMessageCost } = await import('./cost-calculator.js');
    const { join } = await import('path');

    // Parse the session file to get all messages with full details
    const sessionFilePath = join(project.path, session.filename);
    const parseResult = await parseJsonlFile(sessionFilePath);

    if (!parseResult.success || !parseResult.messages) {
      return res.status(500).json({
        error: `Failed to parse session file: ${parseResult.error || 'Unknown error'}`,
        sessionDetail: null
      });
    }

    // Enrich messages with cost calculations
    const messagesWithCost = parseResult.messages.map(msg => ({
      ...msg,
      cost: calculateMessageCost(msg.usage)
    }));

    // Build session detail response
    const sessionDetail = {
      ...session,
      messages: messagesWithCost
    };

    res.json({
      sessionDetail
    });
  } catch (error) {
    console.error('Error in /api/session-detail/:projectName/:sessionId:', error);
    res.status(500).json({
      error: 'Internal server error while fetching session details',
      sessionDetail: null
    });
  }
});

/**
 * GET /api/health
 * Simple health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Claude Stats API server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  - GET /api/projects - List all Claude Code projects`);
  console.log(`  - GET /api/sessions/:projectName - List all sessions for a project`);
  console.log(`  - GET /api/session-detail/:projectName/:sessionId - Get detailed session info with messages`);
  console.log(`  - GET /api/health - Health check`);
});
