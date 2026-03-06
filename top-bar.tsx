import { useApp } from "@/lib/store";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/generated_images/pixel_art_canary_bird_logo.png";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TopBar() {
  const { user, logout } = useApp();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-background/95 backdrop-blur shadow-lg">
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
            <Link href="/">
              <img src={logo} alt="Logo" className="w-10 h-10 pixel-corners border border-secondary/50" />
            </Link>
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
    </header>
  );
}
