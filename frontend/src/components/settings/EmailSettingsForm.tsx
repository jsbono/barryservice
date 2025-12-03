import { useState } from 'react';
import { triggerReminders } from '../../lib/api';

export function EmailSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTriggerReminders = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await triggerReminders();
      setResult(`Reminder job completed: ${response.sent} sent, ${response.skipped} skipped, ${response.errors} errors`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger reminders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Email Reminders</h3>
      <p className="text-gray-500 mb-4">
        Reminder emails are automatically sent daily at 9 AM for services due within 14 days or 300 miles.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">Days before due:</span>
            <span className="ml-2 font-medium">14 days</span>
          </div>
          <div>
            <span className="text-gray-500">Miles before due:</span>
            <span className="ml-2 font-medium">300 miles</span>
          </div>
          <div>
            <span className="text-gray-500">Suppression window:</span>
            <span className="ml-2 font-medium">7 days</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <button
            onClick={handleTriggerReminders}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Running...' : 'Trigger Reminders Now'}
          </button>

          {result && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700">
              {result}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
