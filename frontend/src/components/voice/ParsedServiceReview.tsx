import { useState } from 'react';
import { VoiceParsedData } from '../../lib/types';

interface ParsedServiceReviewProps {
  data: VoiceParsedData & { transcript: string };
  onConfirm: (data: {
    services: string[];
    laborHours: number;
    parts: Array<{ name: string; quantity: number }>;
    notes: string;
  }) => void;
  onCancel: () => void;
}

export function ParsedServiceReview({ data, onConfirm, onCancel }: ParsedServiceReviewProps) {
  const [services, setServices] = useState(data.services.map(s => s.name));
  const [laborHours, setLaborHours] = useState(data.laborHours || 0);
  const [parts, setParts] = useState(data.parts.map(p => ({ name: p.name, quantity: p.quantity })));
  const [notes, setNotes] = useState(data.notes || '');

  const handleAddService = () => {
    setServices([...services, '']);
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...services];
    newServices[index] = value;
    setServices(newServices);
  };

  const handleAddPart = () => {
    setParts([...parts, { name: '', quantity: 1 }]);
  };

  const handleRemovePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: 'name' | 'quantity', value: string | number) => {
    const newParts = [...parts];
    if (field === 'quantity') {
      newParts[index].quantity = Number(value);
    } else {
      newParts[index].name = value as string;
    }
    setParts(newParts);
  };

  const handleConfirm = () => {
    onConfirm({
      services: services.filter(s => s.trim()),
      laborHours,
      parts: parts.filter(p => p.name.trim()),
      notes,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Review Service Entry</h3>
        <span className={`text-sm px-2 py-1 rounded ${
          data.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
          data.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {Math.round(data.confidence * 100)}% confidence
        </span>
      </div>

      {/* Transcript */}
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 mb-1">Original transcript:</p>
        <p className="text-sm italic text-gray-700">{data.transcript}</p>
      </div>

      {/* Services */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Services Performed</label>
          <button
            onClick={handleAddService}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Service
          </button>
        </div>
        <div className="space-y-2">
          {services.map((service, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={service}
                onChange={(e) => handleServiceChange(index, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Service name"
              />
              <button
                onClick={() => handleRemoveService(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Labor Hours */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">Labor Hours</label>
        <input
          type="number"
          value={laborHours}
          onChange={(e) => setLaborHours(Number(e.target.value))}
          min="0"
          step="0.5"
          className="w-32 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Parts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Parts Used</label>
          <button
            onClick={handleAddPart}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Part
          </button>
        </div>
        <div className="space-y-2">
          {parts.map((part, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={part.name}
                onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Part name"
              />
              <input
                type="number"
                value={part.quantity}
                onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                min="1"
                className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => handleRemovePart(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {parts.length === 0 && (
            <p className="text-sm text-gray-500 italic">No parts detected</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 block mb-2">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Any additional notes..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Confirm & Create Service Log
        </button>
      </div>
    </div>
  );
}
