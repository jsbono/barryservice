import { VehicleImage } from '../components/vehicles/VehicleImage';

export function TestVehicleImage() {
  // Test vehicles from the database
  const testVehicles = [
    { id: 'f5428602-efc0-4776-847f-ab70f24db366', make: 'Toyota', model: 'Tundra', year: 2006 },
    { id: 'b5636cee-dfa5-4ad0-860d-2cc3fc5dfae0', make: 'Jeep', model: 'Wrangler', year: 2008 },
    { id: '57ca327d-aea5-46bf-85e7-f7fc97eee504', make: 'Subaru', model: 'Outback', year: 2016 },
  ];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Vehicle Image Test Page</h1>

      <div className="space-y-8">
        {/* Test with vehicleId */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test with Vehicle ID (uses proxy/vehicle/:id)</h2>
          <div className="flex gap-6">
            {testVehicles.map((v) => (
              <div key={v.id} className="text-center">
                <VehicleImage vehicleId={v.id} make={v.make} model={v.model} year={v.year} size="xl" />
                <p className="mt-2 font-medium">{v.year} {v.make} {v.model}</p>
                <p className="text-xs text-gray-500">ID: {v.id.substring(0, 8)}...</p>
              </div>
            ))}
          </div>
        </section>

        {/* Test with make/model/year */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test with Make/Model/Year (uses proxy/:make/:model/:year)</h2>
          <div className="flex gap-6">
            {testVehicles.map((v, i) => (
              <div key={i} className="text-center">
                <VehicleImage make={v.make} model={v.model} year={v.year} size="xl" />
                <p className="mt-2 font-medium">{v.year} {v.make} {v.model}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Direct img tag test */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Direct IMG Tag Test (bypasses component)</h2>
          <div className="flex gap-6">
            <div className="text-center">
              <img
                src="/api/vehicle-images/proxy/Toyota/Tundra/2006"
                alt="Toyota Tundra 2006"
                className="w-48 h-48 object-cover rounded-xl"
                onError={(e) => {
                  console.error('Image failed to load');
                  (e.target as HTMLImageElement).style.border = '3px solid red';
                }}
                onLoad={() => console.log('Image loaded successfully')}
              />
              <p className="mt-2 font-medium">2006 Toyota Tundra</p>
              <p className="text-xs text-gray-500">Direct img tag</p>
            </div>
            <div className="text-center">
              <img
                src="/api/vehicle-images/proxy/Jeep/Wrangler/2008"
                alt="Jeep Wrangler 2008"
                className="w-48 h-48 object-cover rounded-xl"
              />
              <p className="mt-2 font-medium">2008 Jeep Wrangler</p>
              <p className="text-xs text-gray-500">Direct img tag</p>
            </div>
          </div>
        </section>

        {/* Different sizes */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Size Variants</h2>
          <div className="flex items-end gap-6">
            <div className="text-center">
              <VehicleImage make="Toyota" model="Tundra" year={2006} size="sm" />
              <p className="mt-2 text-sm">sm (48x48)</p>
            </div>
            <div className="text-center">
              <VehicleImage make="Toyota" model="Tundra" year={2006} size="md" />
              <p className="mt-2 text-sm">md (80x80)</p>
            </div>
            <div className="text-center">
              <VehicleImage make="Toyota" model="Tundra" year={2006} size="lg" />
              <p className="mt-2 text-sm">lg (128x128)</p>
            </div>
            <div className="text-center">
              <VehicleImage make="Toyota" model="Tundra" year={2006} size="xl" />
              <p className="mt-2 text-sm">xl (192x192)</p>
            </div>
          </div>
        </section>

        {/* Debug info */}
        <section className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <p><strong>Proxy URL example:</strong> /api/vehicle-images/proxy/Toyota/Tundra/2006</p>
          <p><strong>Vehicle ID URL example:</strong> /api/vehicle-images/proxy/vehicle/f5428602-efc0-4776-847f-ab70f24db366</p>
          <p className="mt-4">Open browser DevTools (F12) → Network tab to see image requests</p>
          <p>Open Console tab to see any JavaScript errors</p>
        </section>
      </div>
    </div>
  );
}
