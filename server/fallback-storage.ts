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

interface MemoryUser extends IUser {
  _id: string;
  id: string;
}

interface MemoryCategory extends ICategory {
  _id: string;
  id: string;
}

interface MemoryProduct extends IProduct {
  _id: string;
  id: string;
}

interface MemoryStockMovement extends IStockMovement {
  _id: string;
  id: string;
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
    const categories = [
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Sports', description: 'Sports equipment and accessories' },
      { name: 'Books', description: 'Books and educational materials' }
    ];

    const categoryDocs: MemoryCategory[] = [];
    categories.forEach(cat => {
      const id = this.generateId();
      const category: MemoryCategory = {
        ...cat,
        _id: id,
        id: id,
        createdAt: new Date(),
        updatedAt: new Date()
      } as MemoryCategory;
      this.categories.set(id, category);
      categoryDocs.push(category);
    });

    const products = [
      {
        name: 'iPhone 13',
        sku: 'IPHONE13-128',
        description: 'Apple iPhone 13 with 128GB storage',
        price: 699.99,
        stockQuantity: 5,
        minStockLevel: 5,
        categoryId: categoryDocs[0]._id
      },
      {
        name: 'MacBook Pro',
        sku: 'MBP-M1-512',
        description: 'MacBook Pro with M1 chip and 512GB SSD',
        price: 1299.99,
        stockQuantity: 3,
        minStockLevel: 3,
        categoryId: categoryDocs[0]._id
      },
      {
        name: 'T-Shirt Cotton',
        sku: 'TSHIRT-COT-M',
        description: 'Premium cotton t-shirt medium size',
        price: 29.99,
        stockQuantity: 50,
        minStockLevel: 20,
        categoryId: categoryDocs[1]._id
      },
      {
        name: 'Basketball',
        sku: 'BALL-BASK-OFF',
        description: 'Official size basketball',
        price: 39.99,
        stockQuantity: 10,
        minStockLevel: 10,
        categoryId: categoryDocs[3]._id
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
      } as MemoryProduct;
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
    } as MemoryUser;
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<UserType>): Promise<IUser | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser: MemoryUser = { ...user, ...userData, updatedAt: new Date() } as MemoryUser;
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
    } as MemoryCategory;
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<CategoryType>): Promise<ICategory | null> {
    const category = this.categories.get(id);
    if (!category) return null;
    
    const updatedCategory: MemoryCategory = { ...category, ...categoryData, updatedAt: new Date() } as MemoryCategory;
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

    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase()) ||
        product.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (categoryId && categoryId !== 'all') {
      filteredProducts = filteredProducts.filter(product => product.categoryId.toString() === categoryId);
    }

    if (status) {
        if (status === 'low_stock') {
            filteredProducts = filteredProducts.filter(product => product.stockQuantity <= product.minStockLevel && product.stockQuantity > 0);
        } else if (status === 'out_of_stock') {
            filteredProducts = filteredProducts.filter(product => product.stockQuantity === 0);
        } else if (status === 'in_stock') {
            filteredProducts = filteredProducts.filter(product => product.stockQuantity > product.minStockLevel);
        }
    }

    const total = filteredProducts.length;
    const skip = (page - 1) * limit;
    const products = filteredProducts.slice(skip, skip + limit);

    const productsWithCategory = products.map(product => {
      const category = this.categories.get(product.categoryId.toString());
      return {
        ...product,
        category: category || { _id: '', name: 'Unknown', description: '' } as ICategory
      };
    });

    return { products: productsWithCategory, total };
  }

  async getProductById(id: string): Promise<ProductWithCategory | null> {
    const product = this.products.get(id);
    if (!product) return null;
    
    const category = this.categories.get(product.categoryId.toString());
    return {
      ...product,
      category: category || { _id: '', name: 'Unknown', description: '' } as ICategory
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
    } as MemoryProduct;
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<ProductType>): Promise<IProduct | null> {
    const product = this.products.get(id);
    if (!product) return null;
    
    const updatedProduct: MemoryProduct = { ...product, ...productData, updatedAt: new Date() } as MemoryProduct;
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
    } as MemoryStockMovement;
    this.stockMovements.set(id, movement);
    return movement;
  }

  async getStockMovements(productId: string): Promise<IStockMovement[]> {
    return Array.from(this.stockMovements.values()).filter(movement => movement.productId.toString() === productId);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const products = Array.from(this.products.values());
    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0).length;
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
      const product = this.products.get(movement.productId.toString());
      const user = this.users.get(movement.userId.toString());
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
