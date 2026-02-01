# MJ Textiles - Shop Admin's Guide

Welcome to MJ Textiles! This guide will help you understand how to use the application to manage your textile shop.

---

## 🚀 Quick Start (New Users)

If you're just starting, follow these steps in order:

| Step | What to Do | Where |
|------|------------|-------|
| 1 | Login with `admin` / `admin123` | Login Page |
| 2 | Set your shop name, tax rate | Settings |
| 3 | Add your products (Shirt, Saree, etc.) | Products |
| 4 | Add variants for each product (size/color) | Products |
| 5 | Add existing stock | Inventory → Adjust Stock → "Opening Stock" |
| 6 | Start selling! | Billing (POS) |

---

## 🔐 Step 1: Login to Your Account

1. Open the application in your web browser
2. Enter your username and password:
   - **Admin Login:** `admin` / `admin123`
   - **Cashier Login:** `cashier` / `cashier123`
3. Click **"Sign In"**

> **Tip:** Admin account has full access. Cashier account can only do billing and view products/inventory (without cost info).

---

## ⚙️ Step 2: Setup Your Shop (First Time Only)

Go to **Settings** from the left menu.

Fill in your shop details:
- **Shop Name** - Your shop's name (appears on bills)
- **Address** - Your shop address
- **Phone** - Contact number
- **Tax Rate** - GST percentage (e.g., 5%)
- **Invoice Prefix** - Bill number prefix (e.g., "MJT" → Bills will be MJT000001, MJT000002...)
- **Low Stock Alert** - Get warned when stock falls below this number

Click **"Save Settings"**

---

## 👕 Step 3: Add Your Products

Go to **Products** from the left menu.

### Understanding Products vs Variants

| Term | What it means | Example |
|------|---------------|---------|
| **Product** | The main item | "Cotton Shirt" |
| **Variant** | Specific version with size/color | "Cotton Shirt - Blue - Medium" |

One product can have many variants!

### Add a New Product (Base Item)

1. Click **"Add Product"**
2. Enter:
   - **Product Name** - e.g., "Silk Saree"
   - **Brand** - e.g., "Kanchipuram"
   - **Category** - e.g., "Sarees"
3. Click **"Create"**

### Add Variants (Specific Items with Size/Color)

Each product can have multiple variants. For example, "Silk Saree" can have:
- Red color, 6 meters
- Blue color, 6 meters
- Green color, 5.5 meters

1. Click **"Add Variant"**
2. Select the **Product** (e.g., Silk Saree)
3. Enter:
   - **SKU** - Your own code (e.g., "SS-RED-6M") - see explanation below
   - **Barcode** - The barcode number on the product tag
   - **Size** - e.g., "6 meters"
   - **Color** - e.g., "Red"
   - **Selling Price** - Price you'll sell at (e.g., ₹5,000)
   - **Cost** - Your estimated purchase cost (e.g., ₹3,500)
4. Click **"Create"**

### Understanding SKU and Barcode

| Field | What it is | Who creates it | Example |
|-------|------------|----------------|---------|
| **SKU** | Your internal code | You | `SS-RED-6M` |
| **Barcode** | Scannable number | Manufacturer or You | `8901234567890` |

Both must be **unique** - no two items can have the same SKU or same Barcode.

> **Important:** 
> - Stock starts at 0 when you create a variant
> - Add stock through **Purchases** (Step 4) or **Inventory Adjustment** (Step 6)

---

## 📦 Step 4: Add Stock (When You Buy from Supplier)

Go to **Purchases** from the left menu.

This is how you add NEW stock that you purchase from suppliers.

### When you receive new stock from your supplier:

1. Click **"New Purchase"**
2. Select **Supplier** (or click "+ Add New Supplier" if new)
3. Enter **Invoice Number** from supplier bill
4. Select **Date** of purchase
5. **Add Items:**
   - Search and select the product variant
   - Enter **Quantity** received
   - Enter **Cost per piece** (what you paid to supplier)
6. Add more items if needed
7. Click **"Save Purchase"**

> **What happens automatically:**
> - Stock quantity increases for those items
> - Average cost is recalculated (if you buy same item at different prices)

### Understanding Average Cost

If you buy the same item at different prices:
- First purchase: 10 pieces at ₹100 each
- Second purchase: 10 pieces at ₹120 each
- **Average cost** = (10×100 + 10×120) / 20 = ₹110

This helps calculate your actual profit!

---

## 🛒 Step 5: Make a Sale (Billing)

Go to **Billing (POS)** from the left menu.

### Adding Items to Bill

**Option A - Scan Barcode (Recommended):**
- The barcode box is automatically focused
- Scan the product barcode with your scanner
- Item is added to cart automatically
- Press **Enter** if typing barcode manually

**Option B - Search:**
- Type product name, SKU, or barcode in search box
- Click on the item to add

### Adjust Quantities
- Use **+** and **-** buttons to change quantity
- Or type the quantity directly
- Click 🗑️ to remove item

> **Note:** You cannot sell more than available stock. A warning will appear.

### Apply Discount (Optional)
- Choose **%** for percentage discount OR **₹** for fixed amount
- Enter the discount value

### Customer Details (Optional)
- Enter customer name and phone for records
- Useful for tracking repeat customers

### Select Payment Mode
- Choose: **Cash**, **Card**, **UPI**, or **Credit**

### Complete the Sale
1. Click **"Complete Sale"**
2. Bill is generated with bill number (e.g., MJT000001)
3. Click **"Print"** to print the invoice
4. Click **"New Sale"** for next customer

> **What happens automatically:**
> - Stock quantity decreases
> - Sale is recorded for reports
> - Bill number increments for next sale

---

## 📊 Step 6: Check Your Inventory

Go to **Inventory** from the left menu.

### What you can see:
- All your products with current stock
- Items with low stock (highlighted in yellow/orange)
- Items out of stock (highlighted in red)
- Stock value of each item
- **Markup %** - Your profit percentage on each item

### Understanding Markup %

| Cost | Selling Price | Profit | Markup % |
|------|---------------|--------|----------|
| ₹100 | ₹150 | ₹50 | 50% |
| ₹100 | ₹200 | ₹100 | 100% |
| ₹100 | ₹130 | ₹30 | 30% |

**Formula:** Markup = (Profit ÷ Cost) × 100

> **Tip:** Hover over Markup % to see Margin % as well.

### Filter Options
- **Category** - Filter by product category
- **Brand** - Filter by brand
- **Stock Status** - See only low stock or out of stock items

### View Supplier History for an Item

Want to know which suppliers have supplied a particular item?

1. Go to **Inventory**
2. Find the item and click the **History** icon (🕐)
3. You'll see:
   - **Suppliers for this item** - All suppliers who have supplied this item
   - Total quantity purchased from each supplier
   - Average cost from each supplier
   - Last purchase date
   - **Movement History** - Detailed log of all stock changes

**Clickable Links in History:**
- Click on a **supplier name** → Opens the purchase invoice details
- Click on a **bill number** → Opens the sale details

This helps you:
- Compare prices from different suppliers
- Decide who to reorder from
- Track quality issues to specific suppliers
- Quickly navigate to related transactions

---

### Adjust Stock Manually

Use this when:
- You're adding **existing inventory** for the first time
- You found **damaged goods**
- There's a **stock count mismatch**
- Items are **lost or stolen**

**Steps:**
1. Click the **+** icon on any item
2. Choose **Add Stock** or **Remove Stock**
3. Enter quantity and select a reason:

| Reason | When to use |
|--------|-------------|
| **Opening Stock** | Adding existing inventory when starting to use the app |
| **Correction** | Fixing stock count errors after physical count |
| **Damage** | Items damaged and cannot be sold |
| **Theft/Loss** | Missing items |
| **Return** | Customer returned items (not from a sale) |
| **Other** | Any other reason |

4. Add notes if needed (optional)
5. Click **Save**

> **Tip:** When starting fresh with the app, use "Opening Stock" to enter all your existing inventory!

---

## 📈 Step 7: View Sales History

Go to **Sales** from the left menu.

### What you can see:
- Bill number
- Date and time
- Customer name
- Payment mode
- Total amount
- Profit (Admin only)

### Filter Sales
- By **Date Range** - Today, Last 7 days, Last 30 days, or custom
- By **Payment Mode** - Cash, Card, UPI, Credit
- By **Cashier** - Which employee made the sale
- By **Status** - Completed or Voided

### View Sale Details
Click the 👁️ icon to see:
- Full list of items sold
- Individual prices and quantities
- Discount applied
- Tax breakdown
- Profit per item (Admin only)

### Cancel/Void a Sale (Admin Only)
If you need to cancel a sale (customer return):
1. Open the sale details
2. Click **"Void Sale"**
3. Enter reason (e.g., "Customer returned - wrong size")
4. Click **Confirm**

> **What happens:** Stock is automatically restored to inventory!

### Exchange an Item
If a customer wants to exchange:
1. Open the sale details
2. Click **"Exchange"** button
3. Follow the on-screen instructions:
   - **For exchange:** Void the sale, then create a new sale with correct items
   - **For full return:** Void the sale and refund the customer
4. Handle any price difference with the customer

---

## 📊 Step 8: View Reports (Admin Only)

Go to **Reports** from the left menu.

### Available Reports:

| Report | What it shows |
|--------|---------------|
| **Sales Summary** | Daily/weekly/monthly sales with charts |
| **Product Performance** | Top selling products, slow movers |
| **Profit Analysis** | Profit by category, profit trends |
| **Inventory Valuation** | Total stock value, value by category |
| **Low Stock Report** | Items that need reordering |

### Using Reports
1. Select **Date Range** at the top (Today, 7 days, 30 days, or custom)
2. View charts and tables
3. Click **"Export CSV"** to download as Excel file

---

## 👥 Step 9: Manage Users (Admin Only)

Go to **Users** from the left menu.

### User Roles

| Role | What they can do |
|------|------------------|
| **Admin** | Everything - billing, purchases, reports, settings, users |
| **Employee** | Billing, view products/inventory (no cost info), view sales (no profit info) |

### Add New User
1. Click **"Add User"**
2. Enter full name, username, password
3. Select role: Admin or Employee
4. Click **"Create"**

### Disable User
If an employee leaves:
1. Find the user in the list
2. Click the disable icon
3. They can no longer login

### Reset Password
1. Click the key icon next to any user
2. Enter new password
3. Click **Reset**

---

## 📱 Dashboard Overview

The **Dashboard** shows you everything at a glance:

### KPI Cards
- **Today's Sales** - Total sales amount for today
- **Today's Profit** - Profit earned today (Admin only)
- **Low Stock Count** - How many items need restocking
- **Total SKUs** - Total variety of items you have

### Charts
- **Sales Trend** - See how sales are going over time
- **Top Products** - Your best selling items

### Quick Tables
- **Low Stock Alert** - Items running low
- **Recent Sales** - Latest transactions

---

## ⌨️ Keyboard Shortcuts

| Action | How to do it |
|--------|--------------|
| Add item by barcode | Type barcode + press **Enter** |
| Focus barcode input | Automatic when POS page opens |

---

## 🌙 Dark Mode

Click the 🌙/☀️ icon in the top bar to switch between dark and light mode.

Your preference is saved automatically.

---

## 🔄 Reset Demo Data

If you want to start fresh with new demo data:
1. Go to **Settings**
2. Scroll down to "Demo Controls"
3. Click **"Reset Demo Data"**
4. Confirm the action

> ⚠️ **Warning:** This will delete ALL your data (products, sales, purchases) and create new sample data!

---

## ❓ Common Questions

**Q: Why can't I sell an item?**
A: The item has 0 stock. Add stock through Purchases or Inventory Adjustment.

**Q: Why is my bill number not changing?**
A: Bill numbers are generated automatically (MJT000001, MJT000002...). Check Settings if you want to change the prefix.

**Q: How do I add a new brand/category?**
A: Simply type the new brand or category name when adding a product. It will be saved automatically for future use.

**Q: Can I edit a sale after completing?**
A: No, completed sales cannot be edited. You can void (cancel) the sale and create a new one.

**Q: What's the difference between Markup and Margin?**
A: 
- **Markup** = (Profit ÷ Cost) × 100 → "How much did I add to my cost?"
- **Margin** = (Profit ÷ Selling Price) × 100 → "What percentage of price is profit?"
- Example: Cost ₹100, Price ₹150 → Markup = 50%, Margin = 33.3%

**Q: Where is my data stored?**
A: Currently in your browser's local storage. Don't clear browser data or you'll lose everything!

**Q: Can I use this on mobile?**
A: Yes! The app is responsive and works on tablets and mobile phones.

---

## 📋 Daily Workflow Checklist

### Start of Day
- [ ] Check Dashboard for low stock items
- [ ] Review yesterday's sales (if needed)

### During Sales
- [ ] Use Billing (POS) for all sales
- [ ] Scan barcodes or search products
- [ ] Complete each sale properly

### When Stock Arrives
- [ ] Go to Purchases
- [ ] Record all items received
- [ ] Verify stock updated in Inventory

### End of Day
- [ ] Check Sales for today's total
- [ ] Note any issues or returns

---

## 📞 Need Help?

This is a demo application. For the actual production version with:
- Cloud storage (data saved online)
- Multiple device sync
- Backup & restore
- More features

Contact your developer.

---

**Happy Selling! 🎉**
