import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type GamePlayerProps = {
  params: {
    id: string;
  };
};

export default function GamePlayer({ params }: GamePlayerProps) {
  const frameContainerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: api.games.getAll,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings.get,
  });

  const game = games.find((g: any) => g.id === params.id);
  const gameOrientation = game?.gameOrientation || settings?.gameOrientation || "both";
  const frameContainerClass =
    gameOrientation === "portrait"
      ? "max-w-sm mx-auto aspect-[9/16]"
      : gameOrientation === "landscape"
        ? "w-full aspect-video"
        : "w-full max-w-sm md:max-w-none mx-auto aspect-[9/16] md:aspect-video";

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      const container = frameContainerRef.current;
      if (!container) return;

      const elementWithFullscreen = container as HTMLDivElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };

      if (container.requestFullscreen) {
        await container.requestFullscreen();
      } else if (elementWithFullscreen.webkitRequestFullscreen) {
        await elementWithFullscreen.webkitRequestFullscreen();
      } else if (elementWithFullscreen.msRequestFullscreen) {
        await elementWithFullscreen.msRequestFullscreen();
      }
      return;
    }

    const docWithFullscreen = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      msExitFullscreen?: () => Promise<void> | void;
    };

    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (docWithFullscreen.webkitExitFullscreen) {
      await docWithFullscreen.webkitExitFullscreen();
    } else if (docWithFullscreen.msExitFullscreen) {
      await docWithFullscreen.msExitFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <Card className="pixel-corners border-accent/30">
        <CardContent className="p-6 space-y-4 text-center">
          <p className="font-mono text-muted-foreground">Game not found.</p>
          <Link href="/games">
            <Button className="pixel-corners">Back to Games</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pixel-corners border-accent/40">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-futuristic flex items-center gap-2">
            <img
              src={`/${game.logoPath}`}
              alt={game.title}
              className="w-8 h-8 object-cover rounded border border-primary/30"
            />
            {game.title}
          </CardTitle>
          <Link href="/games">
            <Button variant="outline" className="pixel-corners">Back</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground font-mono">{game.description}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground font-mono">
            Preferred orientation: {gameOrientation}
          </p>
          <Button
            type="button"
            variant="outline"
            className="pixel-corners"
            onClick={toggleFullscreen}
            data-testid="button-toggle-fullscreen"
          >
            {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          </Button>
        </div>
        <div
          ref={frameContainerRef}
          className={`relative border border-primary/30 pixel-corners bg-black overflow-hidden ${isFullscreen ? "w-screen h-screen max-w-none aspect-auto" : frameContainerClass}`}
        >
          <iframe
            src={game.gameUrl}
            title={game.title}
            className="absolute inset-0 w-full h-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="fullscreen; autoplay"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  );
}
