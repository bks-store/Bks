import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { IMAGES } from '../../config/images'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAdmin()

  if (loading) {
    return (
      <div className="admin" style={{alignItems:'center', justifyContent:'center', background:'var(--bks-brun)'}}>
        <img src={IMAGES.logo.onDark} alt="BKS" style={{height:56, opacity:0.9}} className="animate-pulse" />
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/admin/login" replace />
}
