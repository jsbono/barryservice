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
      <div className="glass-card p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Recommendations Found</h3>
        <p className="text-gray-500">
          We don't have service recommendations for the {vehicle.year} {vehicle.make} {vehicle.model} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* AI-Generated Artistic Car Image Banner */}
      <div className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="spinner mx-auto mb-3 border-white/30 border-t-white"></div>
              <p className="text-sm opacity-80">Generating AI artwork...</p>
            </div>
          </div>
        )}
        <img
          src={`https://image.pollinations.ai/prompt/${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model} car, artistic oil painting style, vintage aesthetic, dramatic lighting, rich colors, museum quality artwork, detailed, professional`)}?width=800&height=400&nologo=true`}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop&auto=format';
            setImageLoaded(true);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium mb-3">
                AI Generated Artwork
              </span>
              <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-white/80 mt-1">Recommended Service Schedule</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-white">{services.length}</div>
              <div className="text-white/70 text-sm">Services</div>
            </div>
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="p-6">
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="group bg-white rounded-xl p-4 border-2 border-gray-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 card-hover"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {service.service_name}
                    </h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {service.recommended_mileage && (
                        <span className="inline-flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Every {service.recommended_mileage.toLocaleString()} miles
                        </span>
                      )}
                      {service.recommended_time_months && (
                        <span className="inline-flex items-center text-sm text-gray-500">
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
                </div>
                {service.recommended_mileage && (
                  <div className="badge badge-info">
                    {service.recommended_mileage.toLocaleString()} mi
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
