import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, Loader2, RotateCcw, Upload } from 'lucide-react'
import SmartImage from '../SmartImage'
import { uploadImage } from '../../lib/content'

export function Switch({ checked, onChange, label, hint }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string
}) {
  return (
    <label className="a-switch">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="a-switch__track" aria-hidden="true"><span /></span>
      <span>
        <span className="a-switch__label">{label}</span>
        {hint && <span className="a-switch__hint">{hint}</span>}
      </span>
    </label>
  )
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="admin-card a-section">
      <div className="a-section__head">
        <h2>{title}</h2>
        {aside}
      </div>
      <div className="a-section__body">{children}</div>
    </section>
  )
}

/** Handles file picking, drag & drop and upload; renders whatever `children` returns. */
export function useImageUpload(onUploaded: (urls: string[]) => void | Promise<void>, multiple = false) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []).slice(0, multiple ? 30 : 1)
    if (!list.length) return
    setBusy(true); setError(null)
    try {
      const urls: string[] = []
      for (const file of list) urls.push(await uploadImage(file))
      await onUploaded(urls)
    } catch (e) {
      setError(e instanceof Error ? e.message : "L'envoi a échoué.")
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [multiple, onUploaded])

  const input = (
    <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden
      onChange={e => handleFiles(e.target.files)} />
  )
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setDragging(true) },
    onDragLeave: () => setDragging(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) },
  }
  return { input, open: () => inputRef.current?.click(), busy, error, dragging, dropProps }
}

export function ImageField({ value, fallback, onChange, onReset, label, ratio = '4 / 3', replaceLabel, resetLabel }: {
  value: string | null | undefined
  fallback?: string
  onChange: (url: string) => void | Promise<void>
  onReset?: () => void | Promise<void>
  label: string
  ratio?: string
  replaceLabel: string
  resetLabel?: string
}) {
  const up = useImageUpload(urls => onChange(urls[0]))
  const shown = value || fallback
  return (
    <div className="a-image">
      <div className={`a-image__frame media ${up.dragging ? 'is-dragging' : ''}`} style={{aspectRatio: ratio}} {...up.dropProps}>
        {shown
          ? <SmartImage src={shown} alt={label} />
          : <button type="button" className="a-image__empty" onClick={up.open}><ImagePlus size={22} strokeWidth={1.3} /></button>}
        {up.busy && <div className="a-image__busy"><Loader2 size={22} className="animate-spin" /></div>}
      </div>
      <div className="a-image__bar">
        <span className="a-image__label">{label}</span>
        <div className="a-image__actions">
          {onReset && value && (
            <button type="button" onClick={onReset} title={resetLabel} aria-label={resetLabel}><RotateCcw size={15} strokeWidth={1.5} /></button>
          )}
          <button type="button" onClick={up.open} disabled={up.busy}><Upload size={15} strokeWidth={1.5} /> {replaceLabel}</button>
        </div>
      </div>
      {up.error && <p className="a-error">{up.error}</p>}
      {up.input}
    </div>
  )
}

export function useConfirm() {
  const [state, setState] = useState<{ message: string; confirmLabel: string; resolve: (ok: boolean) => void } | null>(null)
  const ask = (message: string, confirmLabel: string) =>
    new Promise<boolean>(resolve => setState({ message, confirmLabel, resolve }))
  const close = (ok: boolean) => { state?.resolve(ok); setState(null) }
  const dialog = state && (
    <div className="a-dialog" role="alertdialog" aria-modal="true" aria-label={state.message}>
      <div className="a-dialog__bg" onClick={() => close(false)} />
      <div className="a-dialog__box">
        <p>{state.message}</p>
        <div className="a-dialog__actions">
          <button type="button" className="btn btn--outline" onClick={() => close(false)} autoFocus>Annuler</button>
          <button type="button" className="btn btn--danger" onClick={() => close(true)}>{state.confirmLabel}</button>
        </div>
      </div>
    </div>
  )
  return { ask, dialog }
}
