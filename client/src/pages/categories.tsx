import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  return (
    <Card className="shadow-sm border border-gray-200 max-w-5xl mx-auto mt-6">
      <CardHeader className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800"> Categories</h3>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {isLoading ? (
          <p className="text-gray-500">Loading categories...</p>
        ) : categories.length === 0 ? (
          <p className="text-gray-500">No categories found.</p>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {/* <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">ID</th> */}
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Description</th>
              </tr>
            </thead>
           <tbody className="divide-y divide-gray-200">
            {categories.map((cat: any) => (
                <tr key={cat._id} className="hover:bg-gray-50">
                {/* You said you don’t want to show ID, so just remove this cell */}
                {/* <td className="px-4 py-3 text-sm text-gray-900">{cat._id}</td> */}

                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {cat.name || "No name"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                    {cat.description || "No description"}
                </td>
                </tr>
            ))}
            </tbody>

          </table>
        )}
      </CardContent>
    </Card>
  );
}
