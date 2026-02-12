import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';

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
 * Scan a single project directory and return metadata
 * @param {string} projectPath - Path to project directory
 * @param {string} projectName - Name of the project
 * @returns {Promise<Object>} Project metadata with session files
 */
async function scanProject(projectPath, projectName) {
  const sessionFiles = await findJsonlFiles(projectPath);

  return {
    name: projectName,
    path: projectPath,
    sessionFiles: sessionFiles.map(filePath => ({
      filename: filePath.split(/[/\\]/).pop(), // Cross-platform basename
      path: filePath
    })),
    totalSessions: sessionFiles.length
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
