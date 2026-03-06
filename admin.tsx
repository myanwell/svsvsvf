import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Trash2, X, Megaphone, Users, GraduationCap, Settings, Plus, Gamepad2, Image, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user } = useApp();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [studentName, setStudentName] = useState("");
  const [studentGrade, setStudentGrade] = useState("");
  const [studentImage, setStudentImage] = useState<File | null>(null);
  
  const [teacherName, setTeacherName] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [teacherImage, setTeacherImage] = useState<File | null>(null);
  
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [gameDescription, setGameDescription] = useState("");
  const [gameUrl, setGameUrl] = useState("");
  const [gameOrientation, setGameOrientation] = useState<"portrait" | "landscape" | "both">("both");
  const [gameLogo, setGameLogo] = useState<File | null>(null);
  
  const [settingsForm, setSettingsForm] = useState({
    siteTitle: "",
    siteDescription: "",
    loginMessage: "",
    gameOrientation: "",
    postApprovalRequired: "",
  });
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: api.students.getAll });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: api.teachers.getAll });
  const { data: pictures = [] } = useQuery({ queryKey: ["pictures"], queryFn: api.pictures.getAll });
  const { data: games = [] } = useQuery({ queryKey: ["games"], queryFn: api.games.getAll });
  const { data: announcements = [] } = useQuery({ queryKey: ["announcements"], queryFn: api.announcements.getAll });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: api.settings.get });

  const addStudentMutation = useMutation({
    mutationFn: (data: { name: string; grade: string; image: File }) => api.students.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setStudentName("");
      setStudentGrade("");
      setStudentImage(null);
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: api.students.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });

  const addTeacherMutation = useMutation({
    mutationFn: (data: { name: string; subject: string; image: File }) => api.teachers.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setTeacherName("");
      setTeacherSubject("");
      setTeacherImage(null);
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: api.teachers.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] }),
  });

  const addGameMutation = useMutation({
    mutationFn: api.games.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      setGameTitle("");
      setGameDescription("");
      setGameUrl("");
      setGameOrientation("both");
      setGameLogo(null);
      toast({
        title: "Game added",
        description: "The game is now available in the Games page.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add game",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: api.games.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["games"] }),
  });

  const approvePictureMutation = useMutation({
    mutationFn: api.pictures.approve,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pictures"] }),
  });

  const deletePictureMutation = useMutation({
    mutationFn: api.pictures.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pictures"] }),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { siteTitle?: string; siteDescription?: string; loginMessage?: string; gameOrientation?: "portrait" | "landscape" | "both"; postApprovalRequired?: boolean; favicon?: File }) => 
      api.settings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSettingsForm({ siteTitle: "", siteDescription: "", loginMessage: "", gameOrientation: "", postApprovalRequired: "" });
      setFaviconFile(null);
      toast({
        title: "Settings Updated",
        description: "Your site settings have been successfully updated. Refresh the page to see changes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addAnnouncementMutation = useMutation({
    mutationFn: api.announcements.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setNewAnnouncement("");
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: api.announcements.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements"] }),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-center">
        <h1 className="text-4xl font-pixel text-destructive">ACCESS DENIED</h1>
        <p className="font-mono text-muted-foreground">You do not have clearance for this sector.</p>
        <Button onClick={() => setLocation("/")} variant="outline" className="pixel-corners">Return to Safety</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-pixel text-destructive drop-shadow-[0_0_5px_rgba(255,0,0,0.8)]">
          Command Center
        </h2>
        <div className="px-3 py-1 bg-destructive/20 border border-destructive text-destructive text-xs font-mono animate-pulse">
          ADMIN MODE ACTIVE
        </div>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-muted/50 p-1 rounded-none border border-primary/30">
          <TabsTrigger value="students" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-mono text-xs md:text-sm"><Users className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Students</span></TabsTrigger>
          <TabsTrigger value="teachers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-mono text-xs md:text-sm"><GraduationCap className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Teachers</span></TabsTrigger>
          <TabsTrigger value="pictures" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-mono text-xs md:text-sm"><Image className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Pics</span></TabsTrigger>
          <TabsTrigger value="games" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-mono text-xs md:text-sm"><Gamepad2 className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Games</span></TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-mono text-xs md:text-sm"><Settings className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">Settings</span></TabsTrigger>
          <TabsTrigger value="announcements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none font-mono text-xs md:text-sm"><Megaphone className="w-4 h-4 md:mr-2" /><span className="hidden md:inline">News</span></TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4 mt-6">
          <Card className="pixel-corners border-primary/30">
            <CardHeader><CardTitle className="font-futuristic">Add New Student</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student-name" className="font-mono text-xs">Name</Label>
                  <Input id="student-name" placeholder="Student name" value={studentName} onChange={e => setStudentName(e.target.value)} className="pixel-corners" data-testid="input-student-name" />
                </div>
                <div>
                  <Label htmlFor="student-grade" className="font-mono text-xs">Grade</Label>
                  <Input id="student-grade" placeholder="Grade level" value={studentGrade} onChange={e => setStudentGrade(e.target.value)} className="pixel-corners" data-testid="input-student-grade" />
                </div>
              </div>
              <div>
                <Label htmlFor="student-image" className="font-mono text-xs">Profile Image</Label>
                <Input id="student-image" type="file" accept="image/*" onChange={e => setStudentImage(e.target.files?.[0] || null)} className="pixel-corners" data-testid="input-student-image" />
              </div>
              <Button className="w-full bg-primary pixel-corners" onClick={() => {
                if(studentName && studentGrade && studentImage) {
                  addStudentMutation.mutate({ name: studentName, grade: studentGrade, image: studentImage });
                }
              }} data-testid="button-add-student">Add Student</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {students.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-4 bg-card border border-muted pixel-corners">
                <div className="flex items-center gap-4">
                  <img src={s.image} className="w-10 h-10 bg-muted" alt={s.name} />
                  <div>
                    <p className="font-bold font-futuristic">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">Grade: {s.grade}</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteStudentMutation.mutate(s.id)} className="pixel-corners" data-testid={`button-delete-student-${s.id}`}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4 mt-6">
          <Card className="pixel-corners border-secondary/30">
            <CardHeader><CardTitle className="font-futuristic text-secondary">Add New Teacher</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teacher-name" className="font-mono text-xs">Name</Label>
                  <Input id="teacher-name" placeholder="Teacher name" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="pixel-corners" data-testid="input-teacher-name" />
                </div>
                <div>
                  <Label htmlFor="teacher-subject" className="font-mono text-xs">Subject</Label>
                  <Input id="teacher-subject" placeholder="Subject" value={teacherSubject} onChange={e => setTeacherSubject(e.target.value)} className="pixel-corners" data-testid="input-teacher-subject" />
                </div>
              </div>
              <div>
                <Label htmlFor="teacher-image" className="font-mono text-xs">Profile Image</Label>
                <Input id="teacher-image" type="file" accept="image/*" onChange={e => setTeacherImage(e.target.files?.[0] || null)} className="pixel-corners" data-testid="input-teacher-image" />
              </div>
              <Button className="w-full bg-secondary text-background pixel-corners" onClick={() => {
                if(teacherName && teacherSubject && teacherImage) {
                  addTeacherMutation.mutate({ name: teacherName, subject: teacherSubject, image: teacherImage });
                }
              }} data-testid="button-add-teacher">Add Teacher</Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {teachers.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-card border border-muted pixel-corners">
                <div className="flex items-center gap-4">
                  <img src={t.image} className="w-10 h-10 bg-muted" alt={t.name} />
                  <div>
                    <p className="font-bold font-futuristic">{t.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{t.subject}</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteTeacherMutation.mutate(t.id)} className="pixel-corners" data-testid={`button-delete-teacher-${t.id}`}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pictures" className="space-y-4 mt-6">
          <h3 className="font-pixel text-lg text-accent">Pending Approval</h3>
          <div className="grid gap-4">
            {pictures.filter((p: any) => p.status === "pending").length === 0 && (
              <p className="text-muted-foreground font-mono italic">No pending pictures.</p>
            )}
            {pictures.filter((p: any) => p.status === "pending").map((p: any) => (
              <div key={p.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-accent pixel-corners gap-4">
                <div className="flex items-center gap-4">
                  <img src={`/${p.filePath}`} className="w-20 h-14 object-cover bg-muted" alt={p.caption} />
                  <div>
                    <p className="font-bold font-futuristic">{p.caption || "Untitled Post"}</p>
                    <p className="text-xs text-accent font-mono">By: {p.author}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    className="bg-green-600 hover:bg-green-700 pixel-corners flex-1 sm:flex-none"
                    onClick={() => approvePictureMutation.mutate(p.id)}
                    data-testid={`button-approve-picture-${p.id}`}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    className="pixel-corners flex-1 sm:flex-none"
                    onClick={() => deletePictureMutation.mutate(p.id)}
                    data-testid={`button-delete-pending-picture-${p.id}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="font-pixel text-lg text-muted-foreground mt-8">Approved Gallery</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pictures.filter((p: any) => p.status === "approved").map((p: any) => (
              <div key={p.id} className="relative group">
                <img src={`/${p.filePath}`} className="w-full aspect-square object-cover pixel-corners border border-muted" alt={p.caption} />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity pixel-corners h-6 w-6"
                  onClick={() => deletePictureMutation.mutate(p.id)}
                  data-testid={`button-delete-approved-picture-${p.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="games" className="space-y-4 mt-6">
          <Card className="pixel-corners border-accent/30">
            <CardHeader><CardTitle className="font-futuristic text-accent">Add New Game</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="game-title" className="font-mono text-xs">Title</Label>
                <Input
                  id="game-title"
                  placeholder="Game title"
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="pixel-corners"
                  data-testid="input-game-title"
                />
              </div>
              <div>
                <Label htmlFor="game-description" className="font-mono text-xs">Description</Label>
                <Textarea
                  id="game-description"
                  placeholder="Short game description"
                  value={gameDescription}
                  onChange={(e) => setGameDescription(e.target.value)}
                  className="pixel-corners font-mono"
                  data-testid="input-game-description"
                />
              </div>
              <div>
                <Label htmlFor="game-url" className="font-mono text-xs">Game URL</Label>
                <Input
                  id="game-url"
                  placeholder="https://example.com/game"
                  value={gameUrl}
                  onChange={(e) => setGameUrl(e.target.value)}
                  className="pixel-corners"
                  data-testid="input-game-url"
                />
              </div>
              <div>
                <Label htmlFor="game-logo" className="font-mono text-xs">Logo Image</Label>
                <Input
                  id="game-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setGameLogo(e.target.files?.[0] || null)}
                  className="pixel-corners"
                  data-testid="input-game-logo"
                />
              </div>
              <div>
                <Label htmlFor="game-orientation-add" className="font-mono text-xs">Game Orientation</Label>
                <select
                  id="game-orientation-add"
                  value={gameOrientation}
                  onChange={(e) => setGameOrientation(e.target.value as "portrait" | "landscape" | "both")}
                  className="w-full px-3 py-2 border border-input bg-background font-mono text-sm pixel-corners"
                  data-testid="select-game-orientation-add"
                >
                  <option value="both">Both (portrait on mobile, landscape on larger screens)</option>
                  <option value="portrait">Portrait only</option>
                  <option value="landscape">Landscape only</option>
                </select>
              </div>
              <Button
                className="w-full bg-accent text-background pixel-corners"
                onClick={() => {
                  if (!gameTitle || !gameDescription || !gameUrl || !gameLogo) return;
                  const formData = new FormData();
                  formData.append("title", gameTitle);
                  formData.append("description", gameDescription);
                  formData.append("gameUrl", gameUrl);
                  formData.append("gameOrientation", gameOrientation);
                  formData.append("logo", gameLogo);
                  addGameMutation.mutate(formData);
                }}
                data-testid="button-add-game"
              >
                Add Game
              </Button>
            </CardContent>
          </Card>

          <h3 className="font-pixel text-lg text-accent">Published Games</h3>
          <div className="grid gap-3">
            {games.length === 0 && (
              <p className="text-muted-foreground font-mono italic">No games published yet.</p>
            )}
            {games.map((g: any) => (
              <div key={g.id} className="flex items-center justify-between p-3 bg-card border border-muted pixel-corners gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={`/${g.logoPath}`} className="w-12 h-12 object-cover bg-muted rounded border border-primary/30" alt={g.title} />
                  <div className="min-w-0">
                    <p className="font-bold font-futuristic truncate">{g.title}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{g.gameUrl}</p>
                    <p className="text-xs text-muted-foreground font-mono">Orientation: {g.gameOrientation || "both"}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteGameMutation.mutate(g.id)}
                  className="pixel-corners"
                  data-testid={`button-delete-game-${g.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card className="pixel-corners border-accent/30">
            <CardHeader><CardTitle className="font-futuristic text-accent">Site Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site-title" className="font-mono text-xs">Site Title</Label>
                <Input 
                  id="site-title" 
                  placeholder={settings?.siteTitle || "ICT Canary"} 
                  value={settingsForm.siteTitle} 
                  onChange={e => setSettingsForm({...settingsForm, siteTitle: e.target.value})} 
                  className="pixel-corners" 
                  data-testid="input-site-title" 
                />
              </div>
              <div>
                <Label htmlFor="site-description" className="font-mono text-xs">Site Description</Label>
                <Textarea 
                  id="site-description" 
                  placeholder={settings?.siteDescription || "A futuristic pixel-style platform"} 
                  value={settingsForm.siteDescription} 
                  onChange={e => setSettingsForm({...settingsForm, siteDescription: e.target.value})} 
                  className="pixel-corners font-mono" 
                  data-testid="input-site-description" 
                />
              </div>
              <div>
                <Label htmlFor="login-message" className="font-mono text-xs">Login Message</Label>
                <Input 
                  id="login-message" 
                  placeholder={settings?.loginMessage || "Access the futuristic portal"} 
                  value={settingsForm.loginMessage} 
                  onChange={e => setSettingsForm({...settingsForm, loginMessage: e.target.value})} 
                  className="pixel-corners" 
                  data-testid="input-login-message" 
                />
              </div>
              <div>
                <Label htmlFor="favicon" className="font-mono text-xs">Favicon (PNG/ICO/SVG)</Label>
                <Input 
                  id="favicon" 
                  type="file" 
                  accept=".png,.ico,.svg" 
                  onChange={e => setFaviconFile(e.target.files?.[0] || null)} 
                  className="pixel-corners" 
                  data-testid="input-favicon" 
                />
                {settings?.faviconPath && (
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    Current: {settings.faviconPath}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="game-orientation" className="font-mono text-xs">Game Orientation</Label>
                <select
                  id="game-orientation"
                  value={settingsForm.gameOrientation || settings?.gameOrientation || "both"}
                  onChange={e => setSettingsForm({ ...settingsForm, gameOrientation: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background font-mono text-sm pixel-corners"
                  data-testid="select-game-orientation"
                >
                  <option value="both">Both (portrait on mobile, landscape on larger screens)</option>
                  <option value="portrait">Portrait only</option>
                  <option value="landscape">Landscape only</option>
                </select>
              </div>
              <div>
                <Label htmlFor="post-approval-required" className="font-mono text-xs">Post Approval</Label>
                <select
                  id="post-approval-required"
                  value={settingsForm.postApprovalRequired || String(settings?.postApprovalRequired ?? true)}
                  onChange={e => setSettingsForm({ ...settingsForm, postApprovalRequired: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background font-mono text-sm pixel-corners"
                  data-testid="select-post-approval-required"
                >
                  <option value="true">Required (admin must approve posts)</option>
                  <option value="false">Not required (auto-approve posts)</option>
                </select>
              </div>
              <Button 
                className="w-full bg-accent text-background pixel-corners" 
                onClick={() => {
                  const data: any = {};
                  data.siteTitle = settingsForm.siteTitle || settings?.siteTitle || "ICT Canary";
                  data.siteDescription = settingsForm.siteDescription || settings?.siteDescription || "A futuristic pixel-style platform for ICT Canary.";
                  data.loginMessage = settingsForm.loginMessage || settings?.loginMessage || "Access the futuristic portal";
                  data.gameOrientation = settingsForm.gameOrientation || settings?.gameOrientation || "both";
                  data.postApprovalRequired = settingsForm.postApprovalRequired
                    ? settingsForm.postApprovalRequired === "true"
                    : (settings?.postApprovalRequired ?? true);
                  if (faviconFile) data.favicon = faviconFile;
                  
                  updateSettingsMutation.mutate(data);
                }} 
                data-testid="button-update-settings"
              >
                Update Settings
              </Button>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-muted/30 border border-muted pixel-corners">
            <h3 className="font-futuristic text-sm mb-2">Current Settings</h3>
            <div className="space-y-2 font-mono text-xs">
              <div><span className="text-muted-foreground">Title:</span> {settings?.siteTitle || "ICT Canary"}</div>
              <div><span className="text-muted-foreground">Description:</span> {settings?.siteDescription || "A futuristic pixel-style platform for ICT Canary."}</div>
              <div><span className="text-muted-foreground">Login Message:</span> {settings?.loginMessage || "Access the futuristic portal"}</div>
              <div><span className="text-muted-foreground">Game Orientation:</span> {settings?.gameOrientation || "both"}</div>
              <div><span className="text-muted-foreground">Post Approval:</span> {(settings?.postApprovalRequired ?? true) ? "Required" : "Not required"}</div>
              <div><span className="text-muted-foreground">Favicon:</span> {settings?.faviconPath || "Default"}</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4 mt-6">
          <div className="flex gap-2">
            <Input 
              placeholder="New System Announcement..." 
              value={newAnnouncement} 
              onChange={e => setNewAnnouncement(e.target.value)} 
              className="pixel-corners font-mono"
              data-testid="input-announcement"
            />
            <Button onClick={() => {
              if(newAnnouncement) addAnnouncementMutation.mutate({ text: newAnnouncement });
            }} className="pixel-corners bg-primary" data-testid="button-add-announcement"><Plus className="w-4 h-4" /></Button>
          </div>

          <div className="space-y-2">
            {announcements.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 pixel-corners">
                <span className="font-mono text-sm">{a.text}</span>
                <Button variant="ghost" size="sm" onClick={() => deleteAnnouncementMutation.mutate(a.id)} className="text-destructive" data-testid={`button-delete-announcement-${a.id}`}><X className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
