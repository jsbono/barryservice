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

  return (
    <div className="glass-card p-8">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Find Your Vehicle</h2>
          <p className="text-gray-500 text-sm">Select make, model, and year to get started</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Make
          </label>
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="select-modern"
            disabled={loading}
          >
            <option value="">Select Make</option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
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
            className="select-modern"
            disabled={!selectedMake || loading}
          >
            <option value="">{selectedMake ? 'Select Model' : 'Select make first'}</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
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
            className="select-modern"
            disabled={!selectedModel || loading}
          >
            <option value="">{selectedModel ? 'Select Year' : 'Select model first'}</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={!selectedMake || !selectedModel || !selectedYear || loading}
        className="btn-primary w-full mt-6 flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            Loading...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search Services
          </>
        )}
      </button>
    </div>
  );
}
