export type StockType = 'boutique' | 'dropshipping' | 'check'
export type SyncStatus = 'manual' | 'synced' | 'error' | 'pending'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
export type ProductCategory = 'sneakers' | 'streetwear' | 'accessoires'

export type DbProduct = {
  id: string
  slug: string | null
  created_at: string
  updated_at: string
  name: string
  brand: string
  sku: string | null
  supplier_id: string | null
  category: ProductCategory
  subcategory: string | null
  tags: string[]
  price_sale: number
  price_buy: number | null
  price_original: number | null
  description: string | null
  images: string[]
  stock_type: StockType
  is_published: boolean
  is_featured: boolean
  is_new: boolean
  last_sync_at: string | null
  sync_status: SyncStatus
}

export type DbProductSize = {
  id: string
  product_id: string
  size: string
  stock_qty: number
  available: boolean
}

export type DbOrder = {
  id: string
  created_at: string
  updated_at: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  shipping_address: ShippingAddress | null
  stripe_session_id: string | null
  stripe_payment_id: string | null
  payment_status: PaymentStatus
  payment_amount: number | null
  status: OrderStatus
  shipping_method: string | null
  tracking_number: string | null
  shipping_cost: number
  notes: string | null
}

export type DbOrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_brand: string
  size: string
  quantity: number
  unit_price: number
  stock_type: StockType
  supplier_order_id: string | null
  supplier_order_status: string | null
}

export type ShippingAddress = {
  line1: string
  line2?: string
  city: string
  zip: string
  country: string
}

export interface ProductWithSizes extends DbProduct {
  product_sizes: DbProductSize[]
}

export interface OrderWithItems extends DbOrder {
  order_items: DbOrderItem[]
}

export type RubriqueRule = 'brand' | 'category' | 'new' | 'manual'

export type DbRubrique = {
  id: string
  created_at: string
  updated_at: string
  slug: string
  name: string
  description: string | null
  cover_url: string | null
  rule_type: RubriqueRule
  rule_value: string | null
  product_ids: string[]
  position: number
  is_visible: boolean
  in_menu: boolean
  on_home: boolean
}

export type DbSiteMedia = {
  key: string
  url: string
  updated_at: string
}

export type DbStorePhoto = {
  id: string
  created_at: string
  url: string
  caption: string | null
  position: number
}

export interface Database {
  public: {
    Tables: {
      products: { Row: DbProduct; Insert: Partial<DbProduct>; Update: Partial<DbProduct>; Relationships: [] }
      product_sizes: { Row: DbProductSize; Insert: Partial<DbProductSize>; Update: Partial<DbProductSize>; Relationships: [] }
      orders: { Row: DbOrder; Insert: Partial<DbOrder>; Update: Partial<DbOrder>; Relationships: [] }
      order_items: { Row: DbOrderItem; Insert: Partial<DbOrderItem>; Update: Partial<DbOrderItem>; Relationships: [] }
      rubriques: { Row: DbRubrique; Insert: Partial<DbRubrique>; Update: Partial<DbRubrique>; Relationships: [] }
      site_media: { Row: DbSiteMedia; Insert: Partial<DbSiteMedia>; Update: Partial<DbSiteMedia>; Relationships: [] }
      store_photos: { Row: DbStorePhoto; Insert: Partial<DbStorePhoto>; Update: Partial<DbStorePhoto>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
