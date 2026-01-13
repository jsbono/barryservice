import { useState, useEffect } from 'react';
import { getMakes, getModels, getYears } from '../../lib/api';

interface Props {
  onSelect: (make: string, model: string, year: number) => void;
}

export function MakeModelYearSelector({ onSelect }: Props) {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMakes()
      .then((res) => setMakes(res.makes))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedMake) {
      setLoading(true);
      setModels([]);
      setYears([]);
      setSelectedModel('');
      setSelectedYear('');
      getModels(selectedMake)
        .then((res) => setModels(res.models))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedMake]);

  useEffect(() => {
    if (selectedMake && selectedModel) {
      setLoading(true);
      setYears([]);
      setSelectedYear('');
      getYears(selectedMake, selectedModel)
        .then((res) => setYears(res.years))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedMake, selectedModel]);

  const handleSearch = () => {
    if (selectedMake && selectedModel && selectedYear) {
      onSelect(selectedMake, selectedModel, selectedYear);
    }
  };

  const isComplete = selectedMake && selectedModel && selectedYear;

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="section-icon">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold" style={{ color: 'var(--slate-800)' }}>
            Find Your Vehicle
          </h2>
          <p style={{ color: 'var(--slate-500)' }}>Select make, model, and year to continue</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8">
        {[
          { label: 'Make', active: true, complete: !!selectedMake },
          { label: 'Model', active: !!selectedMake, complete: !!selectedModel },
          { label: 'Year', active: !!selectedModel, complete: !!selectedYear }
        ].map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold transition-all duration-300"
              style={{
                background: step.complete
                  ? 'linear-gradient(135deg, var(--accent-500) 0%, var(--accent-600) 100%)'
                  : step.active
                  ? 'var(--slate-100)'
                  : 'var(--slate-100)',
                color: step.complete
                  ? 'var(--slate-900)'
                  : step.active
                  ? 'var(--slate-700)'
                  : 'var(--slate-400)',
                border: step.active && !step.complete ? '2px solid var(--accent-500)' : 'none',
                boxShadow: step.complete ? '0 4px 12px -2px rgba(245, 158, 11, 0.3)' : 'none',
              }}
            >
              {step.complete ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : index + 1}
            </div>
            <span
              className="ml-2 font-medium text-sm transition-colors"
              style={{
                color: step.complete
                  ? 'var(--accent-600)'
                  : step.active
                  ? 'var(--slate-800)'
                  : 'var(--slate-400)',
              }}
            >
              {step.label}
            </span>
            {index < 2 && (
              <div
                className="w-10 sm:w-16 h-0.5 mx-2 sm:mx-4 rounded-full transition-colors"
                style={{
                  background: step.complete ? 'var(--accent-500)' : 'var(--slate-200)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="label">Make</label>
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="select-field"
            disabled={loading && !makes.length}
          >
            <option value="">Select Make</option>
            {makes.map((make) => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className={`select-field ${!selectedMake ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedMake || (loading && !models.length)}
          >
            <option value="">{selectedMake ? 'Select Model' : 'Select make first'}</option>
            {models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={`select-field ${!selectedModel ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!selectedModel || (loading && !years.length)}
          >
            <option value="">{selectedModel ? 'Select Year' : 'Select model first'}</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={!isComplete || loading}
        className={`btn-primary w-full mt-8 py-4 text-base ${!isComplete ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <>
            <div className="spinner mr-3" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
            Loading...
          </>
        ) : (
          <>
            Get Service Recommendations
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
