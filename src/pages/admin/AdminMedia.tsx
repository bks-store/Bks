import { useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { useTranslation } from '../../i18n/useTranslation'
import {
  addStorePhotos, deleteStorePhoto, isDemo, MEDIA_DEFAULTS, reorderStorePhotos, setMedia, updateStorePhoto,
  type MediaKey,
} from '../../lib/content'
import SmartImage from '../../components/SmartImage'
import { ImageField, Section, useConfirm, useImageUpload } from '../../components/admin/ui'

const MAIN_SLOTS: { key: MediaKey; ratio: string }[] = [
  { key: 'hero', ratio: '7 / 6' },
  { key: 'brand', ratio: '4 / 5' },
  { key: 'store', ratio: '5 / 4' },
  { key: 'about', ratio: '16 / 8' },
]
const INSTAGRAM: MediaKey[] = ['instagram-1', 'instagram-2', 'instagram-3', 'instagram-4', 'instagram-5', 'instagram-6']

export default function AdminMedia() {
  const { t } = useTranslation()
  const m = t.admin.media
  const { content, reload } = useContent()
  const { ask, dialog } = useConfirm()
  const [error, setError] = useState<string | null>(null)
  const photos = content.storePhotos

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try { await action(); await reload() }
    catch (e) { setError(e instanceof Error ? e.message : 'Action impossible') }
  }

  const gallery = useImageUpload(urls => run(() => addStorePhotos(urls)), true)

  const move = (index: number, dir: -1 | 1) => {
    const ids = photos.map(p => p.id); const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    run(() => reorderStorePhotos(ids))
  }

  const slotLabel = (key: MediaKey) => m.slots[key as keyof typeof m.slots]

  return (
    <div>
      <div className="admin-head">
        <div>
          <p className="eyebrow">{m.eyebrow}</p>
          <h1>{m.title}</h1>
          <p className="admin-intro">{m.intro}</p>
        </div>
      </div>

      {isDemo && <p className="a-note">{m.demoNote}</p>}
      {error && <p className="a-error" role="alert">{error}</p>}

      <div className="media-slots">
        {MAIN_SLOTS.map(({ key, ratio }) => (
          <div key={key} className="admin-card" style={{padding:'1rem'}}>
            <ImageField
              value={content.media[key]}
              fallback={MEDIA_DEFAULTS[key]}
              ratio={ratio}
              label={slotLabel(key)}
              replaceLabel={m.replace}
              resetLabel={m.reset}
              onChange={url => run(() => setMedia(key, url))}
              onReset={() => run(() => setMedia(key, null))}
            />
          </div>
        ))}
      </div>

      <Section title={m.instagram}>
        <div className="insta-slots">
          {INSTAGRAM.map((key, i) => (
            <ImageField
              key={key}
              value={content.media[key]}
              fallback={MEDIA_DEFAULTS[key]}
              ratio="1 / 1"
              label={`${i + 1}`}
              replaceLabel={m.replace}
              resetLabel={m.reset}
              onChange={url => run(() => setMedia(key, url))}
              onReset={() => run(() => setMedia(key, null))}
            />
          ))}
        </div>
      </Section>

      <Section title={m.gallery}>
        <p className="a-hint" style={{marginBottom:'1.25rem'}}>{m.galleryIntro}</p>

        <div className={`dropzone ${gallery.dragging ? 'is-dragging' : ''}`} {...gallery.dropProps}>
          {gallery.busy
            ? <span className="dropzone__busy"><Loader2 size={18} className="animate-spin" /> {m.uploading}</span>
            : <>
                <button type="button" className="btn btn--solid" onClick={gallery.open}><ImagePlus size={16} strokeWidth={1.5} /> {m.add}</button>
                <span>{m.drop}</span>
              </>}
          {gallery.input}
        </div>
        {gallery.error && <p className="a-error">{gallery.error}</p>}

        {photos.length === 0 ? (
          <p className="a-hint" style={{marginTop:'1.5rem'}}>{m.emptyGallery}</p>
        ) : (
          <ul className="gallery-admin">
            {photos.map((p, i) => (
              <li key={p.id}>
                <div className="media"><SmartImage src={p.url} alt={p.caption} /></div>
                <input className="a-input" defaultValue={p.caption} placeholder={m.caption}
                  onBlur={e => e.target.value !== p.caption && run(() => updateStorePhoto(p.id, e.target.value))} />
                <div className="gallery-admin__actions">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t.admin.rubriques.moveUp}><ArrowLeft size={15} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} aria-label={t.admin.rubriques.moveDown}><ArrowRight size={15} /></button>
                  <button type="button" className="is-danger" aria-label={m.remove}
                    onClick={async () => { if (await ask(m.confirmRemove, m.remove)) run(() => deleteStorePhoto(p.id)) }}>
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      {dialog}
    </div>
  )
}
