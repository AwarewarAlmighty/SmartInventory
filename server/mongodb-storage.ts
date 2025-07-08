import mongoose from 'mongoose';
import { User, Category, Product, StockMovement } from '../shared/mongodb-schema';
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

export interface IMongoStorage {
  // User methods
  getUser(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserByFirebaseUid(firebaseUid: string): Promise<IUser | null>;
  createUser(user: UserType): Promise<IUser>;
  updateUser(id: string, user: Partial<UserType>): Promise<IUser | null>;
  
  // Category methods
  getCategories(): Promise<ICategory[]>;
  getCategoryById(id: string): Promise<ICategory | null>;
  createCategory(category: CategoryType): Promise<ICategory>;
  updateCategory(id: string, category: Partial<CategoryType>): Promise<ICategory | null>;
  deleteCategory(id: string): Promise<void>;
  
  // Product methods
  getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }): Promise<{ products: ProductWithCategory[]; total: number }>;
  getProductById(id: string): Promise<ProductWithCategory | null>;
  createProduct(product: ProductType): Promise<IProduct>;
  updateProduct(id: string, product: Partial<ProductType>): Promise<IProduct | null>;
  deleteProduct(id: string): Promise<void>;
  
  // Stock movement methods
  createStockMovement(movement: StockMovementType): Promise<IStockMovement>;
  getStockMovements(productId: string): Promise<IStockMovement[]>;
  
  // Dashboard methods
  getDashboardStats(): Promise<DashboardStats>;
  getRecentActivity(): Promise<any[]>;
}

export class MongoStorage implements IMongoStorage {
  async getUser(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    return await User.findOne({ firebaseUid });
  }

  async createUser(insertUser: UserType): Promise<IUser> {
    const user = new User(insertUser);
    return await user.save();
  }

  async updateUser(id: string, updateUser: Partial<UserType>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updateUser, { new: true });
  }

  async getCategories(): Promise<ICategory[]> {
    return await Category.find().sort({ name: 1 });
  }

  async getCategoryById(id: string): Promise<ICategory | null> {
    return await Category.findById(id);
  }

  async createCategory(insertCategory: CategoryType): Promise<ICategory> {
    const category = new Category(insertCategory);
    return await category.save();
  }

  async updateCategory(id: string, updateCategory: Partial<CategoryType>): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(id, updateCategory, { new: true });
  }

  async deleteCategory(id: string): Promise<void> {
    await Category.findByIdAndDelete(id);
  }

  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    status?: string;
  }): Promise<{ products: ProductWithCategory[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = '',
      status = ''
    } = params;
    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (categoryId) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    if (status === 'low_stock') {
      query.$expr = { $lt: ['$stockQuantity', '$minStockLevel'] };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('categoryId', 'name description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query)
    ]);

    const productsWithCategory = products.map(product => {
      const { categoryId, ...rest } = product;
      return {
        ...rest,
        id: product._id.toString(),
        category: categoryId as any,
      };
    });

    return { products: productsWithCategory, total };
  }

  async getProductById(id: string): Promise<ProductWithCategory | null> {
    const product = await Product.findById(id)
      .populate('categoryId', 'name description')
      .lean();

    if (!product) return null;

    return {
      ...product,
      id: product._id.toString(),
      categoryId: product.categoryId.toString(),
      category: product.categoryId as any,
    };
  }

  async createProduct(insertProduct: ProductType): Promise<IProduct> {
    const product = new Product({
      ...insertProduct,
      categoryId: new mongoose.Types.ObjectId(insertProduct.categoryId)
    });
    return await product.save();
  }

  async updateProduct(id: string, updateProduct: Partial<ProductType>): Promise<IProduct | null> {
    const updateData = { ...updateProduct };
    if (updateData.categoryId) {
      updateData.categoryId = new mongoose.Types.ObjectId(updateData.categoryId) as any;
    }
    return await Product.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteProduct(id: string): Promise<void> {
    await Product.findByIdAndDelete(id);
  }

  async createStockMovement(insertMovement: StockMovementType): Promise<IStockMovement> {
    const movement = new StockMovement({
      ...insertMovement,
      productId: new mongoose.Types.ObjectId(insertMovement.productId),
      userId: new mongoose.Types.ObjectId(insertMovement.userId)
    });
    return await movement.save();
  }

  async getStockMovements(productId: string): Promise<IStockMovement[]> {
    return await StockMovement.find({ productId: new mongoose.Types.ObjectId(productId) })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [totalProducts, totalCategories, lowStockItems, products] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments({ $expr: { $lt: ['$stockQuantity', '$minStockLevel'] } }),
      Product.find().select('price stockQuantity')
    ]);

    const totalValue = products.reduce((sum, product) => {
      return sum + (product.price * product.stockQuantity);
    }, 0);

    return {
      totalProducts,
      lowStockItems,
      totalValue: totalValue.toFixed(2),
      totalCategories,
    };
  }

  async getRecentActivity(): Promise<any[]> {
    const recentMovements = await StockMovement.find()
      .populate('productId', 'name sku')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return recentMovements.map(movement => ({
      id: movement._id.toString(),
      type: movement.type,
      productName: (movement.productId as any).name,
      productSku: (movement.productId as any).sku,
      quantity: movement.quantity,
      reason: movement.reason,
      userName: (movement.userId as any).name,
      createdAt: movement.createdAt,
    }));
  }
}

export const mongoStorage = new MongoStorage();