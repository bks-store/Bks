import { supabase, isConfigured } from './supabase'
import type { CartItem } from '../context/CartContext'

export interface CustomerInfo {
  name: string
  email: string
  phone?: string
}

export interface CheckoutResult {
  url: string
  orderId: string
}

export async function createCheckoutSession(
  items: CartItem[],
  total: number,
  customer: CustomerInfo,
): Promise<CheckoutResult> {
  if (!isConfigured) {
    throw new Error('Supabase non configuré — paiement indisponible en mode démo.')
  }

  const { data, error } = await supabase.functions.invoke('create_payment', {
    body: {
      items,
      total,
      customer,
      origin: window.location.origin,
    },
  })

  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data as CheckoutResult
}
