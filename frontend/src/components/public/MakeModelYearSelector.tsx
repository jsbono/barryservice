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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Find Your Vehicle</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make
          </label>
          <select
            value={selectedMake}
            onChange={(e) => setSelectedMake(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedMake || loading}
          >
            <option value="">Select Model</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedModel || loading}
          >
            <option value="">Select Year</option>
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
        disabled={!selectedMake || !selectedModel || !selectedYear}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Loading...' : 'Search Services'}
      </button>
    </div>
  );
}
