import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/activity"],
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "in":
        return <Plus className="text-green-600" size={20} />;
      case "out":
        return <Edit className="text-blue-600" size={20} />;
      case "adjustment":
        return <AlertTriangle className="text-orange-600" size={20} />;
      default:
        return <Plus className="text-gray-600" size={20} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "in":
        return "bg-green-50";
      case "out":
        return "bg-blue-50";
      case "adjustment":
        return "bg-orange-50";
      default:
        return "bg-gray-50";
    }
  };

  const getActivityLabel = (type: string, quantity: number) => {
    switch (type) {
      case "in":
        return `Added ${quantity} items`;
      case "out":
        return `Removed ${quantity} items`;
      case "adjustment":
        return `Adjusted stock by ${quantity}`;
      default:
        return `Stock movement: ${quantity}`;
    }
  };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            activity.map((item: any) => (
              <div key={item.id} className="flex items-center space-x-4">
                <div className={`w-10 h-10 ${getActivityColor(item.type)} rounded-lg flex items-center justify-center`}>
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {getActivityLabel(item.type, item.quantity)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {item.product?.name} - {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
