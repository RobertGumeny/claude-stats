import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { parseJsonlFile } from './parser.js';
import { calculateMessageCost } from './cost-calculator.js';

/**
 * Get the path to the ~/.claude/projects directory
 * @returns {string} Absolute path to Claude projects directory
 */
export function getClaudeProjectsPath() {
  return resolve(homedir(), '.claude', 'projects');
}

/**
 * Recursively find all .jsonl files in a directory
 * @param {string} dirPath - Directory to search
 * @param {string[]} [fileList=[]] - Accumulated list of files
 * @returns {Promise<string[]>} Array of absolute paths to .jsonl files
 */
async function findJsonlFiles(dirPath, fileList = []) {
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
    console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
  }

  return fileList;
}

/**
 * Process a single session file and extract metadata
 * @param {string} filePath - Path to session JSONL file
 * @returns {Promise<Object|null>} Session metadata or null if parsing fails
 */
async function processSessionFile(filePath) {
  try {
    const parseResult = await parseJsonlFile(filePath);

    if (!parseResult.success || !parseResult.messages || parseResult.messages.length === 0) {
      return null;
    }

    const messages = parseResult.messages;

    // Calculate costs for each message
    const messagesWithCost = messages.map(msg => ({
      ...msg,
      cost: calculateMessageCost(msg.usage)
    }));

    // Calculate session statistics
    const totalCost = messagesWithCost.reduce((sum, msg) => sum + msg.cost, 0);
    const sidechainMessages = messages.filter(msg => msg.isSidechain);
    const sidechainCount = sidechainMessages.length;
    const sidechainPercentage = messages.length > 0
      ? Math.round((sidechainCount / messages.length) * 100)
      : 0;

    // Calculate total tokens
    const totalTokens = messages.reduce((sum, msg) => {
      const usage = msg.usage || {};
      return sum +
        (usage.input_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) +
        (usage.cache_read_input_tokens || 0) +
        (usage.output_tokens || 0);
    }, 0);

    // Get timestamps
    const timestamps = messages
      .map(msg => new Date(msg.timestamp).getTime())
      .filter(ts => !isNaN(ts));

    const firstMessage = timestamps.length > 0
      ? new Date(Math.min(...timestamps)).toISOString()
      : new Date().toISOString();

    const lastMessage = timestamps.length > 0
      ? new Date(Math.max(...timestamps)).toISOString()
      : new Date().toISOString();

    // Extract session ID from first message
    const sessionId = messages[0]?.sessionId || 'unknown';

    return {
      filename: filePath.split(/[/\\]/).pop(),
      sessionId,
      messageCount: messages.length,
      totalCost: Math.round(totalCost * 10000) / 10000,
      sidechainCount,
      sidechainPercentage,
      totalTokens,
      firstMessage,
      lastMessage
    };
  } catch (error) {
    console.warn(`Failed to process session file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Scan a single project directory and return metadata
 * @param {string} projectPath - Path to project directory
 * @param {string} projectName - Name of the project
 * @returns {Promise<Object>} Project metadata with session files
 */
async function scanProject(projectPath, projectName) {
  const sessionFiles = await findJsonlFiles(projectPath);

  // Process all session files in parallel
  const sessionResults = await Promise.all(
    sessionFiles.map(filePath => processSessionFile(filePath))
  );

  // Filter out failed sessions
  const sessions = sessionResults.filter(session => session !== null);

  // Calculate project-level statistics
  const totalCost = sessions.reduce((sum, session) => sum + session.totalCost, 0);

  // Get most recent activity timestamp
  const allTimestamps = sessions
    .map(session => new Date(session.lastMessage).getTime())
    .filter(ts => !isNaN(ts));

  const lastActivity = allTimestamps.length > 0
    ? new Date(Math.max(...allTimestamps)).toISOString()
    : new Date().toISOString();

  return {
    name: projectName,
    path: projectPath,
    totalSessions: sessions.length,
    totalCost: Math.round(totalCost * 10000) / 10000,
    lastActivity,
    sessions
  };
}

/**
 * Scan all projects in the ~/.claude/projects directory
 * @returns {Promise<{success: boolean, projects?: Array, error?: string}>}
 */
export async function scanAllProjects() {
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
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: `Claude projects directory not found. Expected at: ${projectsPath}\n\nPlease ensure Claude Code has been run at least once to create this directory.`
      };
    }

    // Other errors (permissions, etc.)
    return {
      success: false,
      error: `Unable to access Claude projects directory: ${error.message}`
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
    return {
      success: false,
      error: `Error scanning projects: ${error.message}`
    };
  }
}
