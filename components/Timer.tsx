'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock } from 'lucide-react'

interface TimerProps {
  initialSeconds: number
  onExpire: () => void
  className?: string
}

export default function Timer({ initialSeconds, onExpire, className = '' }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) {
      onExpire()
      return
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds, onExpire])

  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getColorClass = () => {
    if (seconds <= 30) return 'text-red-600 bg-red-50 border-red-200'
    if (seconds <= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-gray-700 bg-gray-50 border-gray-200'
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-medium ${getColorClass()} ${className}`}
    >
      <Clock className="w-4 h-4" />
      <span>{formatTime(seconds)}</span>
    </div>
  )
}
