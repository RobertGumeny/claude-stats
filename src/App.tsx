import { useState, useEffect } from 'react';
import { Project } from './types';
import { ProjectList } from './components/ProjectList';

const API_BASE_URL = 'http://localhost:3001';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);

  // Fetch projects from API
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects`);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setProjects([]);
        setTotalCost(0);
        return;
      }

      const fetchedProjects = data.projects || [];
      setProjects(fetchedProjects);

      // Calculate total cost across all projects
      const total = fetchedProjects.reduce(
        (sum: number, project: Project) => sum + project.totalCost,
        0
      );
      setTotalCost(total);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to API server. Make sure the server is running on port 3001.'
      );
      setProjects([]);
      setTotalCost(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle project card click - placeholder for navigation (EPIC-3-004)
  const handleProjectClick = (projectName: string) => {
    console.log('Project clicked:', projectName);
    // Navigation will be implemented in EPIC-3-004
    alert(`Navigation to project "${projectName}" will be implemented in EPIC-3-004`);
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header with total cost */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-text-primary">
                Claude Code Session Analyzer
              </h1>
              <p className="mt-2 text-text-secondary">
                Analyze your Claude Code sessions, track costs, and optimize your AI-assisted workflows
              </p>
            </div>
            <div className="text-right">
              <p className="text-text-tertiary text-sm">Total Cost</p>
              <p className="text-accent-cost text-3xl font-bold">
                ${totalCost.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scanning...' : 'Refresh Projects'}
          </button>
        </header>

        {/* Main Content */}
        <main>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
                <p className="text-text-tertiary">Scanning Claude projects...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-background-secondary border border-accent-warning rounded-lg p-6">
              <h3 className="text-accent-warning font-semibold mb-2">Error Loading Projects</h3>
              <p className="text-text-secondary whitespace-pre-line">{error}</p>
            </div>
          )}

          {/* Project List */}
          {!loading && !error && (
            <ProjectList
              projects={projects}
              onProjectClick={handleProjectClick}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
