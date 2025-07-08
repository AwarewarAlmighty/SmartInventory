import { 
  users, 
  categories, 
  products, 
  stockMovements,
  type User, 
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type ProductWithCategory,
  type StockMovement,
  type InsertStockMovement,
  type DashboardStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, like, sql, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Product methods
  getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    status?: string;
  }): Promise<{ products: ProductWithCategory[]; total: number }>;
  getProductById(id: number): Promise<ProductWithCategory | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Stock movement methods
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  getStockMovements(productId: number): Promise<StockMovement[]>;
  
  // Dashboard methods
  getDashboardStats(): Promise<DashboardStats>;
  getRecentActivity(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...updateUser,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({
        ...insertCategory,
        updatedAt: new Date(),
      })
      .returning();
    return category;
  }

  async updateCategory(id: number, updateCategory: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set({
        ...updateCategory,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    status?: string;
  }): Promise<{ products: ProductWithCategory[]; total: number }> {
    const { page = 1, limit = 10, search, categoryId, status } = params;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        price: products.price,
        stockQuantity: products.stockQuantity,
        minStockLevel: products.minStockLevel,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));

    const conditions = [];

    if (search) {
      conditions.push(
        sql`${products.name} ILIKE ${`%${search}%`} OR ${products.sku} ILIKE ${`%${search}%`}`
      );
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (status) {
      if (status === "low_stock") {
        conditions.push(sql`${products.stockQuantity} <= ${products.minStockLevel}`);
      } else if (status === "out_of_stock") {
        conditions.push(eq(products.stockQuantity, 0));
      } else if (status === "in_stock") {
        conditions.push(sql`${products.stockQuantity} > ${products.minStockLevel}`);
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const [productsResult, totalResult] = await Promise.all([
      query.limit(limit).offset(offset).orderBy(desc(products.createdAt)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    ]);

    return {
      products: productsResult,
      total: totalResult[0]?.count || 0,
    };
  }

  async getProductById(id: number): Promise<ProductWithCategory | undefined> {
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        description: products.description,
        price: products.price,
        stockQuantity: products.stockQuantity,
        minStockLevel: products.minStockLevel,
        categoryId: products.categoryId,
        imageUrl: products.imageUrl,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          description: categories.description,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));

    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...insertProduct,
        updatedAt: new Date(),
      })
      .returning();
    return product;
  }

  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({
        ...updateProduct,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const [movement] = await db
      .insert(stockMovements)
      .values(insertMovement)
      .returning();
    return movement;
  }

  async getStockMovements(productId: number): Promise<StockMovement[]> {
    return await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.productId, productId))
      .orderBy(desc(stockMovements.createdAt));
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalProducts] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    const [lowStockItems] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(sql`${products.stockQuantity} <= ${products.minStockLevel}`);

    const [totalValue] = await db
      .select({ 
        total: sql<number>`sum(${products.price} * ${products.stockQuantity})` 
      })
      .from(products);

    const [totalCategories] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);

    return {
      totalProducts: totalProducts?.count || 0,
      lowStockItems: lowStockItems?.count || 0,
      totalValue: `$${(totalValue?.total || 0).toLocaleString()}`,
      totalCategories: totalCategories?.count || 0,
    };
  }

  async getRecentActivity(): Promise<any[]> {
    const movements = await db
      .select({
        id: stockMovements.id,
        type: stockMovements.type,
        quantity: stockMovements.quantity,
        reason: stockMovements.reason,
        createdAt: stockMovements.createdAt,
        product: {
          id: products.id,
          name: products.name,
          sku: products.sku,
        },
        user: {
          id: users.id,
          name: users.name,
        },
      })
      .from(stockMovements)
      .leftJoin(products, eq(stockMovements.productId, products.id))
      .leftJoin(users, eq(stockMovements.userId, users.id))
      .orderBy(desc(stockMovements.createdAt))
      .limit(10);

    return movements;
  }
}

export const storage = new DatabaseStorage();
