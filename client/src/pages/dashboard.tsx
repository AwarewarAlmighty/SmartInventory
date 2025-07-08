import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivity from "@/components/dashboard/recent-activity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        
        <Card className="shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Electronics</span>
                </div>
                <span className="text-sm text-gray-600">45%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Clothing</span>
                </div>
                <span className="text-sm text-gray-600">28%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-orange-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Home & Garden</span>
                </div>
                <span className="text-sm text-gray-600">18%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Sports</span>
                </div>
                <span className="text-sm text-gray-600">9%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
