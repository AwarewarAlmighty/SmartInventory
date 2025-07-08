import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { mongoStorage } from "./mongodb-storage";
import { fallbackStorage } from "./fallback-storage";
import mongoose from "mongoose";

// Use MongoDB storage (fallback will be used if connection fails)
const getStorage = () => mongoose.connection.readyState === 1 ? mongoStorage : fallbackStorage;
import { authenticateToken, requireAdmin, generateToken } from "./middleware/auth";
import { loginSchema, registerSchema, insertProductSchema, insertCategorySchema } from "@shared/mongodb-schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await getStorage().getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await getStorage().createUser({
        email,
        password: hashedPassword,
        name,
        role: "user",
      });

      const token = generateToken(user._id.toString());
      
      res.status(201).json({
        message: "User created successfully",
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await getStorage().getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user._id.toString());
      
      res.json({
        message: "Login successful",
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google OAuth route
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken, email, name } = req.body;
      
      if (!idToken || !email || !name) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // For development, we'll use the actual user data from Firebase
      // In production, you would verify the Firebase token properly
      
      // Check if user exists by email first
      let user = await getStorage().getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google OAuth
        user = await getStorage().createUser({
          email,
          name,
          firebaseUid: `firebase_${email}_${Date.now()}`, // Unique identifier
          provider: "google",
          role: "user",
        });
      } else if (!user.firebaseUid) {
        // Update existing user to link with Google OAuth
        user = await getStorage().updateUser(user._id.toString(), {
          firebaseUid: `firebase_${email}_${Date.now()}`,
          provider: "google",
        });
      }

      const token = generateToken(user._id.toString());
      
      res.json({
        message: "Google login successful",
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (error) {
      console.error("Google login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    try {
      const user = await getStorage().getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        user: { id: user._id.toString(), email: user.email, name: user.name, role: user.role },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Category routes
  app.get("/api/categories", authenticateToken, async (req, res) => {
    try {
      const categories = await getStorage().getCategories();
      res.json(categories.map(cat => ({ ...cat, id: cat._id.toString() })));
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await getStorage().createCategory(data);
      res.status(201).json({ ...category, id: category._id.toString() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await getStorage().updateCategory(req.params.id, data);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ ...category, id: category._id.toString() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await getStorage().deleteCategory(req.params.id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (req, res) => {
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

  app.get("/api/products/:id", authenticateToken, async (req, res) => {
    try {
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

  app.post("/api/products", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await getStorage().createProduct(data);
      res.status(201).json({ ...product, id: product._id.toString() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const product = await getStorage().updateProduct(req.params.id, data);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ ...product, id: product._id.toString() });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await getStorage().deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await getStorage().getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/activity", authenticateToken, async (req, res) => {
    try {
      const activity = await getStorage().getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Get recent activity error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stock movement routes
  app.post("/api/stock-movements", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = req.body;
      data.userId = req.user.userId;
      
      const movement = await getStorage().createStockMovement(data);
      res.status(201).json({ ...movement, id: movement._id.toString() });
    } catch (error) {
      console.error("Create stock movement error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/stock-movements/:productId", authenticateToken, async (req, res) => {
    try {
      const movements = await getStorage().getStockMovements(req.params.productId);
      res.json(movements.map(movement => ({ ...movement, id: movement._id.toString() })));
    } catch (error) {
      console.error("Get stock movements error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return createServer(app);
}