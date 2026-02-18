import { Project } from '../types';
import { ProjectList } from './ProjectList';
import { formatCost } from '../utils/costCalculator';
import { RefreshButton } from './RefreshButton';
import { useRefresh } from '../hooks/useRefresh';

interface ProjectListPageProps {
  projects: Project[];
  loading: boolean;
  error: string | null;
  totalCost: number;
  onRefresh: () => void;
}

export function ProjectListPage({ projects, loading, error, totalCost, onRefresh }: ProjectListPageProps) {
  const { isRefreshing, refresh } = useRefresh({ onSuccess: onRefresh });

  const handleRefresh = () => {
    refresh();
  };

  const isLoading = loading || isRefreshing;

  return (
    <div className="min-h-screen bg-primary text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Claude Code Session Analyzer
              </h1>
              <p className="mt-2 text-muted">
                Analyze your Claude Code sessions, track costs, and optimize your AI-assisted workflows
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-subtle text-sm">Total Cost</p>
                <p className="text-success text-3xl font-bold">
                  {formatCost(totalCost)}
                </p>
              </div>
              {/* Refresh Button in header */}
              <RefreshButton onClick={handleRefresh} isRefreshing={isLoading} />
            </div>
          </div>
        </header>

        <main>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
                <p className="text-subtle">Scanning Claude projects...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="bg-secondary border border-warning rounded-lg p-6">
              <h3 className="text-warning font-semibold mb-2">Failed to load projects</h3>
              <p className="text-muted whitespace-pre-line">
                {error.includes('Failed to connect') || error.includes('API returned')
                  ? 'Failed to load projects. Try refreshing the page.'
                  : error}
              </p>
              <p className="text-subtle text-sm mt-2">
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
