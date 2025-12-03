import { useState, useEffect, useRef } from 'react';
import { CreateVehicleRequest, Vehicle } from '../../lib/types';

// Comprehensive list of vehicle makes and their models
const vehicleData: Record<string, string[]> = {
  'Acura': ['ILX', 'Integra', 'MDX', 'NSX', 'RDX', 'RLX', 'TL', 'TLX', 'TSX', 'ZDX'],
  'Alfa Romeo': ['4C', 'Giulia', 'Stelvio', 'Tonale'],
  'Aston Martin': ['DB11', 'DB9', 'DBX', 'Vantage', 'Rapide'],
  'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'e-tron', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'TT'],
  'Bentley': ['Bentayga', 'Continental GT', 'Flying Spur', 'Mulsanne'],
  'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i4', 'i7', 'i8', 'iX', 'M2', 'M3', 'M4', 'M5', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4'],
  'Buick': ['Cascada', 'Enclave', 'Encore', 'Encore GX', 'Envision', 'LaCrosse', 'Regal', 'Verano'],
  'Cadillac': ['ATS', 'CT4', 'CT5', 'CT6', 'CTS', 'Escalade', 'Lyriq', 'SRX', 'XT4', 'XT5', 'XT6', 'XTS'],
  'Chevrolet': ['Avalanche', 'Blazer', 'Bolt', 'Camaro', 'Colorado', 'Corvette', 'Cruze', 'Equinox', 'Express', 'Impala', 'Malibu', 'Silverado 1500', 'Silverado 2500', 'Silverado 3500', 'Sonic', 'Spark', 'Suburban', 'Tahoe', 'Trailblazer', 'Traverse', 'Trax', 'Volt'],
  'Chrysler': ['200', '300', 'Pacifica', 'Town & Country', 'Voyager'],
  'Dodge': ['Avenger', 'Challenger', 'Charger', 'Dart', 'Durango', 'Grand Caravan', 'Hornet', 'Journey', 'Nitro', 'Ram 1500', 'Ram 2500', 'Ram 3500', 'Viper'],
  'Ferrari': ['296', '458', '488', '812', 'California', 'F8', 'Portofino', 'Roma', 'SF90'],
  'Fiat': ['124 Spider', '500', '500L', '500X'],
  'Ford': ['Bronco', 'Bronco Sport', 'C-Max', 'E-Series', 'EcoSport', 'Edge', 'Escape', 'Expedition', 'Explorer', 'F-150', 'F-250', 'F-350', 'Fiesta', 'Flex', 'Focus', 'Fusion', 'Maverick', 'Mustang', 'Mustang Mach-E', 'Ranger', 'Taurus', 'Transit'],
  'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  'GMC': ['Acadia', 'Canyon', 'Hummer EV', 'Sierra 1500', 'Sierra 2500', 'Sierra 3500', 'Terrain', 'Yukon', 'Yukon XL'],
  'Honda': ['Accord', 'Civic', 'Clarity', 'CR-V', 'CR-Z', 'Element', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Passport', 'Pilot', 'Prelude', 'Prologue', 'Ridgeline', 'S2000'],
  'Hyundai': ['Accent', 'Azera', 'Elantra', 'Genesis', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Nexo', 'Palisade', 'Santa Cruz', 'Santa Fe', 'Sonata', 'Tucson', 'Veloster', 'Venue'],
  'Infiniti': ['EX', 'FX', 'G35', 'G37', 'JX', 'M', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX55', 'QX60', 'QX70', 'QX80'],
  'Jaguar': ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'XE', 'XF', 'XJ', 'XK'],
  'Jeep': ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Grand Cherokee L', 'Grand Wagoneer', 'Liberty', 'Patriot', 'Renegade', 'Wagoneer', 'Wrangler'],
  'Kia': ['Carnival', 'Cadenza', 'EV6', 'Forte', 'K5', 'K900', 'Niro', 'Optima', 'Rio', 'Seltos', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Telluride'],
  'Lamborghini': ['Aventador', 'Gallardo', 'Huracan', 'Urus'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  'Lexus': ['CT', 'ES', 'GS', 'GX', 'IS', 'LC', 'LS', 'LX', 'NX', 'RC', 'RX', 'RZ', 'SC', 'TX', 'UX'],
  'Lincoln': ['Aviator', 'Continental', 'Corsair', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Nautilus', 'Navigator', 'Town Car'],
  'Lotus': ['Elise', 'Emira', 'Evora', 'Exige'],
  'Maserati': ['Ghibli', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte'],
  'Mazda': ['CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'CX-90', 'Mazda2', 'Mazda3', 'Mazda5', 'Mazda6', 'MX-5 Miata', 'MX-30', 'RX-7', 'RX-8'],
  'McLaren': ['540C', '570S', '600LT', '620R', '650S', '720S', '765LT', 'Artura', 'GT', 'P1', 'Senna'],
  'Mercedes-Benz': ['A-Class', 'AMG GT', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'EQB', 'EQC', 'EQE', 'EQS', 'G-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Maybach', 'Metris', 'S-Class', 'SL', 'SLC', 'SLK', 'Sprinter'],
  'Mini': ['Clubman', 'Convertible', 'Countryman', 'Hardtop', 'Paceman'],
  'Mitsubishi': ['Eclipse', 'Eclipse Cross', 'Lancer', 'Mirage', 'Outlander', 'Outlander Sport', 'Pajero'],
  'Nissan': ['350Z', '370Z', 'Altima', 'Armada', 'Frontier', 'GT-R', 'Juke', 'Kicks', 'Leaf', 'Maxima', 'Murano', 'Pathfinder', 'Quest', 'Rogue', 'Rogue Sport', 'Sentra', 'Titan', 'Versa', 'Z'],
  'Porsche': ['718 Boxster', '718 Cayman', '911', '918', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
  'Rivian': ['R1S', 'R1T'],
  'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Spectre', 'Wraith'],
  'Saab': ['9-3', '9-5', '9-7X'],
  'Scion': ['FR-S', 'iA', 'iM', 'iQ', 'tC', 'xA', 'xB', 'xD'],
  'Smart': ['EQ fortwo', 'fortwo'],
  'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'Solterra', 'WRX', 'XV'],
  'Suzuki': ['Equator', 'Grand Vitara', 'Kizashi', 'SX4', 'Vitara', 'XL7'],
  'Tesla': ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'],
  'Toyota': ['4Runner', '86', 'Avalon', 'bZ4X', 'Camry', 'C-HR', 'Corolla', 'Corolla Cross', 'Crown', 'FJ Cruiser', 'GR86', 'GR Corolla', 'GR Supra', 'Highlander', 'Land Cruiser', 'Matrix', 'Mirai', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Supra', 'Tacoma', 'Tundra', 'Venza', 'Yaris'],
  'Volkswagen': ['Arteon', 'Atlas', 'Atlas Cross Sport', 'Beetle', 'CC', 'Eos', 'Golf', 'Golf GTI', 'Golf R', 'ID.4', 'ID.Buzz', 'Jetta', 'Jetta GLI', 'Passat', 'Phaeton', 'Taos', 'Tiguan', 'Touareg'],
  'Volvo': ['C30', 'C40', 'C70', 'S40', 'S60', 'S80', 'S90', 'V40', 'V60', 'V90', 'XC40', 'XC60', 'XC70', 'XC90'],
};

const makes = Object.keys(vehicleData).sort();

interface Props {
  customerId: string;
  vehicle?: Vehicle;
  onSubmit: (data: CreateVehicleRequest) => Promise<void>;
  onClose: () => void;
}

export function VehicleFormModal({ customerId, vehicle, onSubmit, onClose }: Props) {
  const [make, setMake] = useState(vehicle?.make || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState(vehicle?.year?.toString() || new Date().getFullYear().toString());
  const [vin, setVin] = useState(vehicle?.vin || '');
  const [mileage, setMileage] = useState(vehicle?.mileage?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dropdown state
  const [makeSearch, setMakeSearch] = useState(vehicle?.make || '');
  const [modelSearch, setModelSearch] = useState(vehicle?.model || '');
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  // Filter makes based on search
  const filteredMakes = makes.filter((m) =>
    m.toLowerCase().includes(makeSearch.toLowerCase())
  );

  // Get models for selected make
  const availableModels = make ? (vehicleData[make] || []) : [];
  const filteredModels = availableModels.filter((m) =>
    m.toLowerCase().includes(modelSearch.toLowerCase())
  );

  // Generate year options (from 1980 to next year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1979 + 1 }, (_, i) => currentYear + 1 - i);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (makeRef.current && !makeRef.current.contains(event.target as Node)) {
        setShowMakeDropdown(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMakeSelect = (selectedMake: string) => {
    setMake(selectedMake);
    setMakeSearch(selectedMake);
    setShowMakeDropdown(false);
    // Reset model when make changes
    setModel('');
    setModelSearch('');
  };

  const handleModelSelect = (selectedModel: string) => {
    setModel(selectedModel);
    setModelSearch(selectedModel);
    setShowModelDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        customer_id: customerId,
        make: make || makeSearch, // Allow custom makes
        model: model || modelSearch, // Allow custom models
        year: parseInt(year),
        vin: vin || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            {vehicle ? 'Edit Vehicle' : 'Add Vehicle'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Make Dropdown */}
            <div ref={makeRef} className="relative">
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                Make *
              </label>
              <input
                id="make"
                type="text"
                value={makeSearch}
                onChange={(e) => {
                  setMakeSearch(e.target.value);
                  setMake('');
                  setShowMakeDropdown(true);
                }}
                onFocus={() => setShowMakeDropdown(true)}
                required
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search make..."
              />
              {showMakeDropdown && filteredMakes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredMakes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMakeSelect(m)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model Dropdown */}
            <div ref={modelRef} className="relative">
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model *
              </label>
              <input
                id="model"
                type="text"
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value);
                  setModel('');
                  setShowModelDropdown(true);
                }}
                onFocus={() => setShowModelDropdown(true)}
                required
                autoComplete="off"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={make ? 'Search model...' : 'Select make first'}
              />
              {showModelDropdown && make && filteredModels.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleModelSelect(m)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year Dropdown */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
                Mileage
              </label>
              <input
                id="mileage"
                type="number"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                min="0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
              VIN
            </label>
            <input
              id="vin"
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1HGBH41JXMN109186"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
