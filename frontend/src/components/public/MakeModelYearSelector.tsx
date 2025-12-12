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
      <div className="flex items-center space-x-4 mb-8">
        <div className="section-icon">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold text-gray-900">Find Your Vehicle</h2>
          <p className="text-gray-500">Select make, model, and year to continue</p>
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
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
              step.complete ? 'bg-blue-600 text-white' :
              step.active ? 'bg-blue-100 text-blue-600 border-2 border-blue-600' :
              'bg-gray-100 text-gray-400'
            }`}>
              {step.complete ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : index + 1}
            </div>
            <span className={`ml-2 font-medium transition-colors ${
              step.complete ? 'text-blue-600' :
              step.active ? 'text-gray-900' :
              'text-gray-400'
            }`}>{step.label}</span>
            {index < 2 && (
              <div className={`w-12 sm:w-20 h-1 mx-2 sm:mx-4 rounded-full transition-colors ${
                step.complete ? 'bg-blue-600' : 'bg-gray-200'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Make
          </label>
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

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Model
          </label>
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

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Year
          </label>
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
        className={`btn-primary w-full mt-8 py-4 text-lg ${!isComplete ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
            Loading...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Get Service Recommendations
          </>
        )}
      </button>
    </div>
  );
}
