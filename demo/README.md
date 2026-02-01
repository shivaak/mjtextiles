# MJ Textiles - Stock & Billing Management System

A production-quality demo UI for a textile shop billing and stock management system built with React + TypeScript + Vite.

![MJ Textiles](https://img.shields.io/badge/MJ%20Textiles-Demo-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)
![MUI](https://img.shields.io/badge/MUI-7-0081cb)

## 📖 User Guide (For Shop Admins)

**New to the app?** See the [USER_GUIDE.md](./USER_GUIDE.md) for a simple, step-by-step guide on how to use the application. Written in plain language - no technical knowledge required!

---

## Features

- **Point of Sale (POS)**: Full-featured billing interface with barcode scanning, cart management, and invoice generation
- **Product Management**: Products with multiple variants (size, color), SKU/barcode tracking
- **Inventory Management**: Stock tracking, adjustments, movement history
- **Purchase Management**: Record purchases from suppliers with automatic stock and cost updates
- **Sales History**: View, filter, and void sales with full audit trail
- **Reports & Analytics**: Sales trends, product performance, profit analysis, inventory valuation
- **User Management**: Role-based access control (Admin/Employee)
- **Dark Mode**: Toggle between light and dark themes

## Demo Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Admin | `admin` | `admin123` | Full access to all features |
| Cashier | `cashier` | `cashier123` | Billing, Products (view), Sales (view) |
| Employee | `priya` | `priya123` | Same as Cashier |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **UI Library**: Material UI (MUI) v7
- **Charts**: Recharts
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Data Grid**: MUI X DataGrid
- **Date Handling**: Day.js
- **Notifications**: Notistack
- **Storage**: localStorage (with repository pattern for easy backend swap)

## Project Structure

```
src/
├── app/                    # App-level setup
│   ├── context/           # React contexts (Auth, Theme, Notifications)
│   ├── layout/            # App shell, sidebar
│   └── routes/            # Route configuration
├── components/            # Reusable components
│   └── common/            # PageHeader, StatCard, DateRangePicker, etc.
├── data/                  # Data layer
│   ├── repositories/      # CRUD operations per entity
│   ├── seed.ts           # Demo data generation
│   └── storage.ts        # localStorage wrapper
├── domain/               # Business logic
│   ├── types.ts          # TypeScript interfaces
│   └── calculations.ts   # Business calculations
├── pages/                # Page components
│   ├── auth/             # Login
│   ├── billing/          # POS
│   ├── dashboard/        # Dashboard
│   ├── inventory/        # Stock management
│   ├── products/         # Product/Variant management
│   ├── purchases/        # Purchase records
│   ├── reports/          # Analytics
│   ├── sales/            # Sales history
│   ├── settings/         # Shop configuration
│   └── users/            # User management
└── utils/                # Utility functions
```

## Key Features in Detail

### POS / Billing
- Barcode input with auto-focus (press Enter to add item)
- Product search by name, SKU, or barcode
- Cart with quantity adjustment (+/- buttons and direct input)
- Discount (percentage or fixed amount)
- Multiple payment modes (Cash, Card, UPI, Credit)
- Invoice generation with print support

### Inventory
- Real-time stock tracking
- Low stock alerts
- Stock adjustments with reason tracking
- Movement history (purchases, sales, adjustments)
- Stock valuation by category

### Reports (Admin Only)
- Sales summary with charts
- Product performance analysis
- Profit breakdown by category/cashier
- Inventory valuation
- Low stock report with reorder suggestions
- CSV export for all reports

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Add item (POS) | Enter in barcode field |
| Focus barcode | Auto-focused on POS page |

## Data Persistence

All data is stored in browser localStorage. The app seeds realistic demo data on first load including:

- 30+ products with 80+ variants
- 60 days of purchase history
- 60 days of sales history
- Multiple suppliers and users

Use **Settings > Reset Demo Data** to clear and regenerate all data.

## Preparing for Backend Integration

The app uses a repository pattern that makes it easy to swap localStorage for API calls:

```typescript
// Current: localStorage
export function getAllProducts(): Product[] {
  return getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS) || [];
}

// Future: API call
export async function getAllProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');
  return response.json();
}
```

## License

MIT

---

Built with ❤️ for MJ Textiles
