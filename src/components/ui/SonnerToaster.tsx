import { useState } from 'react'
import { useToastStore, type ToastItem } from '../../stores/toast'

export function SonnerToaster() {
  const toasts = useToastStore(s => s.toasts)
  const removeToast = useToastStore(s => s.removeToast)
  const [isHovered, setIsHovered] = useState(false)

  if (toasts.length === 0) return null

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-2 pointer-events-none select-none max-w-sm w-full px-4"
    >
      {toasts.map((t: ToastItem, index: number) => {
        const isLatest = index === toasts.length - 1
        const offset = (toasts.length - 1 - index) * 12
        const scale = 1 - (toasts.length - 1 - index) * 0.05

        return (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className="pointer-events-auto cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-[0_12px_32px_-8px_rgba(26,24,21,0.2)] text-[var(--ink)] flex items-start gap-3 w-full transition-all duration-300 ease-out"
            style={{
              transform: isHovered
                ? 'translateY(0) scale(1)'
                : `translateY(${offset}px) scale(${scale})`,
              opacity: isHovered ? 1 : isLatest ? 1 : 0.85,
              animation: 'vaulFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                t.tipo === 'success'
                  ? 'bg-[var(--ok)] shadow-[0_0_8px_var(--ok)]'
                  : t.tipo === 'error'
                  ? 'bg-[var(--err)] shadow-[0_0_8px_var(--err)]'
                  : 'bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold tracking-tight leading-snug">
                {t.title}
              </div>
              {t.description && (
                <div className="text-[12px] text-[var(--mute)] mt-0.5 leading-normal">
                  {t.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                removeToast(t.id)
              }}
              className="text-[var(--mute)] hover:text-[var(--ink)] text-xs p-1"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
