export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-gray-400">
          &copy; {new Date().getFullYear()} Mechanic Service Tracker. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
