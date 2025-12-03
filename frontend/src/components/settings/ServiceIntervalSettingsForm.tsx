export function ServiceIntervalSettingsForm() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Service Interval Defaults</h3>
      <p className="text-gray-500 mb-4">
        These are the default intervals used when calculating next service dates.
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 items-center">
          <span className="font-medium">Oil Change</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              defaultValue={5000}
              className="w-24 border border-gray-300 rounded-md px-3 py-2"
              disabled
            />
            <span className="text-gray-500">miles</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              defaultValue={6}
              className="w-24 border border-gray-300 rounded-md px-3 py-2"
              disabled
            />
            <span className="text-gray-500">months</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <span className="font-medium">Minor Service</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              defaultValue={12000}
              className="w-24 border border-gray-300 rounded-md px-3 py-2"
              disabled
            />
            <span className="text-gray-500">miles</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              defaultValue={12}
              className="w-24 border border-gray-300 rounded-md px-3 py-2"
              disabled
            />
            <span className="text-gray-500">months</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          <span className="font-medium">Major Service</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              defaultValue={30000}
              className="w-24 border border-gray-300 rounded-md px-3 py-2"
              disabled
            />
            <span className="text-gray-500">miles</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              defaultValue={24}
              className="w-24 border border-gray-300 rounded-md px-3 py-2"
              disabled
            />
            <span className="text-gray-500">months</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-400">
        Note: Editing service intervals is not yet implemented. These values are stored in the database.
      </p>
    </div>
  );
}
