import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '../types';
import { SessionCard } from './SessionCard';
import { Breadcrumb } from './Breadcrumb';

interface SessionListProps {
  projectName: string;
}

type SortOption = 'recent' | 'expensive' | 'longest';

const API_BASE_URL = 'http://localhost:3001';

export function SessionList({ projectName }: SessionListProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const handleSessionClick = (sessionId: string) => {
    navigate(`/session/${encodeURIComponent(projectName)}/${encodeURIComponent(sessionId)}`);
  };

  // Fetch sessions for the project
  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/${encodeURIComponent(projectName)}`);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setSessions([]);
          return;
        }

        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Failed to fetch sessions:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch sessions. Make sure the server is running.'
        );
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [projectName]);

  // Sort sessions based on selected option
  const sortedSessions = [...sessions].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        // Sort by last message timestamp (descending)
        return new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime();
      case 'expensive':
        // Sort by total cost (descending)
        return b.totalCost - a.totalCost;
      case 'longest':
        // Sort by message count (descending)
        return b.messageCount - a.messageCount;
      default:
        return 0;
    }
  });

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Projects', path: '/' },
          { label: projectName }
        ]}
      />

      {/* Header with Sort Options */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">Sessions</h2>

        {!loading && !error && sessions.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-text-secondary text-sm">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-background-secondary border border-border-primary text-text-primary rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
            >
              <option value="recent">Most Recent</option>
              <option value="expensive">Most Expensive</option>
              <option value="longest">Longest (by messages)</option>
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
            <p className="text-text-tertiary">Loading sessions...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-background-secondary border border-accent-warning rounded-lg p-6">
          <h3 className="text-accent-warning font-semibold mb-2">Failed to load sessions</h3>
          <p className="text-text-secondary">Failed to load sessions. Try refreshing the page.</p>
          <p className="text-text-tertiary text-sm mt-2">
            Make sure the API server is running on port 3001.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sessions.length === 0 && (
        <div className="bg-background-secondary border border-border-primary rounded-lg p-12 text-center">
          <div className="inline-block mb-4 text-text-tertiary">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-text-tertiary text-lg">No sessions found</p>
          <p className="text-text-tertiary text-sm mt-2">This project doesn't have any Claude Code sessions yet.</p>
        </div>
      )}

      {/* Session Cards */}
      {!loading && !error && sessions.length > 0 && (
        <div className="space-y-4">
          {sortedSessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              onClick={() => handleSessionClick(session.sessionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
