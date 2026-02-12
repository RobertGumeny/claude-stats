import express, { Request, Response } from 'express';
import cors from 'cors';
import { scanAllProjects } from './scanner.js';

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
  console.log(`  - GET /api/health - Health check`);
});
