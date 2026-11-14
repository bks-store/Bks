import { Truck, ShieldCheck, Clock } from 'lucide-react'

const ITEMS = [
  { icon: <Truck size={13} strokeWidth={1.8} />, text: 'Livraison DHL dès 5,90 €' },
  { icon: <ShieldCheck size={13} strokeWidth={1.8} />, text: 'Paiement 100% sécurisé' },
  { icon: <Clock size={13} strokeWidth={1.8} />, text: 'Expédition sous 24–48h' },
]

export default function AnnouncementBar() {
  return (
    <div style={{
      background: 'var(--bks-brun-profond)',
      color: 'var(--bks-creme)',
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      padding: '0.55rem 1rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '2.5rem',
      flexWrap: 'wrap',
    }}>
      {ITEMS.map(({ icon, text }) => (
        <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.92 }}>
          {icon}
          {text}
        </span>
      ))}
    </div>
  )
}
