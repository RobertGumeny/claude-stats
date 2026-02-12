import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Project } from './types';
import { ProjectList } from './components/ProjectList';
import { SessionList } from './components/SessionList';
import { SessionDetail } from './components/SessionDetail';

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <ProjectListPage
            projects={projects}
            loading={loading}
            error={error}
            totalCost={totalCost}
            onRefresh={fetchProjects}
          />
        } />
        <Route path="/project/:name" element={<SessionListPage />} />
        <Route path="/session/:projectName/:sessionId" element={<SessionDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// Wrapper component for Project List page
interface ProjectListPageProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  totalCost: number;
  onRefresh: () => void;
}

function ProjectListPage({ projects, loading, error, totalCost, onRefresh }: ProjectListPageProps) {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="container mx-auto px-4 py-8">
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
            onClick={onRefresh}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Scanning...' : 'Refresh Projects'}
          </button>
        </header>

        <main>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
                <p className="text-text-tertiary">Scanning Claude projects...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-background-secondary border border-accent-warning rounded-lg p-6">
              <h3 className="text-accent-warning font-semibold mb-2">Failed to load projects</h3>
              <p className="text-text-secondary whitespace-pre-line">
                {error.includes('Failed to connect') || error.includes('API returned')
                  ? 'Failed to load projects. Try refreshing the page.'
                  : error}
              </p>
              <p className="text-text-tertiary text-sm mt-2">
                Make sure the API server is running on port 3001.
              </p>
            </div>
          )}

          {/* Project List */}
          {!loading && !error && (
            <ProjectList projects={projects} />
          )}
        </main>
      </div>
    </div>
  );
}

// Wrapper component for Session List page
function SessionListPage() {
  const { name } = useParams<{ name: string }>();

  if (!name) {
    return <div>Error: Project name not found</div>;
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="container mx-auto px-4 py-8">
        <SessionList projectName={decodeURIComponent(name)} />
      </div>
    </div>
  );
}

// Wrapper component for Session Detail page
function SessionDetailPage() {
  const { projectName, sessionId } = useParams<{ projectName: string; sessionId: string }>();

  if (!projectName || !sessionId) {
    return <div>Error: Missing parameters</div>;
  }

  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="container mx-auto px-4 py-8">
        <SessionDetail
          projectName={decodeURIComponent(projectName)}
          sessionId={decodeURIComponent(sessionId)}
        />
      </div>
    </div>
  );
}

export default App;
