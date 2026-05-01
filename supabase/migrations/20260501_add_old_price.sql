-- Migration: Add old_price column for promotional pricing (Omnibus directive)
-- When old_price is set (NOT NULL), the product is on sale:
--   price = current (lower) price
--   old_price = original price before the promotion
-- The storefront shows: "Najniższa cena z ostatnich 30 dni: {price} zł"

ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price NUMERIC(10,2) DEFAULT NULL;

-- To put a product on sale, set old_price to the original price and update price to the sale price:
-- UPDATE products SET old_price = price, price = 19.99 WHERE id = '...';
-- To end a sale:
-- UPDATE products SET price = old_price, old_price = NULL WHERE id = '...';
