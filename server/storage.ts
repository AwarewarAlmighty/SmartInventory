import { User, Category, Product, StockMovement } from "@shared/schema";

export class MongoStorage {
  async getUser(id) {
    return await User.findById(id);
  }

  async getUserByEmail(email) {
    return await User.findOne({ email });
  }

  async getUserByFirebaseUid(firebaseUid) {
    return await User.findOne({ firebaseUid });
  }

  async createUser(user) {
    const newUser = new User(user);
    return await newUser.save();
  }

  async updateUser(id, user) {
    return await User.findByIdAndUpdate(id, user, { new: true });
  }

  async getCategories() {
    return await Category.find();
  }

  async getCategoryById(id) {
    return await Category.findById(id);
  }

  async createCategory(category) {
    const newCategory = new Category(category);
    return await newCategory.save();
  }

  async updateCategory(id, category) {
    return await Category.findByIdAndUpdate(id, category, { new: true });
  }

  async deleteCategory(id) {
    return await Category.findByIdAndDelete(id);
  }

  async getProducts(params) {
    const { page = 1, limit = 10, search, categoryId, status } = params;
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (status) {
      if (status === "low_stock") {
        query.stockQuantity = { $lte: "$minStockLevel" };
      } else if (status === "out_of_stock") {
        query.stockQuantity = 0;
      } else if (status === "in_stock") {
        query.stockQuantity = { $gt: "$minStockLevel" };
      }
    }
    const products = await Product.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("categoryId");
    const total = await Product.countDocuments(query);
    return { products, total };
  }

  async getProductById(id) {
    return await Product.findById(id).populate("categoryId");
  }

  async createProduct(product) {
    const newProduct = new Product(product);
    return await newProduct.save();
  }

  async updateProduct(id, product) {
    return await Product.findByIdAndUpdate(id, product, { new: true });
  }

  async deleteProduct(id) {
    return await Product.findByIdAndDelete(id);
  }

  async createStockMovement(movement) {
    const newMovement = new StockMovement(movement);
    return await newMovement.save();
  }

  async getStockMovements(productId) {
    return await StockMovement.find({ productId }).populate("userId");
  }

  async getDashboardStats() {
    const totalProducts = await Product.countDocuments();
    const lowStockItems = await Product.countDocuments({ stockQuantity: { $lte: "$minStockLevel" } });
    const totalValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$stockQuantity"] } },
        },
      },
    ]);
    const totalCategories = await Category.countDocuments();
    return {
      totalProducts,
      lowStockItems,
      totalValue: totalValue[0]?.total || 0,
      totalCategories,
    };
  }

  async getRecentActivity() {
    return await StockMovement.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("productId")
      .populate("userId");
  }
}

export const storage = new MongoStorage();