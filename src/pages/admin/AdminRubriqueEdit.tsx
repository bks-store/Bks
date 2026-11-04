import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, Check, Trash2 } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { useTranslation } from '../../i18n/useTranslation'
import {
  deleteRubrique, productsForRubrique, saveRubrique, slugify, uniqueSlug,
  type Rubrique, type RubriqueRule,
} from '../../lib/content'
import { BRANDS, PRODUCTS } from '../../data/products'
import { productImage } from '../../config/images'
import SmartImage from '../../components/SmartImage'
import { ImageField, Section, Switch, useConfirm } from '../../components/admin/ui'

const EMPTY: Rubrique = {
  id: '', slug: '', name: '', description: '', coverUrl: null,
  ruleType: 'brand', ruleValue: '', productIds: [], position: 0,
  isVisible: true, inMenu: true, onHome: false,
}
const RULES: RubriqueRule[] = ['brand', 'category', 'new', 'manual']
const CATEGORIES = ['sneakers', 'streetwear', 'accessoires'] as const

export default function AdminRubriqueEdit() {
  const { id } = useParams()
  const isNew = id === 'nouvelle'
  const navigate = useNavigate()
  const { t } = useTranslation()
  const r = t.admin.rubriques
  const f = r.form
  const { content, loading, reload } = useContent()
  const { ask, dialog } = useConfirm()

  const existing = content.rubriques.find(x => x.id === id)
  const [form, setForm] = useState<Rubrique>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) { setForm(existing); setSlugTouched(true) }
  }, [existing])

  const set = <K extends keyof Rubrique>(key: K, value: Rubrique[K]) => setForm(prev => ({ ...prev, [key]: value }))

  const onName = (name: string) => setForm(prev => ({
    ...prev, name,
    slug: slugTouched ? prev.slug : uniqueSlug(name, content.rubriques, prev.id),
    ruleValue: prev.ruleType === 'brand' && (!prev.ruleValue || prev.ruleValue === prev.name) ? name : prev.ruleValue,
  }))

  const onRule = (ruleType: RubriqueRule) => setForm(prev => ({
    ...prev, ruleType,
    ruleValue: ruleType === 'category' ? (CATEGORIES.includes(prev.ruleValue as typeof CATEGORIES[number]) ? prev.ruleValue : 'sneakers')
      : ruleType === 'brand' ? (BRANDS.find(b => b.toLowerCase() === prev.name.toLowerCase()) ?? '') : '',
  }))

  const matching = useMemo(() => productsForRubrique(form, PRODUCTS), [form])

  const toggleProduct = (pid: string) => set('productIds',
    form.productIds.includes(pid) ? form.productIds.filter(x => x !== pid) : [...form.productIds, pid])
  const moveProduct = (index: number, dir: -1 | 1) => {
    const ids = [...form.productIds]; const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    set('productIds', ids)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError(f.nameRequired)
    if (form.ruleType === 'brand' && !form.ruleValue.trim()) return setError(f.valueRequired)
    setSaving(true)
    try {
      const slug = uniqueSlug(form.slug || form.name, content.rubriques, form.id)
      await saveRubrique({ ...form, name: form.name.trim(), ruleValue: form.ruleValue.trim(), slug })
      await reload()
      navigate('/admin/rubriques')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!existing || !(await ask(r.confirmDelete.replace('{name}', existing.name), r.remove))) return
    try { await deleteRubrique(existing.id); await reload(); navigate('/admin/rubriques') }
    catch (err) { setError(err instanceof Error ? err.message : 'Suppression impossible') }
  }

  if (!isNew && !existing) {
    if (loading) return null
    return (
      <div className="admin-card" style={{padding:'3rem', textAlign:'center'}}>
        <p style={{marginBottom:'1.5rem', color:'var(--ink-soft)'}}>Rubrique introuvable.</p>
        <Link to="/admin/rubriques" className="btn btn--outline">{r.title}</Link>
      </div>
    )
  }

  const categoryLabel = (c: typeof CATEGORIES[number]) => t.catalogue[c]

  return (
    <form onSubmit={submit}>
      <div className="admin-head">
        <div>
          <Link to="/admin/rubriques" className="a-back"><ArrowLeft size={15} strokeWidth={1.6} /> {r.title}</Link>
          <h1>{isNew ? f.newTitle : form.name || f.editTitle}</h1>
        </div>
        {!isNew && (
          <button type="button" className="btn btn--outline a-danger-btn" onClick={remove}><Trash2 size={15} strokeWidth={1.5} /> {r.remove}</button>
        )}
      </div>

      <div className="a-layout">
        <div className="a-layout__main">
          <Section title={f.general}>
            <div className="a-field">
              <label htmlFor="r-name">{f.name}</label>
              <input id="r-name" className="a-input" value={form.name} onChange={e => onName(e.target.value)} placeholder={f.namePh} autoFocus={isNew} />
            </div>
            <div className="a-field">
              <label htmlFor="r-slug">{f.url}</label>
              <div className="a-input a-input--prefix">
                <span>/rubrique/</span>
                <input id="r-slug" value={form.slug}
                  onChange={e => { setSlugTouched(true); set('slug', slugify(e.target.value)) }} />
              </div>
            </div>
            <div className="a-field">
              <label htmlFor="r-desc">{f.description}</label>
              <textarea id="r-desc" className="a-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder={f.descPh} />
            </div>
          </Section>

          <Section title={f.content}>
            <div className="rule-cards" role="radiogroup">
              {RULES.map(rule => (
                <label key={rule} className={`rule-card ${form.ruleType === rule ? 'is-active' : ''}`}>
                  <input type="radio" name="rule" checked={form.ruleType === rule} onChange={() => onRule(rule)} />
                  <span className="rule-card__title">{r.rules[rule]}</span>
                  <span className="rule-card__help">{r.ruleHelp[rule]}</span>
                </label>
              ))}
            </div>

            {form.ruleType === 'brand' && (
              <div className="a-field">
                <label htmlFor="r-brand">{f.brand}</label>
                <input id="r-brand" className="a-input" list="brands" value={form.ruleValue} onChange={e => set('ruleValue', e.target.value)} placeholder={f.brandPh} />
                <datalist id="brands">{BRANDS.map(b => <option key={b} value={b} />)}</datalist>
              </div>
            )}
            {form.ruleType === 'category' && (
              <div className="a-field">
                <label htmlFor="r-cat">{f.category}</label>
                <select id="r-cat" className="a-input" value={form.ruleValue} onChange={e => set('ruleValue', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                </select>
              </div>
            )}
            {form.ruleType === 'manual' && (
              <div className="a-field">
                <label>{f.pick} ({form.productIds.length})</label>
                <ul className="pick-list">
                  {[...form.productIds.map(pid => PRODUCTS.find(p => p.id === pid)).filter(Boolean), ...PRODUCTS.filter(p => !form.productIds.includes(p.id))]
                    .map(p => p!).map(p => {
                      const index = form.productIds.indexOf(p.id)
                      const picked = index >= 0
                      return (
                        <li key={p.id} className={picked ? 'is-picked' : ''}>
                          <button type="button" className="pick-list__toggle" onClick={() => toggleProduct(p.id)} aria-pressed={picked}>
                            <span className="pick-list__check">{picked && <Check size={13} strokeWidth={2.2} />}</span>
                            <span className="media pick-list__thumb"><SmartImage src={productImage(p)} alt="" /></span>
                            <span className="pick-list__text"><strong>{p.name}</strong><small>{p.brand}</small></span>
                          </button>
                          {picked && (
                            <span className="pick-list__order">
                              <button type="button" onClick={() => moveProduct(index, -1)} disabled={index === 0} aria-label={r.moveUp}><ArrowUp size={14} /></button>
                              <button type="button" onClick={() => moveProduct(index, 1)} disabled={index === form.productIds.length - 1} aria-label={r.moveDown}><ArrowDown size={14} /></button>
                            </span>
                          )}
                        </li>
                      )
                    })}
                </ul>
              </div>
            )}
          </Section>
        </div>

        <div className="a-layout__side">
          <Section title={f.cover}>
            <ImageField value={form.coverUrl} onChange={url => set('coverUrl', url)} onReset={() => set('coverUrl', null)}
              label={f.coverHelp} ratio="4 / 3" replaceLabel={t.admin.media.replace} resetLabel={t.admin.media.remove} />
          </Section>

          <Section title={f.display}>
            <div style={{display:'grid', gap:'1rem'}}>
              <Switch checked={form.isVisible} onChange={v => set('isVisible', v)} label={f.visible} />
              <Switch checked={form.inMenu} onChange={v => set('inMenu', v)} label={f.menu} />
              <Switch checked={form.onHome} onChange={v => set('onHome', v)} label={f.home} hint={r.homeLimit} />
            </div>
          </Section>

          <Section title={f.preview}>
            <p className="a-hint" style={{marginBottom: matching.length ? '1rem' : 0}}>
              {matching.length ? f.previewCount.replace('{n}', String(matching.length)) : f.none}
            </p>
            {matching.length > 0 && (
              <div className="preview-grid">
                {matching.slice(0, 6).map(p => (
                  <div key={p.id} className="media"><SmartImage src={productImage(p)} alt={p.name} /></div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      {error && <p className="a-error" role="alert">{error}</p>}
      <div className="a-savebar">
        <Link to="/admin/rubriques" className="btn btn--outline">{f.cancel}</Link>
        <button type="submit" className="btn btn--solid" disabled={saving}>{saving ? f.saving : f.save}</button>
      </div>
      {dialog}
    </form>
  )
}
