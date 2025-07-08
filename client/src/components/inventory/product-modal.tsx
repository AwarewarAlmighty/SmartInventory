import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProductWithCategory } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductWithCategory | null;
}

export default function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    stockQuantity: "",
    minStockLevel: "",
    categoryId: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", `/api/products/${product?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        price: product.price,
        stockQuantity: product.stockQuantity.toString(),
        minStockLevel: product.minStockLevel.toString(),
        categoryId: product.categoryId.toString(),
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        description: "",
        price: "",
        stockQuantity: "",
        minStockLevel: "",
        categoryId: "",
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      stockQuantity: parseInt(formData.stockQuantity),
      minStockLevel: parseInt(formData.minStockLevel),
      categoryId: parseInt(formData.categoryId),
    };

    if (product) {
      updateProductMutation.mutate(data);
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="Enter SKU"
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleChange("categoryId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => handleChange("stockQuantity", e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div>
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                value={formData.minStockLevel}
                onChange={(e) => handleChange("minStockLevel", e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save size={16} className="mr-2" />
              {createProductMutation.isPending || updateProductMutation.isPending
                ? "Saving..."
                : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
