import type { OrderStatusValue } from '@/lib/order-status'

// Typy bazy danych Złote Miody

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  address: string
  city: string
  postal_code: string
  /** W bazie często: `User` / `Admin` (initcap); w kodzie używaj `isAdminRole()`. */
  role: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  /** When set, the product is on sale — `price` is the current (lower) price, `old_price` is the original. */
  old_price: number | null
  image_url: string
  stock: number
  category: string
  featured: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string
  total_amount: number
  status: OrderStatusValue
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  stripe_session_id: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[]
}

export interface CartItem {
  product: Product
  quantity: number
}
