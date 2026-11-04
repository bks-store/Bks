import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useContent } from '../../context/ContentContext'
import { useTranslation } from '../../i18n/useTranslation'
import { deleteRubrique, isDemo, productsForRubrique, reorderRubriques, saveRubrique, type Rubrique } from '../../lib/content'
import { PRODUCTS } from '../../data/products'
import SmartImage from '../../components/SmartImage'
import { useConfirm } from '../../components/admin/ui'

export default function AdminRubriques() {
  const { t } = useTranslation()
  const r = t.admin.rubriques
  const { content, reload } = useContent()
  const { ask, dialog } = useConfirm()
  const [error, setError] = useState<string | null>(null)
  const list = content.rubriques

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try { await action(); await reload() }
    catch (e) { setError(e instanceof Error ? e.message : 'Action impossible') }
  }

  const move = (index: number, dir: -1 | 1) => {
    const ids = list.map(x => x.id)
    const target = index + dir
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    run(() => reorderRubriques(ids))
  }

  const remove = async (item: Rubrique) => {
    if (await ask(r.confirmDelete.replace('{name}', item.name), r.remove)) run(() => deleteRubrique(item.id))
  }

  const ruleLabel = (item: Rubrique) =>
    item.ruleType === 'brand' ? `${r.rules.brand} · ${item.ruleValue}`
    : item.ruleType === 'category' ? `${r.rules.category} · ${item.ruleValue}`
    : r.rules[item.ruleType]

  return (
    <div>
      <div className="admin-head">
        <div>
          <p className="eyebrow">{r.eyebrow}</p>
          <h1>{r.title}</h1>
          <p className="admin-intro">{r.intro}</p>
        </div>
        <Link to="/admin/rubriques/nouvelle" className="btn btn--solid"><Plus size={16} strokeWidth={1.6} /> {r.add}</Link>
      </div>

      {isDemo && <p className="a-note">{t.admin.media.demoNote}</p>}
      {error && <p className="a-error" role="alert">{error}</p>}

      {list.length === 0 ? (
        <div className="admin-card" style={{padding:'4rem 1.5rem', textAlign:'center', color:'var(--ink-soft)'}}>{r.empty}</div>
      ) : (
        <ol className="admin-card rub-list">
          {list.map((item, i) => {
            const count = productsForRubrique(item, PRODUCTS).length
            return (
              <li key={item.id} className={`rub-row ${item.isVisible ? '' : 'is-hidden'}`}>
                <div className="rub-row__order">
                  <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={r.moveUp} title={r.moveUp}><ArrowUp size={15} strokeWidth={1.6} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={r.moveDown} title={r.moveDown}><ArrowDown size={15} strokeWidth={1.6} /></button>
                </div>
                <Link to={`/admin/rubriques/${item.id}`} className="rub-row__thumb media">
                  <SmartImage src={item.coverUrl ?? undefined} alt="" />
                </Link>
                <Link to={`/admin/rubriques/${item.id}`} className="rub-row__main">
                  <span className="rub-row__name">{item.name}</span>
                  <span className="rub-row__meta">{ruleLabel(item)} · {count} {count > 1 ? r.products : r.product}</span>
                  <span className="rub-row__tags">
                    {!item.isVisible && <span className="badge" style={{background:'rgba(166,65,44,0.1)', color:'#A6412C'}}>{r.hidden}</span>}
                    {item.isVisible && item.inMenu && <span className="badge" style={{background:'rgba(138,90,48,0.12)', color:'#8A5A30'}}>{r.inMenu}</span>}
                    {item.isVisible && item.onHome && <span className="badge" style={{background:'rgba(78,122,67,0.12)', color:'#4E7A43'}}>{r.onHome}</span>}
                  </span>
                </Link>
                <div className="rub-row__actions">
                  <button onClick={() => run(() => saveRubrique({ ...item, isVisible: !item.isVisible }))}
                    aria-label={item.isVisible ? r.hide : r.show} title={item.isVisible ? r.hide : r.show}>
                    {item.isVisible ? <Eye size={17} strokeWidth={1.5} /> : <EyeOff size={17} strokeWidth={1.5} />}
                  </button>
                  {item.isVisible && (
                    <a href={`/rubrique/${item.slug}`} target="_blank" rel="noreferrer" aria-label={r.view} title={r.view}><ExternalLink size={16} strokeWidth={1.5} /></a>
                  )}
                  <Link to={`/admin/rubriques/${item.id}`} aria-label={r.edit} title={r.edit}><Pencil size={16} strokeWidth={1.5} /></Link>
                  <button onClick={() => remove(item)} aria-label={r.remove} title={r.remove} className="is-danger"><Trash2 size={16} strokeWidth={1.5} /></button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <p className="a-hint" style={{marginTop:'1rem'}}>{r.homeLimit}</p>
      {dialog}
    </div>
  )
}
