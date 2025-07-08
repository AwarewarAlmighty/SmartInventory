// In-memory storage fallback for development without MongoDB
import type { IMongoStorage } from './mongodb-storage';
import type { 
  IUser, 
  ICategory, 
  IProduct, 
  IStockMovement,
  UserType,
  CategoryType,
  ProductType,
  StockMovementType,
  ProductWithCategory,
  DashboardStats
} from '../shared/mongodb-schema';

interface MemoryUser extends UserType {
  _id: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryCategory extends CategoryType {
  _id: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryProduct extends ProductType {
  _id: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryStockMovement extends StockMovementType {
  _id: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FallbackStorage implements IMongoStorage {
  private users: Map<string, MemoryUser> = new Map();
  private categories: Map<string, MemoryCategory> = new Map();
  private products: Map<string, MemoryProduct> = new Map();
  private stockMovements: Map<string, MemoryStockMovement> = new Map();
  private nextId = 1;

  constructor() {
    this.seedData();
  }

  private generateId(): string {
    return `mem_${this.nextId++}`;
  }

  private seedData() {
    // Create sample categories
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports', description: 'Sports equipment and accessories' },
      { name: 'Books', description: 'Books and educational materials' }
    ];

    const categoryIds: string[] = [];
    categories.forEach(cat => {
      const id = this.generateId();
      const category: MemoryCategory = {
        ...cat,
        _id: id,
        id: id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.categories.set(id, category);
      categoryIds.push(id);
    });

    // Create sample products
    const products = [
      {
        name: 'iPhone 13',
        sku: 'IPHONE13-128',
        description: 'Apple iPhone 13 with 128GB storage',
        price: 699.99,
        stockQuantity: 25,
        minStockLevel: 5,
        categoryId: categoryIds[0]
      },
      {
        name: 'MacBook Pro',
        sku: 'MBP-M1-512',
        description: 'MacBook Pro with M1 chip and 512GB SSD',
        price: 1299.99,
        stockQuantity: 8,
        minStockLevel: 3,
        categoryId: categoryIds[0]
      },
      {
        name: 'T-Shirt Cotton',
        sku: 'TSHIRT-COT-M',
        description: 'Premium cotton t-shirt medium size',
        price: 29.99,
        stockQuantity: 50,
        minStockLevel: 20,
        categoryId: categoryIds[1]
      },
      {
        name: 'Basketball',
        sku: 'BALL-BASK-OFF',
        description: 'Official size basketball',
        price: 39.99,
        stockQuantity: 22,
        minStockLevel: 10,
        categoryId: categoryIds[3]
      }
    ];

    products.forEach(prod => {
      const id = this.generateId();
      const product: MemoryProduct = {
        ...prod,
        _id: id,
        id: id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.products.set(id, product);
    });
  }

  async getUser(id: string): Promise<IUser | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    for (const user of this.users.values()) {
      if (user.firebaseUid === firebaseUid) return user;
    }
    return null;
  }

  async createUser(userData: UserType): Promise<IUser> {
    const id = this.generateId();
    const user: MemoryUser = {
      ...userData,
      _id: id,
      id: id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<UserType>): Promise<IUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCategories(): Promise<ICategory[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return this.categories.get(id) || null;
  }

  async createCategory(categoryData: CategoryType): Promise<ICategory> {
    const id = this.generateId();
    const category: MemoryCategory = {
      ...categoryData,
      _id: id,
      id: id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<CategoryType>): Promise<ICategory | null> {
    const category = this.categories.get(id);
    if (!category) return null;
    
    const updatedCategory = { ...category, ...categoryData, updatedAt: new Date() };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }): Promise<{ products: ProductWithCategory[]; total: number }> {
    const { page = 1, limit = 10, search = '', categoryId = '', status = '' } = params;
    
    let filteredProducts = Array.from(this.products.values());

    // Apply search filter
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryId) {
      filteredProducts = filteredProducts.filter(product => product.categoryId === categoryId);
    }

    // Apply status filter
    if (status === 'low_stock') {
      filteredProducts = filteredProducts.filter(product => product.stockQuantity < product.minStockLevel);
    }

    const total = filteredProducts.length;
    const skip = (page - 1) * limit;
    const products = filteredProducts.slice(skip, skip + limit);

    // Add category information
    const productsWithCategory = products.map(product => {
      const category = this.categories.get(product.categoryId);
      return {
        ...product,
        category: category || { _id: '', name: 'Unknown', description: '' }
      };
    });

    return { products: productsWithCategory, total };
  }

  async getProductById(id: string): Promise<ProductWithCategory | null> {
    const product = this.products.get(id);
    if (!product) return null;
    
    const category = this.categories.get(product.categoryId);
    return {
      ...product,
      category: category || { _id: '', name: 'Unknown', description: '' }
    };
  }

  async createProduct(productData: ProductType): Promise<IProduct> {
    const id = this.generateId();
    const product: MemoryProduct = {
      ...productData,
      _id: id,
      id: id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<ProductType>): Promise<IProduct | null> {
    const product = this.products.get(id);
    if (!product) return null;
    
    const updatedProduct = { ...product, ...productData, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async createStockMovement(movementData: StockMovementType): Promise<IStockMovement> {
    const id = this.generateId();
    const movement: MemoryStockMovement = {
      ...movementData,
      _id: id,
      id: id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.stockMovements.set(id, movement);
    return movement;
  }

  async getStockMovements(productId: string): Promise<IStockMovement[]> {
    return Array.from(this.stockMovements.values()).filter(movement => movement.productId === productId);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const products = Array.from(this.products.values());
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stockQuantity < p.minStockLevel).length;
    const totalValue = products.reduce((sum, product) => sum + (product.price * product.stockQuantity), 0);
    const totalCategories = this.categories.size;

    return {
      totalProducts,
      lowStockItems,
      totalValue: totalValue.toFixed(2),
      totalCategories
    };
  }

  async getRecentActivity(): Promise<any[]> {
    const movements = Array.from(this.stockMovements.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return movements.map(movement => {
      const product = this.products.get(movement.productId);
      const user = this.users.get(movement.userId);
      return {
        id: movement._id,
        type: movement.type,
        productName: product?.name || 'Unknown Product',
        productSku: product?.sku || 'Unknown',
        quantity: movement.quantity,
        reason: movement.reason,
        userName: user?.name || 'Unknown User',
        createdAt: movement.createdAt
      };
    });
  }
}

export const fallbackStorage = new FallbackStorage();