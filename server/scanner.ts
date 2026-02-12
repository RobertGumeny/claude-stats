import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { parseJsonlFile } from './parser.js';
import { calculateMessageCost } from './costCalculator.js';

/**
 * Represents a session file with its metadata
 */
export interface SessionFile {
  filename: string;
  path: string;
}

/**
 * Session summary with aggregated data
 */
export interface Session {
  filename: string;
  sessionId: string;
  messageCount: number;
  totalCost: number;
  sidechainCount: number;
  sidechainPercentage: number;
  totalTokens: number;
  firstMessage: string; // ISO timestamp
  lastMessage: string; // ISO timestamp
}

/**
 * Represents a project with aggregated session data
 */
export interface Project {
  name: string;
  path: string;
  totalSessions: number;
  totalCost: number;
  lastActivity: string; // ISO timestamp
  sessions: Session[];
}

/**
 * Metadata about the scan operation
 */
export interface ScanMetadata {
  totalProjects: number;
  scanDurationMs: number;
  scannedAt: string;
}

/**
 * Successful scan result
 */
export interface ScanSuccessResult {
  success: true;
  projects: Project[];
  metadata: ScanMetadata;
}

/**
 * Failed scan result
 */
export interface ScanErrorResult {
  success: false;
  error: string;
}

/**
 * Union type for scan results
 */
export type ScanResult = ScanSuccessResult | ScanErrorResult;

/**
 * Get the path to the ~/.claude/projects directory
 * @returns Absolute path to Claude projects directory
 */
export function getClaudeProjectsPath(): string {
  return resolve(homedir(), '.claude', 'projects');
}

/**
 * Recursively find all .jsonl files in a directory
 * @param dirPath - Directory to search
 * @param fileList - Accumulated list of files
 * @returns Array of absolute paths to .jsonl files
 */
async function findJsonlFiles(dirPath: string, fileList: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively search subdirectories
        await findJsonlFiles(fullPath, fileList);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        fileList.push(fullPath);
      }
    }
  } catch (error) {
    // Silently skip directories we can't read (permissions, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not read directory ${dirPath}: ${errorMessage}`);
  }

  return fileList;
}

/**
 * Parse a single session file and return aggregated session data
 * @param filePath - Absolute path to .jsonl file
 * @returns Session summary with aggregated data, or null on error
 */
async function parseSessionFile(filePath: string): Promise<Session | null> {
  try {
    const parseResult = await parseJsonlFile(filePath);

    if (!parseResult.success || !parseResult.messages || parseResult.messages.length === 0) {
      // Skip files that can't be parsed or have no messages
      return null;
    }

    const messages = parseResult.messages;

    // Calculate total cost for all messages
    const totalCost = messages.reduce((sum, msg) => {
      return sum + calculateMessageCost(msg.usage);
    }, 0);

    // Count sidechain messages
    const sidechainCount = messages.filter(msg => msg.isSidechain).length;
    const sidechainPercentage = messages.length > 0
      ? Math.round((sidechainCount / messages.length) * 100)
      : 0;

    // Calculate total tokens
    const totalTokens = messages.reduce((sum, msg) => {
      const usage = msg.usage;
      return sum +
        (usage.input_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0) +
        (usage.output_tokens || 0);
    }, 0);

    // Get first and last message timestamps
    const timestamps = messages.map(msg => msg.timestamp).filter(Boolean).sort();
    const firstMessage = timestamps[0] || new Date().toISOString();
    const lastMessage = timestamps[timestamps.length - 1] || firstMessage;

    // Extract session ID from first message
    const sessionId = messages[0]?.sessionId || 'unknown';

    return {
      filename: filePath.split(/[/\\]/).pop() || '',
      sessionId,
      messageCount: messages.length,
      totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
      sidechainCount,
      sidechainPercentage,
      totalTokens,
      firstMessage,
      lastMessage
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Warning: Could not parse session file ${filePath}: ${errorMessage}`);
    return null;
  }
}

/**
 * Scan a single project directory and return aggregated metadata
 * @param projectPath - Path to project directory
 * @param projectName - Name of the project
 * @returns Project metadata with aggregated session data
 */
async function scanProject(projectPath: string, projectName: string): Promise<Project> {
  const sessionFilePaths = await findJsonlFiles(projectPath);

  // Parse all session files in parallel
  const sessionPromises = sessionFilePaths.map(filePath => parseSessionFile(filePath));
  const sessionResults = await Promise.all(sessionPromises);

  // Filter out null results (failed parses)
  const sessions = sessionResults.filter((session): session is Session => session !== null);

  // Calculate total cost across all sessions
  const totalCost = sessions.reduce((sum, session) => sum + session.totalCost, 0);

  // Find the most recent activity
  const allTimestamps = sessions
    .map(session => session.lastMessage)
    .filter(Boolean)
    .sort()
    .reverse();
  const lastActivity = allTimestamps[0] || new Date().toISOString();

  return {
    name: projectName,
    path: projectPath,
    totalSessions: sessions.length,
    totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
    lastActivity,
    sessions
  };
}

/**
 * Scan all projects in the ~/.claude/projects directory
 * @returns Promise resolving to scan result with projects or error
 */
export async function scanAllProjects(): Promise<ScanResult> {
  const projectsPath = getClaudeProjectsPath();

  try {
    // Check if the directory exists
    const dirStats = await stat(projectsPath);

    if (!dirStats.isDirectory()) {
      return {
        success: false,
        error: `Path exists but is not a directory: ${projectsPath}`
      };
    }
  } catch (error) {
    // Directory doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {
        success: false,
        error: `Claude projects directory not found. Expected at: ${projectsPath}\n\nPlease ensure Claude Code has been run at least once to create this directory.`
      };
    }

    // Other errors (permissions, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Unable to access Claude projects directory: ${errorMessage}`
    };
  }

  try {
    const startTime = Date.now();
    const entries = await readdir(projectsPath, { withFileTypes: true });

    // Filter to only directories
    const projectDirs = entries.filter(entry => entry.isDirectory());

    // Scan each project in parallel for better performance
    const projects = await Promise.all(
      projectDirs.map(dir =>
        scanProject(join(projectsPath, dir.name), dir.name)
      )
    );

    // Filter out projects with no sessions
    const projectsWithSessions = projects.filter(p => p.totalSessions > 0);

    const duration = Date.now() - startTime;

    return {
      success: true,
      projects: projectsWithSessions,
      metadata: {
        totalProjects: projectsWithSessions.length,
        scanDurationMs: duration,
        scannedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error scanning projects: ${errorMessage}`
    };
  }
}

/**
 * Result type for project-specific session scan
 */
export interface ProjectSessionsResult {
  success: true;
  sessions: Session[];
  projectName: string;
}

export interface ProjectNotFoundResult {
  success: false;
  error: string;
  projectName: string;
}

export type ProjectSessionsScanResult = ProjectSessionsResult | ProjectNotFoundResult;

/**
 * Get all sessions for a specific project by name
 * @param projectName - Name of the project directory
 * @returns Promise resolving to sessions array or error
 */
export async function getProjectSessions(projectName: string): Promise<ProjectSessionsScanResult> {
  const projectsPath = getClaudeProjectsPath();
  const projectPath = join(projectsPath, projectName);

  try {
    // Check if the project directory exists
    const dirStats = await stat(projectPath);

    if (!dirStats.isDirectory()) {
      return {
        success: false,
        error: `Project '${projectName}' exists but is not a directory`,
        projectName
      };
    }
  } catch (error) {
    // Project directory doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {
        success: false,
        error: `Project '${projectName}' not found`,
        projectName
      };
    }

    // Other errors (permissions, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Unable to access project '${projectName}': ${errorMessage}`,
      projectName
    };
  }

  try {
    // Scan the specific project
    const project = await scanProject(projectPath, projectName);

    return {
      success: true,
      sessions: project.sessions,
      projectName
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error scanning project '${projectName}': ${errorMessage}`,
      projectName
    };
  }
}
