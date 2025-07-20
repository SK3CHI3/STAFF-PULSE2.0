import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SimpleThemeToggle } from "@/components/theme/ThemeToggle";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Building,
  Activity,
  Shield,
  LogOut,
  Bell,
  Search,
  Brain,
  CreditCard,
  FileText
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  active?: boolean;
}

interface ModernSidebarProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  onSettingsClick?: () => void;
  userInfo?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  logo?: {
    text: string;
    subtitle?: string;
  };
}

export const ModernSidebar = ({
  items,
  activeItem,
  onItemClick,
  onSettingsClick,
  userInfo = {
    name: "John Doe",
    email: "john@company.com",
    role: "Administrator"
  },
  logo = {
    text: "StaffPulse",
    subtitle: "Kenya"
  }
}: ModernSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-screen transition-all duration-300 ease-in-out border-r",
      "bg-gradient-to-b from-background via-background/95 to-background",
      "dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
      "border-border/50 dark:border-slate-700/50",
      "text-foreground dark:text-white",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 dark:border-slate-700/50">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {logo.text}
              </h2>
              {logo.subtitle && (
                <p className="text-xs text-muted-foreground">{logo.subtitle}</p>
              )}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5 h-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border/50 dark:border-slate-700/50">
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="flex-1 text-muted-foreground hover:text-foreground hover:bg-accent">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent p-2">
              <Bell className="w-4 h-4" />
            </Button>
            <SimpleThemeToggle />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full justify-start text-left transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-foreground dark:text-white border border-blue-500/30 shadow-lg"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                isCollapsed ? "px-2" : "px-3"
              )}
            >
              <Icon className={cn("w-5 h-5", isCollapsed ? "" : "mr-3")} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50 dark:border-slate-700/50">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10 border-2 border-border dark:border-slate-600">
                <AvatarImage src={userInfo.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  {userInfo.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground dark:text-white truncate">{userInfo.name}</p>
                <p className="text-xs text-muted-foreground truncate">{userInfo.role}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={onSettingsClick}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent p-2">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <Avatar className="w-8 h-8 mx-auto border-2 border-border dark:border-slate-600">
              <AvatarImage src={userInfo.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                {userInfo.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-accent p-1.5">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Predefined navigation items for different dashboard types
export const hrDashboardItems: SidebarItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    active: true
  },
  {
    id: "employee-management",
    label: "Employee Management",
    icon: Users,
  },
  {
    id: "checkins",
    label: "Send Check-ins",
    icon: MessageSquare,
  },
  {
    id: "reports",
    label: "Team Reports",
    icon: FileText,
    badge: "12"
  },
  {
    id: "analytics",
    label: "Team Analytics",
    icon: BarChart3,
  },
  {
    id: "ai-insights",
    label: "AI Insights",
    icon: Brain,
    badge: "New"
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
  },
  {
    id: "feedback",
    label: "Send Feedback",
    icon: Shield,
  }
];

export const adminDashboardItems: SidebarItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    active: true
  },
  {
    id: "organizations",
    label: "Organizations",
    icon: Building,
    badge: "51"
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: MessageSquare,
    badge: "8"
  },
  {
    id: "system",
    label: "System Health",
    icon: Activity,
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
  }
];
