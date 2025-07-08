import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

const pageTitles = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/inventory": "Inventory Management",
  "/categories": "Categories",
  "/users": "User Management",
  "/settings": "Settings",
};

export default function Header() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const currentTitle = pageTitles[location as keyof typeof pageTitles] || "Dashboard";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">{currentTitle}</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative p-2 text-gray-400 hover:text-gray-600"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
