import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { ProductWithCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductModal from "./product-modal";

interface ProductsResponse {
  products: ProductWithCategory[];
  total: number;
}

export default function ProductTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ["/api/products", { page, search, categoryFilter, statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await fetch(`/api/products?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (product: ProductWithCategory) => {
    if (product.stockQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (product.stockQuantity <= product.minStockLevel) {
      return <Badge className="bg-orange-100 text-orange-800">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const handleEdit = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const totalPages = Math.ceil((productsData?.total || 0) / 10);

  return (
    <>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Products</h3>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus size={20} className="mr-2" />
              Add Product
            </Button>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                          <div className="ml-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </td>
                    </tr>
                  ))
                ) : productsData?.products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  productsData?.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 font-medium">
                              {product.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-blue-100 text-blue-800">
                          {product.category?.name || "No Category"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stockQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((page - 1) * 10 + 1, productsData?.total || 0)}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(page * 10, productsData?.total || 0)}
                </span>{" "}
                of <span className="font-medium">{productsData?.total || 0}</span> results
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    variant={page === i + 1 ? "default" : "outline"}
                    size="sm"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={editingProduct}
      />
    </>
  );
}
