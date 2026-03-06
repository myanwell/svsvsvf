import { useApp } from "@/lib/store";
import { Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/generated_images/pixel_art_canary_bird_logo.png";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TopBar() {
  const { user, logout } = useApp();
  const { data: announcementsData } = useQuery({
    queryKey: ["announcements"],
    queryFn: api.announcements.getAll,
  });

  const announcements = announcementsData || [];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-background/95 backdrop-blur shadow-lg">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
            <Link href="/">
              <img src={logo} alt="Logo" className="w-10 h-10 pixel-corners border border-secondary/50" />
            </Link>
            <h1 className="text-xl font-pixel text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary drop-shadow-[0_0_5px_rgba(191,0,255,0.5)]">
            ICT Canary
            </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors" data-testid="link-profile-desktop">
                  <Avatar className="w-8 h-8 border-2 border-primary/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground leading-tight" data-testid="text-user-name">{user.name}</span>
                    {user.email && (
                      <span className="text-[10px] text-muted-foreground leading-tight" data-testid="text-user-email">{user.email}</span>
                    )}
                  </div>
                </div>
              </Link>
              <Link href="/dashboard">
                <Avatar className="sm:hidden w-8 h-8 border-2 border-primary/30 cursor-pointer hover:border-primary/60 transition-colors" data-testid="link-profile-mobile">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button 
                data-testid="button-logout"
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          ) : (
             <span className="text-xs font-mono text-muted-foreground">Guest Mode</span>
          )}
        </div>
      </div>

      {announcements.length > 0 && (
        <div className="bg-primary/10 overflow-hidden h-8 flex items-center relative">
          <div className="absolute left-2 z-10 text-primary">
            <Bell className="w-4 h-4 animate-pulse" />
          </div>
          <div className="whitespace-nowrap animate-infinite-scroll pl-10 flex gap-8 text-xs font-mono text-primary-foreground/90 w-full">
             {announcements.map((announcement: any, i: number) => (
               <span key={i} className="inline-flex items-center gap-2">
                 <span className="text-secondary">:::</span> {announcement.text}
               </span>
             ))}
          </div>
        </div>
      )}
    </header>
  );
}
