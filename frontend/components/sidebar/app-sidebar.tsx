import {
  Book,
  ChevronUp,
  Home,
  Settings,
  User2,
  Waves,
  Package,
  ShieldCheck,
  LogOut,
  LogIn,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/auth";
import SidebarSignIn from "@/components/auth/sidebar-sign-in";
import { SidebarSignOut } from "@/components/auth/sidebar-sign-out";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Asceticisms",
    url: "/asceticisms",
    icon: Waves,
  },
  {
    title: "Browse Packages",
    url: "/packages",
    icon: Package,
  },
  {
    title: "Daily Readings",
    url: "/daily-readings",
    icon: Book,
  },
  // {
  //   title: "Search",
  //   url: "/search",
  //   icon: Search,
  // },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const adminItems = [
  {
    title: "Admin Panel",
    url: "/admin",
    icon: ShieldCheck,
  },
  {
    title: "Manage Practices",
    url: "/admin/asceticisms",
    icon: Waves,
  },
  {
    title: "Manage Packages",
    url: "/admin/packages",
    icon: Package,
  },
];

export default async function AppSidebar() {
  const session = await auth();
  const user = session?.user;
  const username = user?.name || "Guest";
  const userEmail = user?.email;
  const userImage = user?.image;
  const isAdmin = user?.role === "ADMIN";

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={userImage || undefined}
                        alt={username}
                      />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{username}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side="top"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuItem asChild>
                    <a href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-1">
                    <SidebarSignOut />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <SidebarMenuButton size="lg" asChild>
                <div className="w-full">
                  <SidebarSignIn />
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
