import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { 
  Package, 
  BarChart3, 
  Box, 
  Tags, 
  Users, 
  Settings, 
  LogOut 
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Inventory", href: "/inventory", icon: Box },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Inventory</h1>
            <p className="text-sm text-gray-600">Manager</p>
          </div>
        </div>
      </div>

      <nav className="mt-6">
        <div className="px-6 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Main
          </h3>
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (location === "/" && item.href === "/dashboard");
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={`nav-item ${isActive ? "active" : ""}`}>
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
