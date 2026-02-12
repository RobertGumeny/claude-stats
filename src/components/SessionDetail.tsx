import { useState, useEffect } from 'react';
import { SessionDetail as SessionDetailType } from '../types';
import { SummaryCard } from './SummaryCard';
import { MessageTable } from './MessageTable';
import { truncateSessionId } from '../utils/formatters';

interface SessionDetailProps {
  projectName: string;
  sessionId: string;
  onBack: () => void;
}

const API_BASE_URL = 'http://localhost:3001';

export function SessionDetail({ projectName, sessionId, onBack }: SessionDetailProps) {
  const [sessionDetail, setSessionDetail] = useState<SessionDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      {/* Breadcrumb and Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-accent-primary hover:text-blue-400 transition-colors mb-2 flex items-center gap-2"
        >
          ← Back to Sessions
        </button>
        <div className="text-text-tertiary text-sm">
          Projects &gt; <span className="text-text-secondary">{projectName}</span> &gt;{' '}
          <span className="text-text-primary font-semibold">
            {truncateSessionId(sessionId, 12)}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">Session Detail</h2>
        <p className="text-text-secondary text-sm mt-1 font-mono">
          Session ID: {sessionId}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-text-tertiary">Loading session details...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-background-secondary border border-accent-warning rounded-lg p-6">
          <h3 className="text-accent-warning font-semibold mb-2">Error Loading Session</h3>
          <p className="text-text-secondary">{error}</p>
        </div>
      )}

      {/* Session Content */}
      {!loading && !error && sessionDetail && (
        <div className="space-y-6">
          {/* Summary Card */}
          <SummaryCard session={sessionDetail} />

          {/* Message Table */}
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-4">Messages</h3>
            <MessageTable messages={sessionDetail.messages} />
          </div>
        </div>
      )}
    </div>
  );
}
