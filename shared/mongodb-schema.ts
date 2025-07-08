import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'user' | 'admin';
  firebaseUid?: string;
  provider?: 'local' | 'google';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  firebaseUid: { type: String },
  provider: { type: String, enum: ['local', 'google'], default: 'local' },
}, {
  timestamps: true,
});

// Category Schema
export interface ICategory extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
}, {
  timestamps: true,
});

// Product Schema
export interface IProduct extends Document {
  name: string;
  sku: string;
  description?: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  categoryId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  stockQuantity: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, required: true, default: 0 },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
}, {
  timestamps: true,
});

// Stock Movement Schema
export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['in', 'out', 'adjustment'], required: true },
  quantity: { type: Number, required: true },
  reason: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

// Export models
export const User = mongoose.model<IUser>('User', userSchema);
export const Category = mongoose.model<ICategory>('Category', categorySchema);
export const Product = mongoose.model<IProduct>('Product', productSchema);
export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().min(1),
  role: z.enum(['user', 'admin']).default('user'),
  firebaseUid: z.string().optional(),
  provider: z.enum(['local', 'google']).default('local'),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  stockQuantity: z.number().min(0).default(0),
  minStockLevel: z.number().min(0).default(0),
  categoryId: z.string(),
});

export const insertStockMovementSchema = z.object({
  productId: z.string(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number(),
  reason: z.string().optional(),
  userId: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

// Type definitions
export type UserType = z.infer<typeof insertUserSchema>;
export type CategoryType = z.infer<typeof insertCategorySchema>;
export type ProductType = z.infer<typeof insertProductSchema>;
export type StockMovementType = z.infer<typeof insertStockMovementSchema>;

export type ProductWithCategory = IProduct & {
  category: ICategory;
};

export type DashboardStats = {
  totalProducts: number;
  lowStockItems: number;
  totalValue: string;
  totalCategories: number;
};