import { generateId, generateSKU, generateBarcode, generateOrderNumber } from "../utils/generators"
import type { Business, Branch, Warehouse, Category, Brand, Supplier, Product, Customer, CustomerGroup, Employee, User } from "../types"

const businessId = generateId()
const ownerId = generateId()
const branchId = generateId()
const warehouseId = generateId()

export const mockBusiness: Business = {
  id: businessId,
  name: "Main Street Retail",
  slug: "main-street-retail",
  email: "info@mainstreetretail.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main Street, New York, NY 10001",
  currency: "USD",
  timezone: "America/New_York",
  createdAt: "2025-01-15T08:00:00Z",
}

export const mockUsers: User[] = [
  { id: ownerId, email: "owner@mainstreetretail.com", name: "John Smith", role: "business_owner", businessId, branchId, emailVerified: true, twoFactorEnabled: false, phone: "+1 (555) 111-1111", createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), email: "manager@mainstreetretail.com", name: "Sarah Johnson", role: "branch_manager", businessId, branchId, emailVerified: true, twoFactorEnabled: false, phone: "+1 (555) 111-2222", createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), email: "cashier1@mainstreetretail.com", name: "Mike Brown", role: "cashier", businessId, branchId, emailVerified: true, twoFactorEnabled: false, phone: "+1 (555) 111-3333", createdAt: "2025-03-01T08:00:00Z", updatedAt: "2025-03-01T08:00:00Z" },
  { id: generateId(), email: "inventory@mainstreetretail.com", name: "Lisa Davis", role: "inventory_manager", businessId, branchId, emailVerified: true, twoFactorEnabled: false, phone: "+1 (555) 111-4444", createdAt: "2025-03-15T08:00:00Z", updatedAt: "2025-03-15T08:00:00Z" },
  { id: generateId(), email: "accountant@mainstreetretail.com", name: "Tom Wilson", role: "accountant", businessId, branchId, emailVerified: true, twoFactorEnabled: false, phone: "+1 (555) 111-5555", createdAt: "2025-04-01T08:00:00Z", updatedAt: "2025-04-01T08:00:00Z" },
]

export const mockBranches: Branch[] = [
  { id: branchId, businessId, name: "Main Street Store", address: "123 Main Street, New York, NY 10001", phone: "+1 (555) 123-4567", email: "mainstore@mainstreetretail.com", managerId: mockUsers[1].id, isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Downtown Branch", address: "456 Broadway, New York, NY 10013", phone: "+1 (555) 234-5678", email: "downtown@mainstreetretail.com", isActive: true, createdAt: "2025-03-01T08:00:00Z" },
]

export const mockWarehouses: Warehouse[] = [
  { id: warehouseId, businessId, name: "Main Warehouse", address: "789 Industrial Blvd, New York, NY 10001", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, branchId: branchId, name: "Store Backroom", address: "123 Main Street, New York, NY 10001", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
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
  { id: generateId(), businessId, name: "Global Distributors Inc.", contactPerson: "Robert Green", email: "robert@globaldist.com", phone: "+1 (555) 333-1111", address: "100 Supply Chain Dr, Newark, NJ", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Fresh Foods Supply", contactPerson: "Anna White", email: "anna@freshfoods.com", phone: "+1 (555) 333-2222", address: "200 Farm Road, Jersey City, NJ", isActive: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, name: "TechWorld Wholesale", contactPerson: "David Black", email: "david@techworld.com", phone: "+1 (555) 333-3333", address: "300 Tech Park, Boston, MA", isActive: true, createdAt: "2025-02-01T08:00:00Z" },
]

const beverageCat = mockCategories[0]
const snackCat = mockCategories[1]
const groceryCat = mockCategories[2]
const electronicsCat = mockCategories[3]
const clothingCat = mockCategories[4]

export const mockProducts: Product[] = [
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[0].id, supplierId: mockSuppliers[0].id, name: "Coca-Cola Classic 330ml", slug: "coca-cola-classic-330ml", sku: generateSKU("CocaCola", "Beverages"), barcode: generateBarcode(), costPrice: 0.50, sellingPrice: 1.50, taxRate: 8, unit: "piece", minStock: 50, maxStock: 500, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[1].id, supplierId: mockSuppliers[0].id, name: "Pepsi 330ml", slug: "pepsi-330ml", sku: generateSKU("Pepsi", "Beverages"), barcode: generateBarcode(), costPrice: 0.45, sellingPrice: 1.40, taxRate: 8, unit: "piece", minStock: 50, maxStock: 500, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[0].id, supplierId: mockSuppliers[0].id, name: "Sprite 330ml", slug: "sprite-330ml", sku: generateSKU("Sprite", "Beverages"), barcode: generateBarcode(), costPrice: 0.45, sellingPrice: 1.40, taxRate: 8, unit: "piece", minStock: 50, maxStock: 500, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: beverageCat.id, brandId: mockBrands[2].id, supplierId: mockSuppliers[1].id, name: "Nestlé Pure Life Water 500ml", slug: "nestle-pure-life-water-500ml", sku: generateSKU("PureLife", "Beverages"), barcode: generateBarcode(), costPrice: 0.30, sellingPrice: 1.00, taxRate: 8, unit: "piece", minStock: 100, maxStock: 1000, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: snackCat.id, brandId: mockBrands[2].id, supplierId: mockSuppliers[0].id, name: "Kit Kat 45g", slug: "kit-kat-45g", sku: generateSKU("KitKat", "Snacks"), barcode: generateBarcode(), costPrice: 0.60, sellingPrice: 1.80, taxRate: 8, unit: "piece", minStock: 30, maxStock: 300, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: snackCat.id, brandId: mockBrands[2].id, supplierId: mockSuppliers[0].id, name: "Doritos Nacho Cheese 80g", slug: "doritos-nacho-cheese-80g", sku: generateSKU("Doritos", "Snacks"), barcode: generateBarcode(), costPrice: 0.80, sellingPrice: 2.50, taxRate: 8, unit: "piece", minStock: 30, maxStock: 300, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: groceryCat.id, supplierId: mockSuppliers[1].id, name: "Organic Brown Rice 1kg", slug: "organic-brown-rice-1kg", sku: generateSKU("BrownRice", "Groceries"), barcode: generateBarcode(), costPrice: 2.50, sellingPrice: 5.99, taxRate: 0, unit: "piece", minStock: 20, maxStock: 200, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: groceryCat.id, supplierId: mockSuppliers[1].id, name: "Organic Pasta 500g", slug: "organic-pasta-500g", sku: generateSKU("Pasta", "Groceries"), barcode: generateBarcode(), costPrice: 1.20, sellingPrice: 3.49, taxRate: 0, unit: "piece", minStock: 20, maxStock: 200, isActive: true, hasVariants: false, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: electronicsCat.id, brandId: mockBrands[3].id, supplierId: mockSuppliers[2].id, name: "Samsung 128GB USB Drive", slug: "samsung-128gb-usb-drive", sku: generateSKU("USB128", "Electronics"), barcode: generateBarcode(), costPrice: 8.00, sellingPrice: 19.99, taxRate: 16, unit: "piece", minStock: 10, maxStock: 100, isActive: true, hasVariants: false, createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), businessId, categoryId: electronicsCat.id, brandId: mockBrands[3].id, supplierId: mockSuppliers[2].id, name: "Samsung Wireless Charger", slug: "samsung-wireless-charger", sku: generateSKU("Charger", "Electronics"), barcode: generateBarcode(), costPrice: 12.00, sellingPrice: 29.99, taxRate: 16, unit: "piece", minStock: 10, maxStock: 100, isActive: true, hasVariants: false, createdAt: "2025-02-01T08:00:00Z", updatedAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), businessId, categoryId: clothingCat.id, brandId: mockBrands[4].id, supplierId: mockSuppliers[0].id, name: "Nike Classic Cap", slug: "nike-classic-cap", sku: generateSKU("Cap", "Clothing"), barcode: generateBarcode(), costPrice: 5.00, sellingPrice: 19.99, taxRate: 8, unit: "piece", minStock: 15, maxStock: 150, isActive: true, hasVariants: true, createdAt: "2025-02-15T08:00:00Z", updatedAt: "2025-02-15T08:00:00Z" },
  { id: generateId(), businessId, categoryId: clothingCat.id, brandId: mockBrands[4].id, supplierId: mockSuppliers[0].id, name: "Nike Running Socks", slug: "nike-running-socks", sku: generateSKU("Socks", "Clothing"), barcode: generateBarcode(), costPrice: 3.00, sellingPrice: 12.99, taxRate: 8, unit: "pack", minStock: 20, maxStock: 200, isActive: true, hasVariants: false, createdAt: "2025-02-15T08:00:00Z", updatedAt: "2025-02-15T08:00:00Z" },
]

export const mockCustomerGroups: CustomerGroup[] = [
  { id: generateId(), businessId, name: "Regular", discountPercent: 0, isActive: true },
  { id: generateId(), businessId, name: "VIP", discountPercent: 10, isActive: true },
  { id: generateId(), businessId, name: "Wholesale", discountPercent: 15, isActive: true },
]

export const mockCustomers: Customer[] = [
  { id: generateId(), businessId, name: "Alice Johnson", email: "alice@email.com", phone: "+1 (555) 444-1111", address: "10 Oak Street, New York, NY", groupId: mockCustomerGroups[1].id, loyaltyPoints: 1250, storeCredit: 50.00, birthday: "1990-05-15", isActive: true, createdAt: "2025-02-01T08:00:00Z" },
  { id: generateId(), businessId, name: "Bob Williams", email: "bob@email.com", phone: "+1 (555) 444-2222", address: "20 Pine Road, New York, NY", groupId: mockCustomerGroups[0].id, loyaltyPoints: 450, storeCredit: 0, birthday: "1985-11-20", isActive: true, createdAt: "2025-02-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Carol Martinez", email: "carol@email.com", phone: "+1 (555) 444-3333", address: "30 Elm Street, New York, NY", groupId: mockCustomerGroups[2].id, loyaltyPoints: 3200, storeCredit: 120.00, birthday: "1992-03-08", isActive: true, createdAt: "2025-03-01T08:00:00Z" },
  { id: generateId(), businessId, name: "David Lee", email: "david@email.com", phone: "+1 (555) 444-4444", address: "40 Maple Ave, New York, NY", groupId: mockCustomerGroups[0].id, loyaltyPoints: 200, storeCredit: 0, birthday: "1988-07-22", isActive: true, createdAt: "2025-03-15T08:00:00Z" },
  { id: generateId(), businessId, name: "Emma Taylor", email: "emma@email.com", phone: "+1 (555) 444-5555", address: "50 Cedar Lane, New York, NY", groupId: mockCustomerGroups[1].id, loyaltyPoints: 890, storeCredit: 25.00, birthday: "1995-09-12", isActive: true, createdAt: "2025-04-01T08:00:00Z" },
]

export const mockEmployees: Employee[] = [
  { id: generateId(), userId: mockUsers[0].id, businessId, branchId, role: "business_owner", hireDate: "2025-01-15", isActive: true },
  { id: generateId(), userId: mockUsers[1].id, businessId, branchId, role: "branch_manager", salary: 55000, hireDate: "2025-02-01", isActive: true },
  { id: generateId(), userId: mockUsers[2].id, businessId, branchId, role: "cashier", salary: 35000, hireDate: "2025-03-01", isActive: true },
  { id: generateId(), userId: mockUsers[3].id, businessId, branchId, role: "inventory_manager", salary: 45000, hireDate: "2025-03-15", isActive: true },
  { id: generateId(), userId: mockUsers[4].id, businessId, branchId, role: "accountant", salary: 50000, hireDate: "2025-04-01", isActive: true },
]
