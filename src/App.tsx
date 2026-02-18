import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import { Project } from './types';
import { ProjectListPage } from './components/ProjectListPage';
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

// Wrapper component for Session List page
function SessionListPage() {
  const { name } = useParams<{ name: string }>();

  if (!name) {
    return <div>Error: Project name not found</div>;
  }

  return (
    <div className="min-h-screen bg-primary text-foreground">
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
    <div className="min-h-screen bg-primary text-foreground">
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
