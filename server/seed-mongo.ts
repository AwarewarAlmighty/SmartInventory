import { connectMongoDB } from "./mongodb";
import { Category, Product } from "../shared/mongodb-schema";

async function seedDatabase() {
  await connectMongoDB();

  // Create categories
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and components' },
    { name: 'Clothing', description: 'Apparel and fashion items' },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
    { name: 'Sports', description: 'Sports equipment and accessories' },
    { name: 'Books', description: 'Books and educational materials' }
  ];

  // Insert categories
  const categoryDocs = await Category.insertMany(categories);
  console.log('Categories created:', categoryDocs.length);

  // Create products
  const products = [
    {
      name: 'iPhone 13',
      sku: 'IPHONE13-128',
      description: 'Apple iPhone 13 with 128GB storage',
      price: 699.99,
      stockQuantity: 25,
      minStockLevel: 5,
      categoryId: categoryDocs[0]._id
    },
    {
      name: 'MacBook Pro',
      sku: 'MBP-M1-512',
      description: 'MacBook Pro with M1 chip and 512GB SSD',
      price: 1299.99,
      stockQuantity: 8,
      minStockLevel: 3,
      categoryId: categoryDocs[0]._id
    },
    {
      name: 'Wireless Headphones',
      sku: 'WH-1000XM4',
      description: 'Sony WH-1000XM4 Noise Canceling Headphones',
      price: 249.99,
      stockQuantity: 15,
      minStockLevel: 10,
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
      name: 'Jeans Slim Fit',
      sku: 'JEANS-SLIM-32',
      description: 'Slim fit jeans size 32',
      price: 79.99,
      stockQuantity: 30,
      minStockLevel: 15,
      categoryId: categoryDocs[1]._id
    },
    {
      name: 'Garden Hose',
      sku: 'HOSE-50FT',
      description: '50 feet garden hose with nozzle',
      price: 45.99,
      stockQuantity: 12,
      minStockLevel: 5,
      categoryId: categoryDocs[2]._id
    },
    {
      name: 'Basketball',
      sku: 'BALL-BASK-OFF',
      description: 'Official size basketball',
      price: 39.99,
      stockQuantity: 22,
      minStockLevel: 10,
      categoryId: categoryDocs[3]._id
    },
    {
      name: 'Programming Book',
      sku: 'BOOK-JS-2023',
      description: 'JavaScript: The Complete Guide 2023',
      price: 49.99,
      stockQuantity: 35,
      minStockLevel: 15,
      categoryId: categoryDocs[4]._id
    }
  ];

  // Insert products
  const productDocs = await Product.insertMany(products);
  console.log('Products created:', productDocs.length);

  console.log('Database seeded successfully!');
  process.exit(0);
}

seedDatabase().catch(console.error);