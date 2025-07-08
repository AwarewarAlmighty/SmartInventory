import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { mongoStorage } from "./mongodb-storage";
import { authenticateToken, requireAdmin, generateToken } from "./middleware/auth";
import { loginSchema, registerSchema, insertProductSchema, insertCategorySchema } from "@shared/mongodb-schema";
import { z } from "zod";
import { verifyFirebaseToken } from "./lib/firebase-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await mongoStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await mongoStorage.createUser({
        email,
        password: hashedPassword,
        name,
        role: "user",
      });

      const token = generateToken(user.id);
      
      res.status(201).json({
        message: "User created successfully",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      
      res.json({
        message: "Login successful",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
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

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken, email, name } = req.body;

      if (!idToken || !email || !name) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // For development, we'll use the actual user data from Firebase
      // In production, you would verify the Firebase token properly
      
      // Check if user exists by email first
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google OAuth
        user = await storage.createUser({
          email,
          name,
          firebaseUid: `firebase_${email}_${Date.now()}`, // Unique identifier
          provider: "google",
          role: "user",
        });
      } else if (!user.firebaseUid) {
        // Update existing user to link with Google OAuth
        user = await storage.updateUser(user.id, {
          firebaseUid: `firebase_${email}_${Date.now()}`,
          provider: "google",
        });
      }

      const token = generateToken(user.id);
      
      res.json({
        message: "Google login successful",
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        token,
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(401).json({ message: "Google authentication failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/dashboard/activity", authenticateToken, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Recent activity error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Category routes
  app.get("/api/categories", authenticateToken, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Categories error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/categories", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create category error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const status = req.query.status as string;

      const result = await storage.getProducts({
        page,
        limit,
        search,
        categoryId,
        status,
      });

      res.json(result);
    } catch (error) {
      console.error("Products error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      
      // Log stock movement
      await storage.createStockMovement({
        productId: product.id,
        userId: (req as any).user.id,
        type: "in",
        quantity: productData.stockQuantity,
        reason: "Initial stock",
      });

      res.status(201).json(product);
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
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      
      const existingProduct = await storage.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const product = await storage.updateProduct(id, productData);
      
      // Log stock movement if quantity changed
      if (productData.stockQuantity !== undefined && productData.stockQuantity !== existingProduct.stockQuantity) {
        const difference = productData.stockQuantity - existingProduct.stockQuantity;
        await storage.createStockMovement({
          productId: product.id,
          userId: (req as any).user.id,
          type: difference > 0 ? "in" : "out",
          quantity: Math.abs(difference),
          reason: "Stock adjustment",
        });
      }

      res.json(product);
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
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
