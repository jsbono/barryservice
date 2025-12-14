import { useEffect, useState } from 'react';
import { Insight } from '../../lib/types';
import { getInsights, markInsightRead, dismissInsight, triggerAgentRun } from '../../lib/api';
import { InsightCard } from './InsightCard';

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [runningAgent, setRunningAgent] = useState(false);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await getInsights({ limit: 10 });
      setInsights(response.insights);
      setUnreadCount(response.meta.unreadCount);
    } catch (err) {
      setError('Failed to load insights');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleDismiss = async (id: string) => {
    try {
      await dismissInsight(id);
      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markInsightRead(id);
      setInsights(prev =>
        prev.map(i => (i.id === id ? { ...i, read_at: new Date().toISOString() } : i))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark insight as read:', err);
    }
  };

  const handleRunAgent = async () => {
    try {
      setRunningAgent(true);
      const result = await triggerAgentRun('service_due');
      if (result.success) {
        await loadInsights();
      } else {
        setError(result.error || 'Agent run failed');
      }
    } catch (err) {
      setError('Failed to run agent');
      console.error(err);
    } finally {
      setRunningAgent(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-purple-600">AI Insights</span>
        </h3>
        <p className="text-gray-500">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-purple-600">AI Insights</span>
            {unreadCount > 0 && (
              <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={handleRunAgent}
          disabled={runningAgent}
          className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
        >
          {runningAgent ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-600 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="p-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No insights yet</p>
            <p className="text-sm">
              Click "Run Analysis" to analyze your vehicles and customers
            </p>
          </div>
        ) : (
          insights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDismiss={handleDismiss}
              onMarkRead={handleMarkRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
