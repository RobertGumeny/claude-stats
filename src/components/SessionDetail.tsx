import { useState, useEffect, useMemo } from 'react';
import { SessionDetail as SessionDetailType, Message } from '../types';
import { SummaryCard } from './SummaryCard';
import { MessageTable } from './MessageTable';
import { truncateSessionId } from '../utils/formatters';
import { Breadcrumb } from './Breadcrumb';

interface SessionDetailProps {
  projectName: string;
  sessionId: string;
}

const API_BASE_URL = 'http://localhost:3001';

type ThreadFilter = 'all' | 'main' | 'sidechain';

export function applyFilters(
  messages: Message[],
  threadFilter: ThreadFilter,
  showUser: boolean,
  showAssistant: boolean
): Message[] {
  return messages.filter((msg) => {
    if (threadFilter === 'main' && msg.isSidechain) return false;
    if (threadFilter === 'sidechain' && !msg.isSidechain) return false;
    if (!showUser && msg.role === 'user') return false;
    if (!showAssistant && msg.role === 'assistant') return false;
    return true;
  });
}

export function SessionDetail({ projectName, sessionId }: SessionDetailProps) {
  const [sessionDetail, setSessionDetail] = useState<SessionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>('all');
  const [showUser, setShowUser] = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);

  // Filtered messages — computed instantly, no async work needed
  const filteredMessages = useMemo(() => {
    if (!sessionDetail) return [];
    return applyFilters(sessionDetail.messages, threadFilter, showUser, showAssistant);
  }, [sessionDetail, threadFilter, showUser, showAssistant]);

  // Fetch session detail from API
  useEffect(() => {
    const fetchSessionDetail = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/session-detail/${encodeURIComponent(projectName)}/${encodeURIComponent(sessionId)}`
        );

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setSessionDetail(null);
          return;
        }

        setSessionDetail(data.sessionDetail);
      } catch (err) {
        console.error('Failed to fetch session detail:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch session details. Make sure the server is running.'
        );
        setSessionDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetail();
  }, [projectName, sessionId]);

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: 'Projects', path: '/' },
          { label: projectName, path: `/project/${encodeURIComponent(projectName)}` },
          { label: truncateSessionId(sessionId, 12) }
        ]}
      />

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Session Detail</h2>
        <p className="text-muted text-sm mt-1 font-mono">
          Session ID: {sessionId}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-400 mx-auto mb-4"></div>
            <p className="text-subtle">Loading session details...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-secondary border border-warning rounded-lg p-6">
          <h3 className="text-warning font-semibold mb-2">Failed to load session</h3>
          <p className="text-muted">Failed to load session details. Try refreshing the page.</p>
          <p className="text-subtle text-sm mt-2">
            Make sure the API server is running on port 3001.
          </p>
        </div>
      )}

      {/* Session Content */}
      {!loading && !error && sessionDetail && (
        <div className="space-y-6">
          {/* Summary Card */}
          <SummaryCard session={sessionDetail} />

          {/* Filter Controls */}
          <div className="bg-secondary border border-border rounded-lg p-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Thread filter — mutually exclusive toggle */}
              <div className="flex items-center gap-2">
                <span className="text-subtle text-xs uppercase tracking-wider font-semibold mr-1">Thread:</span>
                {(['all', 'main', 'sidechain'] as ThreadFilter[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setThreadFilter(value)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      threadFilter === value
                        ? 'bg-blue-500 text-white'
                        : 'bg-tertiary text-muted hover:text-foreground hover:bg-zinc-600'
                    }`}
                  >
                    {value === 'all' ? 'All' : value === 'main' ? 'Main Thread' : 'Sidechain'}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border" />

              {/* Role filters — independent checkboxes */}
              <div className="flex items-center gap-3">
                <span className="text-subtle text-xs uppercase tracking-wider font-semibold mr-1">Role:</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showUser}
                    onChange={(e) => setShowUser(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-muted">Show User</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showAssistant}
                    onChange={(e) => setShowAssistant(e.target.checked)}
                    className="accent-blue-500"
                  />
                  <span className="text-sm text-muted">Show Assistant</span>
                </label>
              </div>
            </div>
          </div>

          {/* Message Table */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Messages</h3>
            <MessageTable
              messages={filteredMessages}
              totalMessages={sessionDetail.messages.length}
            />
          </div>
        </div>
      )}
    </div>
  );
}
