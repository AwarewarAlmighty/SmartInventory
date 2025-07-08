import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { mongoStorage } from '../server/mongodb-storage';
import { fallbackStorage } from '../server/fallback-storage';
import { authenticateToken, requireAdmin } from '../server/middleware/auth';
import { insertProductSchema } from '../shared/mongodb-schema';

// Helper function to get the appropriate storage
const getStorage = () => mongoose.connection.readyState === 1 ? mongoStorage : fallbackStorage;

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering and pagination
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const categoryId = req.query.categoryId as string || "";
    const status = req.query.status as string || "";

    const result = await getStorage().getProducts({
      page,
      limit,
      search,
      categoryId,
      status,
    });
console.log(mongoose.connection.readyState);
    res.json({
      products: result.products.map(product => ({
        ...product,
        id: product._id?.toString() || product.id,
      })),
      total: result.total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by its ID
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await getStorage().getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ ...product, id: product._id?.toString() || product.id });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = insertProductSchema.parse(req.body);
    const product = await getStorage().createProduct(data);
    res.status(201).json({ ...product.toObject(), id: product._id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid input", errors: error.errors });
    }
    console.error("Create product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product
 * @access  Admin
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      const data = insertProductSchema.partial().parse(req.body);
      const product = await getStorage().updateProduct(req.params.id, data);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ ...product.toObject(), id: product._id.toString() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await getStorage().getProductById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    await getStorage().deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
