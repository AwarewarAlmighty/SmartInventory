import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Package, AlertTriangle, DollarSign, Tags } from "lucide-react";
import { DashboardStats } from "@shared/schema";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-blue-500",
      change: "+12%",
      changeLabel: "from last month",
    },
    {
      title: "Low Stock Items",
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      color: "bg-orange-500",
      change: "+3",
      changeLabel: "from yesterday",
    },
    {
      title: "Total Value",
      value: stats?.totalValue || "$0",
      icon: DollarSign,
      color: "bg-green-500",
      change: "+8%",
      changeLabel: "from last month",
    },
    {
      title: "Categories",
      value: stats?.totalCategories || 0,
      icon: Tags,
      color: "bg-purple-500",
      change: "+2",
      changeLabel: "new this month",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">{card.change}</span>
                <span className="text-gray-600 text-sm ml-2">{card.changeLabel}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
