export default function ProductCardSkeleton() {
  return (
    <div className="pcard" style={{ pointerEvents: 'none' }}>
      <div className="pcard__media skeleton" style={{ aspectRatio: '3/4' }} />
      <div className="pcard__info" style={{ display: 'grid', gap: '0.5rem', paddingTop: '0.75rem' }}>
        <div className="skeleton" style={{ height: '0.75rem', width: '40%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: '1rem', width: '80%', borderRadius: 4 }} />
        <div className="skeleton" style={{ height: '0.875rem', width: '30%', borderRadius: 4 }} />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </>
  )
}
