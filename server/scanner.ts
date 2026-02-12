import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'os';

/**
 * Represents a session file with its metadata
 */
export interface SessionFile {
  filename: string;
  path: string;
}

/**
 * Represents a project with its session files
 */
export interface Project {
  name: string;
  path: string;
  sessionFiles: SessionFile[];
  totalSessions: number;
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
 * Scan a single project directory and return metadata
 * @param projectPath - Path to project directory
 * @param projectName - Name of the project
 * @returns Project metadata with session files
 */
async function scanProject(projectPath: string, projectName: string): Promise<Project> {
  const sessionFiles = await findJsonlFiles(projectPath);

  return {
    name: projectName,
    path: projectPath,
    sessionFiles: sessionFiles.map(filePath => ({
      filename: filePath.split(/[/\\]/).pop() || '', // Cross-platform basename
      path: filePath
    })),
    totalSessions: sessionFiles.length
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
