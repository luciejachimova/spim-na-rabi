"use client"

import { useCallback, useRef, useState } from "react"

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

// Promise-based confirm dialog styled to match the site, so destructive/
// important actions (delete, sync, block) share one implementation instead
// of each page rolling its own modal or falling back to window.confirm().
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  function handle(result: boolean) {
    setOptions(null)
    resolverRef.current?.(result)
    resolverRef.current = null
  }

  const confirmDialog = options ? (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center bg-dark/60 px-4"
      role="alertdialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handle(false)
      }}
    >
      <div className="w-full max-w-sm rounded-[2px] bg-cream p-6 shadow-xl">
        <h2 className="mb-2 font-serif text-lg text-dark">{options.title}</h2>
        <p className="mb-6 text-sm text-mid">{options.message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => handle(false)}
            className="cursor-pointer rounded-[2px] border border-mid/30 px-4 py-2 text-sm uppercase tracking-wide text-dark hover:bg-pale"
          >
            {options.cancelLabel || "Zrušit"}
          </button>
          <button
            type="button"
            onClick={() => handle(true)}
            className="cursor-pointer rounded-[2px] bg-dark px-4 py-2 text-sm uppercase tracking-wide text-cream hover:bg-accent"
          >
            {options.confirmLabel || "Potvrdit"}
          </button>
        </div>
      </div>
    </div>
  ) : null

  return { confirm, confirmDialog }
}
