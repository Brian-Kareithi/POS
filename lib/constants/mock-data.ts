import { generateId, generateSKU, generateBarcode, generateOrderNumber } from "../utils/generators"
import type { Business, Branch, Warehouse, Category, Brand, Supplier, Product, Customer, CustomerGroup, Employee, User } from "../types"

// Fixed ids for people, branches and the business so saved data still lines up after a reload.
const businessId = "biz_jamii"
const ownerId = "usr_owner"
const branchId = "br_westlands"
export const eastleighBranchId = "br_eastleigh"
const warehouseId = "wh_main"

export const mockBusiness: Business = {
  id: businessId,
  name: "Jamii Retail",
  slug: "jamii-retail",
  email: "info@jamiiretail.co.ke",
  phone: "+254 712 345 678",
  address: "Mpaka Road, Westlands, Nairobi, Kenya",
  currency: "KES",
  timezone: "Africa/Nairobi",
  createdAt: "2025-01-15T08:00:00Z",
}

const stamp = "2025-02-01T08:00:00Z"
const user = (email: string, name: string, role: User["role"], phone: string, branch: string): User => ({
  id: role === "owner" ? ownerId : `usr_${email}`, email: `${email}@jamiiretail.co.ke`, name, role, businessId, branchId: branch,
  emailVerified: true, twoFactorEnabled: role === "owner", phone, createdAt: stamp, updatedAt: stamp,
})

export const mockUsers: User[] = [
  user("owner", "Kamau Mwangi", "owner", "+254 712 111 111", branchId),
  user("manager", "Atieno Ouma", "manager", "+254 722 444 101", branchId),
  user("cashier1", "Wanjiru Njoroge", "cashier", "+254 712 222 222", branchId),
  user("cashier2", "Otieno Odhiambo", "cashier", "+254 712 333 333", eastleighBranchId),
  user("stock", "Barasa Wekesa", "stockkeeper", "+254 733 555 202", branchId),
]

export const mockBranches: Branch[] = [
  { id: branchId, businessId, name: "Westlands Store", address: "Mpaka Road, Westlands, Nairobi", phone: "+254 712 345 678", email: "mainstore@jamiiretail.co.ke", managerId: mockUsers[0].id, isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: eastleighBranchId, businessId, name: "Eastleigh Branch", address: "Tenth Street, Eastleigh, Nairobi", phone: "+254 723 456 789", email: "downtown@jamiiretail.co.ke", isActive: true, createdAt: "2025-03-01T08:00:00Z" },
]

export const mockWarehouses: Warehouse[] = [
  { id: warehouseId, businessId, name: "Main Warehouse", address: "789 Industrial Area, Nairobi", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, branchId: branchId, name: "Store Backroom", address: "Mpaka Road, Westlands, Nairobi", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
]

export const mockCategories: Category[] = [
  { id: generateId(), businessId, name: "Beverages", slug: "beverages", description: "Drinks and beverages", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Snacks", slug: "snacks", description: "Snack foods", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Groceries", slug: "groceries", description: "General groceries", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Electronics", slug: "electronics", description: "Electronic items", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Clothing", slug: "clothing", description: "Apparel and accessories", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Pharmacy", slug: "pharmacy", description: "Health and medicine", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
]

export const mockBrands: Brand[] = [
  { id: generateId(), businessId, name: "Coca-Cola", slug: "coca-cola", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "PepsiCo", slug: "pepsico", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Nestlé", slug: "nestle", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Samsung", slug: "samsung", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Nike", slug: "nike", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
]

export const mockSuppliers: Supplier[] = [
  { id: generateId(), businessId, name: "Savanna Distributors Ltd", contactPerson: "Peter Kiprono", email: "peter@savannadist.co.ke", phone: "+254 733 111 111", address: "100 Industrial Area, Nairobi", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Mama Mboga Fresh Supplies", contactPerson: "Grace Wafula", email: "grace@mamamboga.co.ke", phone: "+254 722 222 222", address: "200 Farmers Market, Nairobi", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Nairobi Tech Wholesale", contactPerson: "Hassan Abdi", email: "hassan@nairobitech.co.ke", phone: "+254 711 333 333", address: "300 Tech Park, Nairobi", isActive: true, createdAt: "2025-02-01T08:00:00Z" },
]

const beverageCat = mockCategories[0]
const snackCat = mockCategories[1]
const groceryCat = mockCategories[2]
const electronicsCat = mockCategories[3]
const clothingCat = mockCategories[4]

export const mockProducts: Product[] = [
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[0].id, supplierId: mockSuppliers[0].id, name: "Coca-Cola Classic 330ml", slug: "coca-cola-classic-330ml", sku: generateSKU("CocaCola", "Beverages"), barcode: generateBarcode(), costPrice: 50, sellingPrice: 150, taxRate: 8, unit: "piece", minStock: 50, maxStock: 500, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[1].id, supplierId: mockSuppliers[0].id, name: "Pepsi 330ml", slug: "pepsi-330ml", sku: generateSKU("Pepsi", "Beverages"), barcode: generateBarcode(), costPrice: 45, sellingPrice: 140, taxRate: 8, unit: "piece", minStock: 50, maxStock: 500, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[0].id, supplierId: mockSuppliers[0].id, name: "Sprite 330ml", slug: "sprite-330ml", sku: generateSKU("Sprite", "Beverages"), barcode: generateBarcode(), costPrice: 45, sellingPrice: 140, taxRate: 8, unit: "piece", minStock: 50, maxStock: 500, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[2].id, supplierId: mockSuppliers[1].id, name: "Nestlé Pure Life Water 500ml", slug: "nestle-pure-life-water-500ml", sku: generateSKU("PureLife", "Beverages"), barcode: generateBarcode(), costPrice: 30, sellingPrice: 100, taxRate: 8, unit: "piece", minStock: 100, maxStock: 1000, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: snackCat.id, brandId: mockBrands[2].id, supplierId: mockSuppliers[0].id, name: "Kit Kat 45g", slug: "kit-kat-45g", sku: generateSKU("KitKat", "Snacks"), barcode: generateBarcode(), costPrice: 60, sellingPrice: 180, taxRate: 8, unit: "piece", minStock: 30, maxStock: 300, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: snackCat.id, brandId: mockBrands[2].id, supplierId: mockSuppliers[0].id, name: "Doritos Nacho Cheese 80g", slug: "doritos-nacho-cheese-80g", sku: generateSKU("Doritos", "Snacks"), barcode: generateBarcode(), costPrice: 80, sellingPrice: 250, taxRate: 8, unit: "piece", minStock: 30, maxStock: 300, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: groceryCat.id, supplierId: mockSuppliers[1].id, name: "Organic Brown Rice 1kg", slug: "organic-brown-rice-1kg", sku: generateSKU("BrownRice", "Groceries"), barcode: generateBarcode(), costPrice: 250, sellingPrice: 599, taxRate: 0, unit: "piece", minStock: 20, maxStock: 200, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: groceryCat.id, supplierId: mockSuppliers[1].id, name: "Organic Pasta 500g", slug: "organic-pasta-500g", sku: generateSKU("Pasta", "Groceries"), barcode: generateBarcode(), costPrice: 120, sellingPrice: 349, taxRate: 0, unit: "piece", minStock: 20, maxStock: 200, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: electronicsCat.id, brandId: mockBrands[3].id, supplierId: mockSuppliers[2].id, name: "Samsung 128GB USB Drive", slug: "samsung-128gb-usb-drive", sku: generateSKU("USB128", "Electronics"), barcode: generateBarcode(), costPrice: 800, sellingPrice: 1999, taxRate: 16, unit: "piece", minStock: 10, maxStock: 100, isActive: true, hasVariants: false, createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), businessId, categoryId: electronicsCat.id, brandId: mockBrands[3].id, supplierId: mockSuppliers[2].id, name: "Samsung Wireless Charger", slug: "samsung-wireless-charger", sku: generateSKU("Charger", "Electronics"), barcode: generateBarcode(), costPrice: 1200, sellingPrice: 2999, taxRate: 16, unit: "piece", minStock: 10, maxStock: 100, isActive: true, hasVariants: false, createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), businessId, categoryId: clothingCat.id, brandId: mockBrands[4].id, supplierId: mockSuppliers[0].id, name: "Nike Classic Cap", slug: "nike-classic-cap", sku: generateSKU("Cap", "Clothing"), barcode: generateBarcode(), costPrice: 500, sellingPrice: 1999, taxRate: 8, unit: "piece", minStock: 15, maxStock: 150, isActive: true, hasVariants: true, createdAt: "2025-02-15T08:00:00Z", updatedAt: "2025-02-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: clothingCat.id, brandId: mockBrands[4].id, supplierId: mockSuppliers[0].id, name: "Nike Running Socks", slug: "nike-running-socks", sku: generateSKU("Socks", "Clothing"), barcode: generateBarcode(), costPrice: 300, sellingPrice: 1299, taxRate: 8, unit: "pack", minStock: 20, maxStock: 200, isActive: true, hasVariants: false, createdAt: "2025-02-15T08:00:00Z", updatedAt: "2025-02-15T08:00:00Z" },
]

export const mockCustomerGroups: CustomerGroup[] = [
  { id: generateId(), businessId, name: "Regular", discountPercent: 0, isActive: true },
  { id: generateId(), businessId, name: "VIP", discountPercent: 10, isActive: true },
  { id: generateId(), businessId, name: "Wholesale", discountPercent: 15, isActive: true },
]

export const mockCustomers: Customer[] = [
  { id: generateId(), businessId, name: "Akinyi Achieng", email: "akinyi@email.com", phone: "+254 744 111 111", address: "Kilimani Road 10, Nairobi", groupId: mockCustomerGroups[1].id, loyaltyPoints: 1250, storeCredit: 5000, birthday: "1990-05-15", isActive: true, createdAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), businessId, name: "Kipchoge Rotich", email: "kipchoge@email.com", phone: "+254 722 222 222", address: "Lang'ata Road 20, Nairobi", groupId: mockCustomerGroups[0].id, loyaltyPoints: 450, storeCredit: 0, birthday: "1985-11-20", isActive: true, createdAt: "2025-02-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Fatuma Hassan", email: "fatuma@email.com", phone: "+254 733 333 333", address: "Nyali Road 30, Nairobi", groupId: mockCustomerGroups[2].id, loyaltyPoints: 3200, storeCredit: 12000, birthday: "1992-03-08", isActive: true, createdAt: "2025-03-01T08:00:00Z" },
  { id: generateId(), businessId, name: "Mwangi Kariuki", email: "mwangi@email.com", phone: "+254 711 444 444", address: "Thika Road 40, Nairobi", groupId: mockCustomerGroups[0].id, loyaltyPoints: 200, storeCredit: 0, birthday: "1988-07-22", isActive: true, createdAt: "2025-03-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Njeri Wambui", email: "njeri@email.com", phone: "+254 745 555 555", address: "Karen Road 50, Nairobi", groupId: mockCustomerGroups[1].id, loyaltyPoints: 890, storeCredit: 2500, birthday: "1995-09-12", isActive: true, createdAt: "2025-04-01T08:00:00Z" },
]

const emp = (u: User, salary: number | undefined, hireDate: string): Employee => ({
  id: generateId(), userId: u.id, businessId, branchId: u.branchId, role: u.role, salary, hireDate, isActive: true,
})

export const mockEmployees: Employee[] = [
  emp(mockUsers[0], undefined, "2025-01-15"),
  emp(mockUsers[1], 60000, "2025-01-20"),
  emp(mockUsers[2], 30000, "2025-02-01"),
  emp(mockUsers[3], 28000, "2025-03-01"),
  emp(mockUsers[4], 30000, "2025-02-10"),
]

// Perishables get batch numbers and expiry dates (a few are close to expiring so the alerts have something to show).
const expiryDays = [200, 180, 14, 300, 120, 9, 365, 45, 0, 0, 0, 0]
mockProducts.forEach((product, i) => {
  if (expiryDays[i]) {
    product.expiryDate = new Date(Date.now() + expiryDays[i] * 86400000).toISOString()
    product.batchNumber = `B${new Date().getFullYear()}-${String(i + 1).padStart(3, "0")}`
  }
})
