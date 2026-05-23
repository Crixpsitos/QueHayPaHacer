"use client"
import { Button } from '@/app/components/ui/button'
import { Progress } from '@/app/components/ui/progress'
import { X } from 'lucide-react'
import { memo } from 'react';

interface EventStickyHeaderProps {
  progressPercentage: number;
  setShowCancelDialog: (showCancelDialog: boolean) => void;
}

const EventStickyHeader = ({
  progressPercentage,
  setShowCancelDialog,
}: EventStickyHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h1 className="text-lg font-semibold text-gray-900 leading-tight">
          Empieza a crear tu evento
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCancelDialog(true)}
          className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-full h-8 w-8 p-0"
          aria-label="Cancel event creation"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar con porcentaje */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <Progress
          value={progressPercentage}
          className="h-1.5 flex-1 rounded-full bg-gray-100"
        />
        <span className="text-xs font-semibold text-gray-400 w-8 text-right tabular-nums">
          {progressPercentage}%
        </span>
      </div>
    </div>
  )
}

export default memo(EventStickyHeader)
