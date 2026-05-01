import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/** GET /api/product-images — returns list of image files in public/products/ */
export async function GET() {
  try {
    const productsDir = path.join(process.cwd(), 'public', 'products')
    
    if (!fs.existsSync(productsDir)) {
      return NextResponse.json({ images: [] })
    }

    const files = fs.readdirSync(productsDir)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']
    
    const images = files
      .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
      .map(f => ({
        filename: f,
        url: `/products/${f}`,
      }))
      .sort((a, b) => a.filename.localeCompare(b.filename))

    return NextResponse.json({ images })
  } catch (err) {
    console.error('Error reading product images:', err)
    return NextResponse.json({ images: [] })
  }
}
