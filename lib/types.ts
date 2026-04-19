// Typy bazy danych Złote Miody

import type { OrderStatusValue } from '@/lib/order-status'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  address: string
  city: string
  postal_code: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
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
