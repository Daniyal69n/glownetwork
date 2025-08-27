"use client"
import React, { useEffect, useMemo } from "react"

type CelebrationProps = {
  visible: boolean
  title?: string
  subtitle?: string
  onClose?: () => void
  durationMs?: number
}

const PIECES_COUNT = 160

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export const Celebration: React.FC<CelebrationProps> = ({
  visible,
  title = "Congratulations!",
  subtitle,
  onClose,
  durationMs = 4500,
}) => {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      onClose?.()
    }, durationMs)
    return () => clearTimeout(timer)
  }, [visible, durationMs, onClose])

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES_COUNT }).map((_, idx) => {
        const left = randomInt(0, 100)
        const delay = randomFloat(0, 0.6)
        const duration = randomFloat(2.2, 3.4)
        const size = randomInt(6, 11)
        const rotate = randomInt(0, 360)
        const hue = randomInt(0, 360)
        const shape = idx % 3
        return { left, delay, duration, size, rotate, hue, shape }
      }),
    [visible]
  )

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              width: p.shape === 2 ? p.size * 1.6 : p.size,
              height: p.size,
              transform: `rotate(${p.rotate}deg)` ,
              background: `hsl(${p.hue} 90% 55%)`,
            }}
            className={`absolute top-0 block will-change-transform confetti-piece ${
              p.shape === 1 ? "rounded-full" : ""
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="pointer-events-auto mx-4 w-full max-w-md rounded-2xl bg-white/95 p-6 text-center shadow-2xl backdrop-blur">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translate3d(0, -20vh, 0) rotate(0deg);
            opacity: 0;
          }
          10% { opacity: 1; }
          100% {
            transform: translate3d(0, 110vh, 0) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti-piece {
          animation-name: confettiFall;
          animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1);
        }
      `}</style>
    </div>
  )
}

export default Celebration


