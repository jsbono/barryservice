import { useState } from 'react';

interface VehicleImageProps {
  make: string;
  model: string;
  year: number;
  vehicleId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export function VehicleImage({ make, model, year, vehicleId, className = '', size = 'md' }: VehicleImageProps) {
  const [error, setError] = useState(false);

  // Use proxy endpoint - serves image directly, bypasses CORS
  const imageUrl = vehicleId
    ? `/api/vehicle-images/proxy/vehicle/${vehicleId}`
    : `/api/vehicle-images/proxy/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${year}`;

  // Fallback SVG car icon
  const FallbackIcon = () => (
    <div className={`${sizeClasses[size]} ${className} bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center`}>
      <svg
        className="w-1/2 h-1/2 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
        />
      </svg>
    </div>
  );

  if (error) {
    return <FallbackIcon />;
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-xl overflow-hidden bg-gray-100`}>
      <img
        src={imageUrl}
        alt={`${year} ${make} ${model}`}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
