import { useState } from 'react';
import { ServiceRecommendation } from '../../lib/types';

interface Props {
  services: ServiceRecommendation[];
  vehicle: { make: string; model: string; year: number };
}

export function ServiceRecommendationList({ services, vehicle }: Props) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (services.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">No Recommendations Found</h3>
        <p className="text-gray-500">
          We don't have service recommendations for the {vehicle.year} {vehicle.make} {vehicle.model} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* AI-Generated Car Image */}
      <div className="relative h-72 sm:h-80 md:h-96 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        {/* Loading State */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-medium">Generating AI artwork...</p>
              <p className="text-sm text-white/70 mt-1">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Image */}
        <img
          src={`https://image.pollinations.ai/prompt/${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model} car, artistic oil painting style, vintage aesthetic, dramatic lighting, rich colors, museum quality artwork, detailed, professional, showroom`)}?width=1200&height=600&nologo=true`}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=600&fit=crop&auto=format';
            setImageLoaded(true);
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-semibold mb-3">
                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
                AI Generated Artwork
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-white/70 mt-2">Recommended Service Schedule</p>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className="text-3xl font-bold text-white">{services.length}</div>
              <div className="text-white/80 text-sm leading-tight">
                Service<br/>Items
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="p-6 sm:p-8">
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="group flex items-start space-x-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200"
            >
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {service.service_name}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  {service.recommended_mileage && (
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Every {service.recommended_mileage.toLocaleString()} miles
                    </span>
                  )}
                  {service.recommended_time_months && (
                    <span className="inline-flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Every{' '}
                      {service.recommended_time_months >= 12
                        ? `${Math.floor(service.recommended_time_months / 12)} year${service.recommended_time_months >= 24 ? 's' : ''}`
                        : `${service.recommended_time_months} months`}
                    </span>
                  )}
                </div>
              </div>

              {/* Badge */}
              {service.recommended_mileage && (
                <div className="flex-shrink-0">
                  <span className="badge badge-blue">
                    {service.recommended_mileage.toLocaleString()} mi
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
