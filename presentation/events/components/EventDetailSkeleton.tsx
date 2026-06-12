"use client";

export const EventDetailSkeleton = () => (
  <div className="min-h-screen animate-pulse">
    <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: info skeleton */}
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
          <div className="h-32 bg-gray-200 rounded" />
        </div>
        {/* Right: bento skeleton */}
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2 h-64 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);
