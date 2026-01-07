export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ohafia-sand-50 flex items-center justify-center">
      <div className="text-center">
        {/* Animated logo/spinner */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-ohafia-sand-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-ohafia-primary-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-ohafia-primary-500 to-ohafia-accent-500 flex items-center justify-center">
            <span className="text-white font-display text-xl font-bold">A</span>
          </div>
        </div>
        
        <h2 className="font-display text-xl text-ohafia-earth-800 mb-2">
          Asụsụ Ohafia
        </h2>
        <p className="text-ohafia-earth-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}
