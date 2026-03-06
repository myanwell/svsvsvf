import { Link, useLocation } from "wouter";
import { Home, Users, GraduationCap, Gamepad2, MessageCircle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/store";

export function BottomNav() {
  const [location] = useLocation();
  const { user } = useApp();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: Users, label: "Students", href: "/students" },
    { icon: GraduationCap, label: "Teachers", href: "/teachers" },
    { icon: Gamepad2, label: "Games", href: "/games" },
    { icon: MessageCircle, label: "Chat", href: "/chat" },
  ];

  // Add Admin link if user is admin
  if (user?.role === "admin") {
    navItems.push({ icon: Settings, label: "Admin", href: "/adminable" });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-t-2 border-primary/50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2 max-w-md mx-auto md:max-w-full">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                isActive ? "text-secondary drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]" : "text-muted-foreground hover:text-primary"
              )}
              aria-label={item.label}
              title={item.label}
            >
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
