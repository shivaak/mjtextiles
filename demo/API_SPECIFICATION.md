# MJ Textiles - REST API Specification

This document contains the complete REST API specification for the MJ Textiles Billing & Stock Management System.

## Base URL
```
http://localhost:8080/api/v1
```

## Authentication
All endpoints (except `/auth/login`) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## ID Format
All entity IDs are **auto-increment integers (BIGINT)** for better performance and easier debugging.

Example: `"id": 12345` (not UUID)

## Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "timestamp": "2026-02-01T10:30:00Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "timestamp": "2026-02-01T10:30:00Z"
}
```

## Common HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Duplicate entry |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

---

# 1. Authentication APIs

## 1.1 Login
Authenticate user and get JWT token.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "Mahesh Joshi",
      "role": "ADMIN"
    }
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password"
  }
}
```

---

## 1.2 Get Current User
Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "fullName": "Mahesh Joshi",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

## 1.3 Logout
Invalidate current token.

**Endpoint:** `POST /auth/logout`

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 1.4 Change Password
Change current user's password.

**Endpoint:** `PUT /auth/change-password`

**Request Body:**
```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

# 2. Settings APIs

## 2.1 Get Settings
Get shop settings.

**Endpoint:** `GET /settings`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shopName": "MJ Textiles",
    "address": "123 Main Street, City",
    "phone": "9876543210",
    "email": "info@mjtextiles.com",
    "gstNumber": "GST123456789",
    "currency": "₹",
    "taxPercent": 5,
    "invoicePrefix": "MJT",
    "lowStockThreshold": 10,
    "lastBillNumber": 45
  }
}
```

---

## 2.2 Update Settings
Update shop settings. **Admin only.**

**Endpoint:** `PUT /settings`

**Request Body:**
```json
{
  "shopName": "MJ Textiles",
  "address": "123 Main Street, City",
  "phone": "9876543210",
  "email": "info@mjtextiles.com",
  "gstNumber": "GST123456789",
  "taxPercent": 5,
  "invoicePrefix": "MJT",
  "lowStockThreshold": 10
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Settings updated successfully"
}
```

---

# 3. User Management APIs (Admin Only)

## 3.1 List Users
Get all users with optional filters.

**Endpoint:** `GET /users`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | Filter by role: ADMIN, EMPLOYEE |
| isActive | boolean | Filter by active status |
| search | string | Search by username or full name |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "fullName": "Mahesh Joshi",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## 3.2 Get User by ID
**Endpoint:** `GET /users/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "fullName": "Mahesh Joshi",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

## 3.3 Create User
**Endpoint:** `POST /users`

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "fullName": "New User",
  "role": "EMPLOYEE"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "newuser",
    "fullName": "New User",
    "role": "EMPLOYEE",
    "isActive": true,
    "createdAt": "2026-02-01T10:30:00Z"
  },
  "message": "User created successfully"
}
```

**Error (409):**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_USERNAME",
    "message": "Username already exists"
  }
}
```

---

## 3.4 Update User
**Endpoint:** `PUT /users/{id}`

**Request Body:**
```json
{
  "fullName": "Updated Name",
  "role": "ADMIN",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "User updated successfully"
}
```

---

## 3.5 Reset User Password
**Endpoint:** `PUT /users/{id}/reset-password`

**Request Body:**
```json
{
  "newPassword": "newPassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 3.6 Toggle User Status
Activate or deactivate a user.

**Endpoint:** `PUT /users/{id}/status`

**Request Body:**
```json
{
  "isActive": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

# 4. Product APIs

## 4.1 List Products
Get all products with optional filters.

**Endpoint:** `GET /products`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| brand | string | Filter by brand |
| search | string | Search by name, brand, or category |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cotton Shirt",
      "brand": "Raymond",
      "category": "Shirts",
      "description": "Premium cotton shirt",
      "variantCount": 5,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-15T00:00:00Z"
    }
  ]
}
```

---

## 4.2 Get Product by ID
Get product with all its variants.

**Endpoint:** `GET /products/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Cotton Shirt",
    "brand": "Raymond",
    "category": "Shirts",
    "description": "Premium cotton shirt",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-15T00:00:00Z",
    "variants": [
      {
        "id": 1,
        "sku": "RAY-CTSH-M-WHT",
        "barcode": "8901234567890",
        "size": "M",
        "color": "White",
        "sellingPrice": 1200,
        "avgCost": 800,
        "stockQty": 25,
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

## 4.3 Create Product
**Endpoint:** `POST /products`

**Request Body:**
```json
{
  "name": "Cotton Shirt",
  "brand": "Raymond",
  "category": "Shirts",
  "description": "Premium cotton shirt"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Cotton Shirt",
    "brand": "Raymond",
    "category": "Shirts",
    "description": "Premium cotton shirt",
    "createdAt": "2026-02-01T10:30:00Z",
    "updatedAt": "2026-02-01T10:30:00Z"
  },
  "message": "Product created successfully"
}
```

---

## 4.4 Update Product
**Endpoint:** `PUT /products/{id}`

**Request Body:**
```json
{
  "name": "Cotton Shirt Premium",
  "brand": "Raymond",
  "category": "Shirts",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Product updated successfully"
}
```

---

## 4.5 Get Categories
Get all unique product categories.

**Endpoint:** `GET /products/categories`

**Response (200):**
```json
{
  "success": true,
  "data": ["Shirts", "Trousers", "Sarees", "Fabrics", "Accessories"]
}
```

---

## 4.6 Get Brands
Get all unique product brands.

**Endpoint:** `GET /products/brands`

**Response (200):**
```json
{
  "success": true,
  "data": ["Raymond", "Peter England", "Van Heusen", "Allen Solly"]
}
```

---

# 5. Variant APIs

## 5.1 List Variants
Get all variants with product info and optional filters.

**Endpoint:** `GET /variants`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| productId | string | Filter by product |
| category | string | Filter by product category |
| brand | string | Filter by product brand |
| status | string | Filter by status: ACTIVE, INACTIVE |
| lowStock | boolean | If true, only show items with stock <= threshold |
| outOfStock | boolean | If true, only show items with stock = 0 |
| search | string | Search by SKU, barcode, or product name |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productId": 1,
      "productName": "Cotton Shirt",
      "productBrand": "Raymond",
      "productCategory": "Shirts",
      "sku": "RAY-CTSH-M-WHT",
      "barcode": "8901234567890",
      "size": "M",
      "color": "White",
      "sellingPrice": 1200,
      "avgCost": 800,
      "stockQty": 25,
      "status": "ACTIVE",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## 5.2 Get Variant by ID
**Endpoint:** `GET /variants/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productId": 1,
    "productName": "Cotton Shirt",
    "productBrand": "Raymond",
    "productCategory": "Shirts",
    "sku": "RAY-CTSH-M-WHT",
    "barcode": "8901234567890",
    "size": "M",
    "color": "White",
    "sellingPrice": 1200,
    "avgCost": 800,
    "stockQty": 25,
    "status": "ACTIVE",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

## 5.3 Get Variant by Barcode
Search variant by barcode (used in POS).

**Endpoint:** `GET /variants/barcode/{barcode}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "productName": "Cotton Shirt",
    "sku": "RAY-CTSH-M-WHT",
    "barcode": "8901234567890",
    "size": "M",
    "color": "White",
    "sellingPrice": 1200,
    "stockQty": 25,
    "status": "ACTIVE"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "VARIANT_NOT_FOUND",
    "message": "No variant found with barcode: 8901234567890"
  }
}
```

---

## 5.4 Search Variants
Search variants by query (used in POS autocomplete).

**Endpoint:** `GET /variants/search`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (name, SKU, or barcode) |
| limit | number | Max results (default: 10) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "productName": "Cotton Shirt",
      "sku": "RAY-CTSH-M-WHT",
      "barcode": "8901234567890",
      "size": "M",
      "color": "White",
      "sellingPrice": 1200,
      "stockQty": 25
    }
  ]
}
```

---

## 5.5 Create Variant
**Endpoint:** `POST /variants`

**Request Body:**
```json
{
  "productId": 1,
  "sku": "RAY-CTSH-L-BLU",
  "barcode": "8901234567891",
  "size": "L",
  "color": "Blue",
  "sellingPrice": 1200,
  "avgCost": 0
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Variant created successfully"
}
```

**Error (409):**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_BARCODE",
    "message": "Barcode already exists"
  }
}
```

---

## 5.6 Update Variant
**Endpoint:** `PUT /variants/{id}`

**Request Body:**
```json
{
  "sku": "RAY-CTSH-L-BLU",
  "barcode": "8901234567891",
  "size": "L",
  "color": "Blue",
  "sellingPrice": 1300,
  "avgCost": 850
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Variant updated successfully"
}
```

---

## 5.7 Update Variant Status
Activate or deactivate a variant.

**Endpoint:** `PUT /variants/{id}/status`

**Request Body:**
```json
{
  "status": "INACTIVE"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Variant deactivated successfully"
}
```

---

# 6. Supplier APIs (Admin Only)

## 6.1 List Suppliers
**Endpoint:** `GET /suppliers`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search by name or phone |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Ravi Textiles",
      "phone": "9876543210",
      "email": "ravi@textiles.com",
      "address": "Surat, Gujarat",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

## 6.2 Get Supplier by ID
**Endpoint:** `GET /suppliers/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ravi Textiles",
    "phone": "9876543210",
    "email": "ravi@textiles.com",
    "address": "Surat, Gujarat",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

## 6.3 Create Supplier
**Endpoint:** `POST /suppliers`

**Request Body:**
```json
{
  "name": "New Supplier",
  "phone": "9876543210",
  "email": "supplier@email.com",
  "address": "City, State"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Supplier created successfully"
}
```

---

## 6.4 Update Supplier
**Endpoint:** `PUT /suppliers/{id}`

**Request Body:**
```json
{
  "name": "Updated Supplier Name",
  "phone": "9876543210",
  "email": "updated@email.com",
  "address": "New Address"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Supplier updated successfully"
}
```

---

# 7. Purchase APIs (Admin Only)

## 7.1 List Purchases
Get all purchases with optional filters.

**Endpoint:** `GET /purchases`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| supplierId | string | Filter by supplier |
| startDate | string | Filter from date (YYYY-MM-DD) |
| endDate | string | Filter to date (YYYY-MM-DD) |
| search | string | Search by invoice number |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "supplierId": 1,
      "supplierName": "Ravi Textiles",
      "invoiceNo": "INV-2026-001",
      "purchasedAt": "2026-01-15T10:30:00Z",
      "totalCost": 50000,
      "itemCount": 5,
      "notes": "Regular order",
      "createdBy": 1,
      "createdByName": "Mahesh Joshi",
      "createdAt": "2026-01-15T10:30:00Z"
    }
  ]
}
```

---

## 7.2 Get Purchase by ID
Get purchase with all items.

**Endpoint:** `GET /purchases/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "supplierId": 1,
    "supplierName": "Ravi Textiles",
    "invoiceNo": "INV-2026-001",
    "purchasedAt": "2026-01-15T10:30:00Z",
    "totalCost": 50000,
    "notes": "Regular order",
    "createdBy": 1,
    "createdByName": "Mahesh Joshi",
    "createdAt": "2026-01-15T10:30:00Z",
    "items": [
      {
        "id": 1,
        "variantId": 1,
        "variantSku": "RAY-CTSH-M-WHT",
        "variantBarcode": "8901234567890",
        "productName": "Cotton Shirt",
        "size": "M",
        "color": "White",
        "qty": 10,
        "unitCost": 800,
        "totalCost": 8000
      }
    ]
  }
}
```

---

## 7.3 Create Purchase
Create a new purchase order. This will:
- Add items to inventory
- Update variant avgCost using weighted average
- Increase stock quantity

**Endpoint:** `POST /purchases`

**Request Body:**
```json
{
  "supplierId": 1,
  "invoiceNo": "INV-2026-002",
  "purchasedAt": "2026-02-01T10:30:00Z",
  "notes": "New stock arrival",
  "items": [
    {
      "variantId": 1,
      "qty": 10,
      "unitCost": 800
    },
    {
      "variantId": 1,
      "qty": 5,
      "unitCost": 1200
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "supplierId": 1,
    "supplierName": "Ravi Textiles",
    "invoiceNo": "INV-2026-002",
    "totalCost": 14000,
    "itemCount": 2,
    ...
  },
  "message": "Purchase created successfully. Stock updated."
}
```

---

# 8. Inventory APIs

## 8.1 Get Inventory Summary
Get aggregated inventory statistics.

**Endpoint:** `GET /inventory/summary`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSkus": 150,
    "totalItems": 5000,
    "totalValue": 2500000,
    "lowStockCount": 12,
    "outOfStockCount": 5
  }
}
```

---

## 8.2 Get Stock Movements
Get stock movement history for a variant.

**Endpoint:** `GET /inventory/movements/{variantId}`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter from date |
| endDate | string | Filter to date |
| type | string | Filter by type: PURCHASE, SALE, ADJUSTMENT, VOID_RESTORE |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "PURCHASE",
      "date": "2026-01-15T10:30:00Z",
      "qty": 10,
      "referenceId": 1,
      "referenceNo": "INV-2026-001",
      "supplierName": "Ravi Textiles",
      "unitCost": 800,
      "notes": null
    },
    {
      "id": 1,
      "type": "SALE",
      "date": "2026-01-20T14:30:00Z",
      "qty": -2,
      "referenceId": 1,
      "referenceNo": "MJT000045",
      "notes": null
    },
    {
      "id": 1,
      "type": "ADJUSTMENT",
      "date": "2026-01-25T09:00:00Z",
      "qty": -1,
      "referenceId": 1,
      "notes": "DAMAGE: Item damaged in storage"
    }
  ]
}
```

---

## 8.3 Get Supplier Summary for Variant
Get all suppliers who have supplied a particular variant.

**Endpoint:** `GET /inventory/suppliers/{variantId}`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "supplierId": 1,
      "supplierName": "Ravi Textiles",
      "totalQty": 50,
      "purchaseCount": 3,
      "lastPurchaseDate": "2026-01-15T10:30:00Z",
      "avgUnitCost": 820
    },
    {
      "supplierId": 1,
      "supplierName": "Kumar Fabrics",
      "totalQty": 30,
      "purchaseCount": 2,
      "lastPurchaseDate": "2025-12-20T10:30:00Z",
      "avgUnitCost": 850
    }
  ]
}
```

---

## 8.4 Create Stock Adjustment
Manually adjust stock (for damage, theft, correction, opening stock, etc.).

**Endpoint:** `POST /inventory/adjustments`

**Request Body:**
```json
{
  "variantId": 1,
  "deltaQty": -5,
  "reason": "DAMAGE",
  "notes": "Items damaged during transport"
}
```

**Allowed Reasons:** `OPENING_STOCK`, `DAMAGE`, `THEFT`, `CORRECTION`, `RETURN`, `OTHER`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "variantId": 1,
    "deltaQty": -5,
    "reason": "DAMAGE",
    "notes": "Items damaged during transport",
    "createdBy": 1,
    "createdAt": "2026-02-01T10:30:00Z"
  },
  "message": "Stock adjusted successfully"
}
```

**Error (422):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Cannot reduce stock below zero. Current stock: 3"
  }
}
```

---

# 9. Sales APIs

## 9.1 List Sales
Get all sales with optional filters.

**Endpoint:** `GET /sales`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter from date (YYYY-MM-DD) |
| endDate | string | Filter to date (YYYY-MM-DD) |
| paymentMode | string | Filter by: CASH, CARD, UPI, CREDIT |
| status | string | Filter by: COMPLETED, VOIDED |
| createdBy | string | Filter by cashier user ID |
| search | string | Search by bill number or customer name/phone |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "billNo": "MJT000045",
      "soldAt": "2026-01-20T14:30:00Z",
      "customerName": "Rajesh Kumar",
      "customerPhone": "9876543210",
      "paymentMode": "CASH",
      "subtotal": 3500,
      "discountPercent": 0,
      "discountAmount": 0,
      "taxPercent": 5,
      "taxAmount": 175,
      "total": 3675,
      "profit": 875,
      "itemCount": 3,
      "status": "COMPLETED",
      "createdBy": 1,
      "createdByName": "Ramesh",
      "createdAt": "2026-01-20T14:30:00Z"
    }
  ]
}
```

---

## 9.2 Get Sale by ID
Get sale with all items.

**Endpoint:** `GET /sales/{id}`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "billNo": "MJT000045",
    "soldAt": "2026-01-20T14:30:00Z",
    "customerName": "Rajesh Kumar",
    "customerPhone": "9876543210",
    "paymentMode": "CASH",
    "subtotal": 3500,
    "discountPercent": 0,
    "discountAmount": 0,
    "taxPercent": 5,
    "taxAmount": 175,
    "total": 3675,
    "profit": 875,
    "status": "COMPLETED",
    "createdBy": 1,
    "createdByName": "Ramesh",
    "createdAt": "2026-01-20T14:30:00Z",
    "voidedAt": null,
    "voidedBy": null,
    "voidReason": null,
    "items": [
      {
        "id": 1,
        "variantId": 1,
        "variantSku": "RAY-CTSH-M-WHT",
        "variantBarcode": "8901234567890",
        "productName": "Cotton Shirt",
        "size": "M",
        "color": "White",
        "qty": 2,
        "unitPrice": 1200,
        "unitCostAtSale": 800,
        "totalPrice": 2400,
        "profit": 800
      }
    ]
  }
}
```

---

## 9.3 Create Sale
Create a new sale. This will:
- Generate bill number (prefix + auto-increment)
- Deduct stock from inventory
- Calculate profit based on avgCost at time of sale

**Endpoint:** `POST /sales`

**Request Body:**
```json
{
  "customerName": "Rajesh Kumar",
  "customerPhone": "9876543210",
  "paymentMode": "CASH",
  "discountPercent": 5,
  "items": [
    {
      "variantId": 1,
      "qty": 2,
      "unitPrice": 1200
    },
    {
      "variantId": 1,
      "qty": 1,
      "unitPrice": 800
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "billNo": "MJT000046",
    "soldAt": "2026-02-01T10:30:00Z",
    "subtotal": 3200,
    "discountPercent": 5,
    "discountAmount": 160,
    "taxPercent": 5,
    "taxAmount": 152,
    "total": 3192,
    "profit": 720,
    ...
  },
  "message": "Sale completed successfully"
}
```

**Error (422):**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for RAY-CTSH-M-WHT. Available: 1, Requested: 2"
  }
}
```

---

## 9.4 Void Sale (Admin Only)
Void a completed sale. This will:
- Mark sale as VOIDED
- Restore stock to inventory

**Endpoint:** `PUT /sales/{id}/void`

**Request Body:**
```json
{
  "reason": "Customer returned all items - wrong size"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "billNo": "MJT000045",
    "status": "VOIDED",
    "voidedAt": "2026-02-01T11:00:00Z",
    "voidedBy": 1,
    "voidReason": "Customer returned all items - wrong size",
    ...
  },
  "message": "Sale voided successfully. Stock restored."
}
```

---

# 10. Dashboard APIs

## 10.1 Get Dashboard Stats
Get key metrics for dashboard.

**Endpoint:** `GET /dashboard/stats`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | today, 7days, 30days, custom |
| startDate | string | Required if period=custom |
| endDate | string | Required if period=custom |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalSales": 125000,
    "totalProfit": 31250,
    "totalTransactions": 45,
    "avgOrderValue": 2778,
    "lowStockCount": 12,
    "outOfStockCount": 5,
    "totalSkus": 150
  }
}
```

---

## 10.2 Get Sales Trend
Get daily sales data for chart.

**Endpoint:** `GET /dashboard/sales-trend`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| days | number | Number of days (default: 30) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01",
      "sales": 15000,
      "profit": 3750,
      "transactions": 5
    },
    {
      "date": "2026-01-02",
      "sales": 22000,
      "profit": 5500,
      "transactions": 8
    }
  ]
}
```

---

## 10.3 Get Top Selling Products
Get top selling products/variants.

**Endpoint:** `GET /dashboard/top-products`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | today, 7days, 30days |
| limit | number | Number of results (default: 10) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "variantId": 1,
      "productName": "Cotton Shirt",
      "sku": "RAY-CTSH-M-WHT",
      "size": "M",
      "color": "White",
      "qtySold": 45,
      "revenue": 54000,
      "profit": 13500
    }
  ]
}
```

---

## 10.4 Get Low Stock Items
Get items below low stock threshold.

**Endpoint:** `GET /dashboard/low-stock`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of results (default: 10) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "variantId": 1,
      "productName": "Cotton Shirt",
      "sku": "RAY-CTSH-M-WHT",
      "size": "M",
      "color": "White",
      "stockQty": 3,
      "threshold": 10
    }
  ]
}
```

---

## 10.5 Get Recent Sales
Get most recent sales.

**Endpoint:** `GET /dashboard/recent-sales`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of results (default: 10) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "billNo": "MJT000045",
      "soldAt": "2026-01-20T14:30:00Z",
      "customerName": "Rajesh Kumar",
      "total": 3675,
      "itemCount": 3,
      "paymentMode": "CASH",
      "status": "COMPLETED"
    }
  ]
}
```

---

# 11. Reports APIs (Admin Only)

## 11.1 Sales Summary Report
Get sales aggregated by day/week/month.

**Endpoint:** `GET /reports/sales-summary`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (YYYY-MM-DD) |
| endDate | string | End date (YYYY-MM-DD) |
| groupBy | string | day, week, month |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSales": 500000,
      "totalProfit": 125000,
      "totalTransactions": 180,
      "avgOrderValue": 2778
    },
    "breakdown": [
      {
        "period": "2026-01-01",
        "sales": 15000,
        "profit": 3750,
        "transactions": 5,
        "avgOrderValue": 3000
      }
    ],
    "paymentModeBreakdown": [
      { "mode": "CASH", "amount": 300000, "count": 100 },
      { "mode": "UPI", "amount": 150000, "count": 60 },
      { "mode": "CARD", "amount": 50000, "count": 20 }
    ]
  }
}
```

---

## 11.2 Product Performance Report
Get product/variant performance metrics.

**Endpoint:** `GET /reports/product-performance`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (YYYY-MM-DD) |
| endDate | string | End date (YYYY-MM-DD) |
| category | string | Filter by category |
| brand | string | Filter by brand |
| sortBy | string | qtySold, revenue, profit, margin |
| order | string | asc, desc |
| limit | number | Number of results |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "topSellers": [
      {
        "variantId": 1,
        "productName": "Cotton Shirt",
        "sku": "RAY-CTSH-M-WHT",
        "category": "Shirts",
        "brand": "Raymond",
        "qtySold": 45,
        "revenue": 54000,
        "cost": 36000,
        "profit": 18000,
        "marginPercent": 33.3
      }
    ],
    "slowMovers": [
      {
        "variantId": 1,
        "productName": "Wool Blazer",
        "sku": "VH-WBLZ-L-BLK",
        "qtySold": 1,
        "daysSinceLastSale": 45,
        "stockQty": 10
      }
    ],
    "categoryBreakdown": [
      {
        "category": "Shirts",
        "qtySold": 200,
        "revenue": 240000,
        "profit": 60000
      }
    ]
  }
}
```

---

## 11.3 Profit Report
Get detailed profit analysis.

**Endpoint:** `GET /reports/profit`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (YYYY-MM-DD) |
| endDate | string | End date (YYYY-MM-DD) |
| groupBy | string | day, week, month, category, brand, cashier |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 500000,
      "totalCost": 375000,
      "grossProfit": 125000,
      "profitMargin": 25
    },
    "trend": [
      {
        "period": "2026-01-01",
        "revenue": 15000,
        "cost": 11250,
        "profit": 3750,
        "margin": 25
      }
    ],
    "byCategory": [
      {
        "category": "Shirts",
        "revenue": 200000,
        "cost": 140000,
        "profit": 60000,
        "margin": 30
      }
    ],
    "byCashier": [
      {
        "userId": 1,
        "userName": "Ramesh",
        "revenue": 300000,
        "profit": 75000,
        "transactions": 100
      }
    ]
  }
}
```

---

## 11.4 Inventory Valuation Report
Get current inventory valuation.

**Endpoint:** `GET /reports/inventory-valuation`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| brand | string | Filter by brand |
| groupBy | string | category, brand |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSkus": 150,
      "totalItems": 5000,
      "totalCostValue": 2000000,
      "totalRetailValue": 3000000,
      "potentialProfit": 1000000
    },
    "byCategory": [
      {
        "category": "Shirts",
        "skuCount": 50,
        "itemCount": 1500,
        "costValue": 600000,
        "retailValue": 900000
      }
    ],
    "byBrand": [
      {
        "brand": "Raymond",
        "skuCount": 30,
        "itemCount": 800,
        "costValue": 400000,
        "retailValue": 600000
      }
    ]
  }
}
```

---

## 11.5 Low Stock Report
Get detailed low stock and reorder suggestions.

**Endpoint:** `GET /reports/low-stock`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| brand | string | Filter by brand |
| includeOutOfStock | boolean | Include zero stock items |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "lowStockCount": 25,
      "outOfStockCount": 5,
      "totalReorderValue": 150000
    },
    "items": [
      {
        "variantId": 1,
        "productName": "Cotton Shirt",
        "sku": "RAY-CTSH-M-WHT",
        "category": "Shirts",
        "brand": "Raymond",
        "currentStock": 3,
        "threshold": 10,
        "avgMonthlySales": 15,
        "suggestedReorder": 20,
        "lastPurchasePrice": 800,
        "reorderCost": 16000,
        "lastSupplier": "Ravi Textiles"
      }
    ]
  }
}
```

---

## 11.6 Export Report
Export any report as CSV/Excel.

**Endpoint:** `GET /reports/export`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| reportType | string | sales-summary, product-performance, profit, inventory-valuation, low-stock |
| format | string | csv, xlsx |
| startDate | string | Start date |
| endDate | string | End date |
| ... | ... | Other report-specific filters |

**Response:** File download with appropriate Content-Type header.

---

# 12. Lookup/Utility APIs

## 12.1 Get All Lookup Data
Get all dropdown/lookup data in one call (useful for initial app load).

**Endpoint:** `GET /lookups`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "categories": ["Shirts", "Trousers", "Sarees"],
    "brands": ["Raymond", "Peter England", "Van Heusen"],
    "sizes": ["XS", "S", "M", "L", "XL", "XXL"],
    "colors": ["White", "Black", "Blue", "Red"],
    "paymentModes": ["CASH", "CARD", "UPI", "CREDIT"],
    "adjustmentReasons": ["OPENING_STOCK", "DAMAGE", "THEFT", "CORRECTION", "RETURN", "OTHER"],
    "userRoles": ["ADMIN", "EMPLOYEE"]
  }
}
```

---

# Summary - API Count by Module

| Module | Endpoints | Admin Only |
|--------|-----------|------------|
| Authentication | 4 | - |
| Settings | 2 | 1 |
| Users | 6 | 6 |
| Products | 6 | - |
| Variants | 7 | - |
| Suppliers | 4 | 4 |
| Purchases | 3 | 3 |
| Inventory | 4 | 1 |
| Sales | 4 | 1 |
| Dashboard | 5 | - |
| Reports | 6 | 6 |
| Lookups | 1 | - |
| **Total** | **52** | **22** |

---

# Notes for Implementation

## Business Logic

1. **Weighted Average Cost**: When creating a purchase, update variant's avgCost:
   ```
   newAvgCost = ((currentStock * currentAvgCost) + (newQty * newUnitCost)) / (currentStock + newQty)
   ```

2. **Bill Number Generation**: Auto-increment from settings.lastBillNumber with prefix:
   ```
   billNo = settings.invoicePrefix + String(lastBillNumber + 1).padStart(6, '0')
   ```

3. **Profit Calculation**: Store unitCostAtSale when creating sale item:
   ```
   profit = (unitPrice - unitCostAtSale) * qty
   ```

4. **Stock Validation**: Always validate stock before sale:
   - Return error if requested qty > available stock
   - Never allow negative stock

5. **Void Sale**: Only restore stock if sale was COMPLETED (not already VOIDED)

## Security

1. **Role-Based Access**:
   - ADMIN: Full access to all endpoints
   - EMPLOYEE: Limited to billing, products (no cost), inventory (no cost), sales (no profit)

2. **Sensitive Data**: Never return cost/profit data to EMPLOYEE role

3. **Token Expiry**: Recommended 24 hours, refresh token flow optional

## Performance Recommendations

1. Add pagination for list endpoints with large data
2. Add caching for lookup data (categories, brands)
3. Index frequently queried fields (barcode, sku, billNo)
4. Consider async processing for report generation

---

*Document Version: 1.0*
*Last Updated: February 2026*
