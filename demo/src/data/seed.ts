// Seed data generator for MJ Textiles demo
// Creates realistic demo data for a textile shop

import { v4 as uuidv4 } from 'uuid';
import type {
  User, Product, Variant, Supplier, Purchase, PurchaseItem,
  Sale, SaleItem, Settings, PaymentMode
} from '../domain/types';
import { setStorageItem, STORAGE_KEYS, setStorageVersion } from './storage';
import { generateBillNumber } from '../domain/calculations';

// Helper to generate random date within range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to pick random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to generate random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Users
const seedUsers: User[] = [
  {
    id: uuidv4(),
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
    fullName: 'Mahesh Joshi',
    isActive: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    username: 'cashier',
    password: 'cashier123',
    role: 'EMPLOYEE',
    fullName: 'Rajesh Kumar',
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: uuidv4(),
    username: 'priya',
    password: 'priya123',
    role: 'EMPLOYEE',
    fullName: 'Priya Sharma',
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Suppliers
const seedSuppliers: Supplier[] = [
  { id: uuidv4(), name: 'Bombay Textiles Co.', phone: '9876543210', email: 'sales@bombaytextiles.com', address: 'Mumbai', createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuidv4(), name: 'Gujarat Fabrics Ltd.', phone: '9876543211', email: 'info@gujaratfabrics.com', address: 'Surat', createdAt: new Date(Date.now() - 280 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuidv4(), name: 'Delhi Cloth House', phone: '9876543212', email: 'delhi@clothhouse.com', address: 'Delhi', createdAt: new Date(Date.now() - 260 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuidv4(), name: 'Southern Silks', phone: '9876543213', email: 'silk@southernsilks.com', address: 'Chennai', createdAt: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString() },
  { id: uuidv4(), name: 'Rajasthan Prints', phone: '9876543214', email: 'prints@rajasthan.com', address: 'Jaipur', createdAt: new Date(Date.now() - 220 * 24 * 60 * 60 * 1000).toISOString() },
];

// Product definitions with variants
const productDefinitions = [
  // Men's Shirts
  { name: 'Classic Cotton Shirt', brand: 'Raymond', category: 'Men\'s Shirts', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['White', 'Blue', 'Black', 'Grey'], basePrice: 1299, baseCost: 750 },
  { name: 'Formal Linen Shirt', brand: 'Van Heusen', category: 'Men\'s Shirts', sizes: ['M', 'L', 'XL'], colors: ['White', 'Beige', 'Light Blue'], basePrice: 1899, baseCost: 1100 },
  { name: 'Casual Check Shirt', brand: 'Allen Solly', category: 'Men\'s Shirts', sizes: ['S', 'M', 'L', 'XL'], colors: ['Red Check', 'Blue Check', 'Green Check'], basePrice: 1499, baseCost: 850 },
  { name: 'Premium Oxford Shirt', brand: 'Arrow', category: 'Men\'s Shirts', sizes: ['M', 'L', 'XL', 'XXL'], colors: ['White', 'Pink', 'Sky Blue'], basePrice: 2199, baseCost: 1300 },
  
  // Men's Trousers
  { name: 'Formal Wool Trousers', brand: 'Raymond', category: 'Men\'s Trousers', sizes: ['30', '32', '34', '36', '38'], colors: ['Black', 'Navy', 'Grey'], basePrice: 2499, baseCost: 1450 },
  { name: 'Cotton Chinos', brand: 'Van Heusen', category: 'Men\'s Trousers', sizes: ['30', '32', '34', '36'], colors: ['Beige', 'Navy', 'Olive'], basePrice: 1799, baseCost: 1000 },
  { name: 'Slim Fit Trousers', brand: 'Arrow', category: 'Men\'s Trousers', sizes: ['28', '30', '32', '34'], colors: ['Black', 'Charcoal'], basePrice: 2199, baseCost: 1250 },
  
  // Sarees
  { name: 'Banarasi Silk Saree', brand: 'Kanchipuram', category: 'Sarees', sizes: ['Free'], colors: ['Red', 'Green', 'Purple', 'Gold'], basePrice: 8999, baseCost: 5500 },
  { name: 'Cotton Handloom Saree', brand: 'Fabindia', category: 'Sarees', sizes: ['Free'], colors: ['Blue', 'Yellow', 'Orange', 'Pink'], basePrice: 2499, baseCost: 1400 },
  { name: 'Georgette Party Saree', brand: 'Nalli', category: 'Sarees', sizes: ['Free'], colors: ['Black', 'Red', 'Navy'], basePrice: 4999, baseCost: 2800 },
  { name: 'Chiffon Printed Saree', brand: 'Soch', category: 'Sarees', sizes: ['Free'], colors: ['Floral Pink', 'Abstract Blue', 'Paisley Green'], basePrice: 1999, baseCost: 1100 },
  
  // Kurtis
  { name: 'Cotton Straight Kurti', brand: 'Biba', category: 'Kurtis', sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Blue', 'Pink', 'Yellow'], basePrice: 899, baseCost: 500 },
  { name: 'Embroidered A-Line Kurti', brand: 'W', category: 'Kurtis', sizes: ['S', 'M', 'L', 'XL', 'XXL'], colors: ['Red', 'Maroon', 'Teal'], basePrice: 1499, baseCost: 850 },
  { name: 'Silk Festive Kurti', brand: 'Aurelia', category: 'Kurtis', sizes: ['M', 'L', 'XL'], colors: ['Gold', 'Navy', 'Wine'], basePrice: 2299, baseCost: 1300 },
  
  // Dress Materials
  { name: 'Cotton Printed Suit', brand: 'Fabindia', category: 'Dress Materials', sizes: ['Free'], colors: ['Blue Print', 'Red Print', 'Green Print'], basePrice: 1299, baseCost: 700 },
  { name: 'Embroidered Salwar Set', brand: 'Biba', category: 'Dress Materials', sizes: ['Free'], colors: ['White', 'Pink', 'Yellow'], basePrice: 1999, baseCost: 1100 },
  { name: 'Silk Unstitched Suit', brand: 'Nalli', category: 'Dress Materials', sizes: ['Free'], colors: ['Beige', 'Peach', 'Mint'], basePrice: 3499, baseCost: 2000 },
  
  // Fabrics (per meter)
  { name: 'Pure Cotton Fabric', brand: 'MJ Premium', category: 'Fabrics', sizes: ['Per Meter'], colors: ['White', 'Black', 'Navy', 'Grey', 'Beige'], basePrice: 299, baseCost: 150 },
  { name: 'Linen Blend Fabric', brand: 'MJ Premium', category: 'Fabrics', sizes: ['Per Meter'], colors: ['Natural', 'Blue', 'Olive'], basePrice: 499, baseCost: 280 },
  { name: 'Silk Fabric', brand: 'MJ Premium', category: 'Fabrics', sizes: ['Per Meter'], colors: ['Red', 'Blue', 'Green', 'Gold'], basePrice: 899, baseCost: 520 },
  { name: 'Polyester Blend', brand: 'MJ Value', category: 'Fabrics', sizes: ['Per Meter'], colors: ['Black', 'White', 'Grey', 'Navy'], basePrice: 199, baseCost: 100 },
  
  // Bedsheets
  { name: 'Cotton Bedsheet Set', brand: 'Bombay Dyeing', category: 'Bedsheets', sizes: ['Single', 'Double', 'King'], colors: ['White', 'Blue', 'Floral'], basePrice: 1499, baseCost: 850 },
  { name: 'Premium Satin Bedsheet', brand: 'Welspun', category: 'Bedsheets', sizes: ['Double', 'King'], colors: ['Ivory', 'Grey', 'Navy'], basePrice: 2499, baseCost: 1400 },
  
  // Towels
  { name: 'Bath Towel Set', brand: 'Bombay Dyeing', category: 'Towels', sizes: ['Standard'], colors: ['White', 'Blue', 'Green', 'Pink'], basePrice: 799, baseCost: 450 },
  { name: 'Premium Hand Towel', brand: 'Welspun', category: 'Towels', sizes: ['Standard'], colors: ['White', 'Grey', 'Beige'], basePrice: 399, baseCost: 220 },
  
  // Kids
  { name: 'Kids Cotton T-Shirt', brand: 'Little Stars', category: 'Kids Wear', sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], colors: ['Red', 'Blue', 'Yellow', 'Green'], basePrice: 499, baseCost: 280 },
  { name: 'Kids Party Dress', brand: 'Little Stars', category: 'Kids Wear', sizes: ['2-3Y', '4-5Y', '6-7Y'], colors: ['Pink', 'Purple', 'White'], basePrice: 1299, baseCost: 720 },
  
  // Accessories
  { name: 'Silk Tie', brand: 'Raymond', category: 'Accessories', sizes: ['Standard'], colors: ['Navy', 'Maroon', 'Black', 'Blue Stripe'], basePrice: 699, baseCost: 380 },
  { name: 'Cotton Handkerchief Set', brand: 'MJ Value', category: 'Accessories', sizes: ['Pack of 6'], colors: ['White', 'Assorted'], basePrice: 299, baseCost: 150 },
  { name: 'Woolen Shawl', brand: 'Kashmiri House', category: 'Accessories', sizes: ['Standard'], colors: ['Red', 'Blue', 'Natural', 'Black'], basePrice: 2999, baseCost: 1700 },
];

// Settings
const seedSettings: Settings = {
  shopName: 'MJ Textiles',
  address: '123 Main Street, City Center, Mumbai 400001',
  phone: '+91 98765 43210',
  email: 'contact@mjtextiles.com',
  currency: 'INR',
  currencySymbol: '₹',
  taxPercent: 5,
  invoicePrefix: 'MJT',
  lowStockThreshold: 10,
  lastBillNumber: 0,
};

export function seedDemoData(): void {
  console.log('Seeding demo data...');

  // Store users
  setStorageItem(STORAGE_KEYS.USERS, seedUsers);

  // Store suppliers
  setStorageItem(STORAGE_KEYS.SUPPLIERS, seedSuppliers);

  // Generate products and variants
  const products: Product[] = [];
  const variants: Variant[] = [];
  let barcodeCounter = 100000000001;

  for (const def of productDefinitions) {
    const productId = uuidv4();
    const createdAt = new Date(Date.now() - randomInt(100, 300) * 24 * 60 * 60 * 1000).toISOString();
    
    products.push({
      id: productId,
      name: def.name,
      brand: def.brand,
      category: def.category,
      createdAt,
      updatedAt: createdAt,
    });

    // Generate variants for each size/color combination
    for (const size of def.sizes) {
      for (const color of def.colors) {
        const priceVariation = randomInt(-50, 100);
        const costVariation = randomInt(-30, 50);
        
        variants.push({
          id: uuidv4(),
          productId,
          sku: `${def.brand.substring(0, 3).toUpperCase()}-${products.length.toString().padStart(3, '0')}-${size}-${color.substring(0, 2).toUpperCase()}`,
          barcode: (barcodeCounter++).toString(),
          size,
          color,
          sellingPrice: def.basePrice + priceVariation,
          avgCost: def.baseCost + costVariation,
          stockQty: randomInt(0, 50),
          status: Math.random() > 0.05 ? 'ACTIVE' : 'INACTIVE',
          createdAt,
          updatedAt: createdAt,
        });
      }
    }
  }

  // Create some low stock items
  for (let i = 0; i < 15; i++) {
    const randomVariant = variants[randomInt(0, variants.length - 1)];
    randomVariant.stockQty = randomInt(0, 8);
  }

  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  setStorageItem(STORAGE_KEYS.VARIANTS, variants);

  // Generate purchases (last 60 days)
  const purchases: Purchase[] = [];
  const purchaseItems: PurchaseItem[] = [];
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 45; i++) {
    const purchaseId = uuidv4();
    const purchaseDate = randomDate(sixtyDaysAgo, now);
    const supplier = randomItem(seedSuppliers);
    const numItems = randomInt(2, 8);
    let totalCost = 0;

    // Select random variants for this purchase
    const selectedVariants = [...variants]
      .sort(() => Math.random() - 0.5)
      .slice(0, numItems);

    for (const variant of selectedVariants) {
      const qty = randomInt(5, 30);
      const unitCost = variant.avgCost * (0.9 + Math.random() * 0.2); // 90-110% of avg cost
      totalCost += qty * unitCost;

      purchaseItems.push({
        id: uuidv4(),
        purchaseId,
        variantId: variant.id,
        qty,
        unitCost: Math.round(unitCost * 100) / 100,
      });
    }

    purchases.push({
      id: purchaseId,
      supplierId: supplier.id,
      purchasedAt: purchaseDate.toISOString(),
      invoiceNo: `PO-${(1000 + i).toString()}`,
      totalCost: Math.round(totalCost * 100) / 100,
      createdBy: seedUsers[0].id,
      createdAt: purchaseDate.toISOString(),
    });
  }

  setStorageItem(STORAGE_KEYS.PURCHASES, purchases);
  setStorageItem(STORAGE_KEYS.PURCHASE_ITEMS, purchaseItems);

  // Generate sales (last 60 days)
  const sales: Sale[] = [];
  const saleItems: SaleItem[] = [];
  const paymentModes: PaymentMode[] = ['CASH', 'CARD', 'UPI', 'CREDIT'];
  const cashiers = [seedUsers[1].id, seedUsers[2].id];
  const customerNames = ['Ramesh Patel', 'Sunita Sharma', 'Amit Kumar', 'Priya Desai', 'Vikram Singh', 'Neha Gupta', 'Sanjay Mehta', 'Anjali Rao', ''];
  
  let billNumber = 1;

  // Generate more sales for recent days to show trend
  for (let day = 60; day >= 0; day--) {
    const saleDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
    const numSalesForDay = day < 7 ? randomInt(5, 12) : randomInt(2, 8);

    for (let s = 0; s < numSalesForDay; s++) {
      const saleId = uuidv4();
      const numItems = randomInt(1, 5);
      let subtotal = 0;

      // Set time of day
      saleDate.setHours(randomInt(10, 20), randomInt(0, 59), randomInt(0, 59));

      // Select random active variants for this sale
      const activeVariants = variants.filter(v => v.status === 'ACTIVE' && v.stockQty > 0);
      const selectedVariants = [...activeVariants]
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);

      for (const variant of selectedVariants) {
        const qty = randomInt(1, 3);
        const unitPrice = variant.sellingPrice;
        subtotal += qty * unitPrice;

        saleItems.push({
          id: uuidv4(),
          saleId,
          variantId: variant.id,
          qty,
          unitPrice,
          unitCostAtSale: variant.avgCost,
        });
      }

      const discountPercent = Math.random() > 0.7 ? randomInt(5, 15) : 0;
      const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
      const afterDiscount = subtotal - discountAmount;
      const taxPercent = 5;
      const taxAmount = Math.round((afterDiscount * taxPercent) / 100 * 100) / 100;
      const total = Math.round((afterDiscount + taxAmount) * 100) / 100;

      const isVoided = Math.random() > 0.97; // 3% voided

      sales.push({
        id: saleId,
        billNo: generateBillNumber('MJT', billNumber++),
        soldAt: saleDate.toISOString(),
        customerName: randomItem(customerNames) || undefined,
        customerPhone: Math.random() > 0.5 ? `98${randomInt(10000000, 99999999)}` : undefined,
        paymentMode: randomItem(paymentModes),
        subtotal,
        discountAmount,
        discountPercent,
        taxAmount,
        taxPercent,
        total,
        status: isVoided ? 'VOIDED' : 'COMPLETED',
        createdBy: randomItem(cashiers),
        createdAt: saleDate.toISOString(),
        voidedAt: isVoided ? new Date(saleDate.getTime() + 60000).toISOString() : undefined,
        voidedBy: isVoided ? seedUsers[0].id : undefined,
        voidReason: isVoided ? 'Customer returned items' : undefined,
      });
    }
  }

  setStorageItem(STORAGE_KEYS.SALES, sales);
  setStorageItem(STORAGE_KEYS.SALE_ITEMS, saleItems);

  // Update settings with last bill number
  const finalSettings = { ...seedSettings, lastBillNumber: billNumber };
  setStorageItem(STORAGE_KEYS.SETTINGS, finalSettings);

  // Initialize stock adjustments (empty for now)
  setStorageItem(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);

  // Set version
  setStorageVersion();

  console.log('Demo data seeded successfully!');
  console.log(`- ${products.length} products`);
  console.log(`- ${variants.length} variants`);
  console.log(`- ${purchases.length} purchases`);
  console.log(`- ${sales.length} sales`);
}

export function resetAndReseed(): void {
  // Clear all storage
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  localStorage.removeItem('mj_textiles_version');
  
  // Reseed
  seedDemoData();
}
