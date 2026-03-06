import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import multer from "multer";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import * as schema from "@shared/schema";

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      role: string;
      googleId?: string;
      email?: string;
      avatar?: string;
    }
  }
}

function setupPassport() {
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    (process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
      : 'http://localhost:5000/api/auth/google/callback');

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (!user) {
            user = await storage.createUser({
              googleId: profile.id,
              name: profile.displayName || "Google User",
              email: profile.emails?.[0]?.value,
              avatar: profile.photos?.[0]?.value,
              role: "user",
            });
          }
          
          return done(null, {
            id: user.id,
            name: user.name,
            role: user.role,
            googleId: user.googleId ?? undefined,
            email: user.email ?? undefined,
            avatar: user.avatar ?? undefined,
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      if (id === "guest") {
        return done(null, { id: "guest", name: "Guest User", role: "guest" });
      }
      if (id === "admin") {
        return done(null, { id: "admin", name: "Canary-Admin", role: "admin" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, {
        id: user.id,
        name: user.name,
        role: user.role,
        googleId: user.googleId ?? undefined,
        email: user.email ?? undefined,
        avatar: user.avatar ?? undefined,
      });
    } catch (error) {
      done(error);
    }
  });
}

const pictureStorage = multer.diskStorage({
  destination: "uploads/pictures/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const gameStorage = multer.diskStorage({
  destination: "uploads/games/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const messageStorage = multer.diskStorage({
  destination: "uploads/messages/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const storyStorage = multer.diskStorage({
  destination: "uploads/stories/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const studentStorage = multer.diskStorage({
  destination: "uploads/students/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const teacherStorage = multer.diskStorage({
  destination: "uploads/teachers/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const faviconStorage = multer.diskStorage({
  destination: "client/public/",
  filename: (_req, file, cb) => {
    cb(null, "favicon" + path.extname(file.originalname));
  },
});

const uploadPicture = multer({
  storage: pictureStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

const uploadGame = multer({
  storage: gameStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed for game logos!"));
  },
});

const uploadMessage = multer({
  storage: messageStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|doc|docx|xls|xlsx|ppt|pptx|zip|mp4|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const safeMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip',
      'video/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    const mimetype = safeMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File type not allowed. Only images, documents, and safe media files are permitted."));
  },
});

const uploadStory = multer({
  storage: storyStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|mp4)$/i;
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4'];
    const extname = allowedExtensions.test(file.originalname.toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG, PNG, GIF, WEBP images and MP4 videos are allowed for stories!"));
  },
});

const uploadStudent = multer({
  storage: studentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

const uploadTeacher = multer({
  storage: teacherStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

const uploadFavicon = multer({
  storage: faviconStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /png|ico|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /image\/(png|x-icon|svg\+xml)/.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only PNG, ICO, or SVG files are allowed for favicon!"));
  },
});

const directMessageStorage = multer.diskStorage({
  destination: "uploads/direct-messages/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadDirectMessage = multer({
  storage: directMessageStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|txt|doc|docx|xls|xlsx|ppt|pptx|zip|mp4|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const safeMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/zip', 'video/mp4', 'audio/mpeg', 'audio/wav'
    ];
    const mimetype = safeMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("File type not allowed."));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const uploadDirs = [
    "uploads/pictures",
    "uploads/games",
    "uploads/messages",
    "uploads/stories",
    "uploads/students",
    "uploads/teachers",
    "uploads/direct-messages",
  ];
  uploadDirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

  setupPassport();

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });
  app.use("/uploads", (await import("express")).static("uploads"));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "ict-canary-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.post("/api/auth/guest", (req, res) => {
    req.login({ id: "guest", name: "Guest User", role: "guest" } as any, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      res.json({ user: req.user });
    });
  });

  app.post("/api/auth/admin", (req, res) => {
    const { username, password } = req.body;
    
    if (username !== "Canary-Admin" || password !== "gnarlycanary") {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    req.login({ id: "admin", name: "Canary-Admin", role: "admin" } as any, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      res.json({ user: req.user });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    res.json({ user: req.user || null });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.json({ success: true });
    });
  });

  app.get("/api/students", async (_req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.post("/api/students", uploadStudent.single("image"), async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    const studentData = {
      name: req.body.name,
      grade: req.body.grade,
      image: req.file.path,
    };
    const result = schema.insertStudentSchema.safeParse(studentData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const student = await storage.createStudent(result.data);
    res.json(student);
  });

  app.delete("/api/students/:id", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteStudent(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/teachers", async (_req, res) => {
    try {
      const teachers = await storage.getAllTeachers();
      res.json(teachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ error: "Failed to fetch teachers" });
    }
  });

  app.post("/api/teachers", uploadTeacher.single("image"), async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }
    const teacherData = {
      name: req.body.name,
      subject: req.body.subject,
      image: req.file.path,
    };
    const result = schema.insertTeacherSchema.safeParse(teacherData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const teacher = await storage.createTeacher(result.data);
    res.json(teacher);
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteTeacher(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/pictures", async (_req, res) => {
    try {
      const pictures = await storage.getAllPictures();
      res.json(pictures);
    } catch (error) {
      console.error("Error fetching pictures:", error);
      res.status(500).json({ error: "Failed to fetch pictures" });
    }
  });

  app.post("/api/pictures", uploadPicture.single("file"), async (req, res) => {
    if (!req.user || req.user.role === "guest") {
      return res.status(403).json({ error: "Guests cannot upload pictures" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const picture = await storage.createPicture({
      filePath: req.file.path,
      fileName: req.file.originalname,
      caption: req.body.caption || "",
      author: req.user.name,
      authorId: req.user.id,
    });
    res.json(picture);
  });

  app.patch("/api/pictures/:id/approve", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.approvePicture(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/pictures/:id", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const pictures = await storage.getAllPictures();
    const picture = pictures.find(p => p.id === req.params.id);
    if (!picture) {
      return res.status(404).json({ error: "Picture not found" });
    }
    if (picture.authorId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }
    await storage.deletePicture(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/games", async (_req, res) => {
    try {
      const games = await storage.getAllGames();
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.post("/api/games", uploadGame.single("logo"), async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No logo file uploaded" });
    }

    const validOrientations = new Set(["portrait", "landscape", "both"]);
    const gameOrientation = req.body.gameOrientation || "both";
    if (!validOrientations.has(gameOrientation)) {
      return res.status(400).json({ error: "Invalid game orientation value" });
    }

    const result = schema.insertGameSchema.safeParse({
      title: req.body.title,
      logoPath: req.file.path,
      logoName: req.file.originalname,
      description: req.body.description,
      gameUrl: req.body.gameUrl,
      gameOrientation,
      author: req.user.name,
      authorId: req.user.id,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const game = await storage.createGame(result.data);
    res.json(game);
  });

  app.delete("/api/games/:id", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteGame(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/messages", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", uploadMessage.single("file"), async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    
    const messageData: any = {
      senderId: req.user.id,
      senderName: req.user.name,
      content: req.body.content || null,
    };

    if (req.file) {
      messageData.filePath = req.file.path;
      messageData.fileName = req.file.originalname;
      messageData.fileType = req.file.mimetype;
    }

    if (!messageData.content && !messageData.filePath) {
      return res.status(400).json({ error: "Message must have content or a file" });
    }

    const message = await storage.createMessage(messageData);
    res.json(message);
  });

  app.delete("/api/messages/:id", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteMessage(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/announcements", async (_req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ error: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const result = schema.insertAnnouncementSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const announcement = await storage.createAnnouncement(result.data);
    res.json(announcement);
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteAnnouncement(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/stories", async (_req, res) => {
    try {
      await storage.deleteExpiredStories();
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.user.role === "guest") {
      return res.status(403).json({ error: "Guests cannot upload stories" });
    }
    next();
  }, uploadStory.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const story = await storage.createStory({
        userId: req.user.id,
        userName: req.user.name,
        userAvatar: req.user.avatar || undefined,
        filePath: req.file.path,
        fileName: req.file.originalname,
        expiresAt,
      });
      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ error: "Failed to create story" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const stories = await storage.getAllStories();
    const story = stories.find(s => s.id === req.params.id);
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }
    if (story.userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "You can only delete your own stories" });
    }
    await storage.deleteStory(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/likes/:postId", async (req, res) => {
    try {
      const likes = await storage.getLikesByPostId(req.params.postId);
      res.json(likes);
    } catch (error) {
      console.error("Error fetching likes:", error);
      res.status(500).json({ error: "Failed to fetch likes" });
    }
  });

  app.post("/api/likes", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertLikeSchema.safeParse({
      postId: req.body.postId,
      userId: req.user.id,
      userName: req.user.name,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const like = await storage.createLike(result.data);
    res.json(like);
  });

  app.delete("/api/likes/:postId", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteLike(req.params.postId, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/comments/:postId", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPostId(req.params.postId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertCommentSchema.safeParse({
      postId: req.body.postId,
      userId: req.user.id,
      userName: req.user.name,
      content: req.body.content,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const comment = await storage.createComment(result.data);
    res.json(comment);
  });

  app.delete("/api/comments/:id", async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await storage.deleteComment(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/shares/:postId", async (req, res) => {
    try {
      const shares = await storage.getSharesByPostId(req.params.postId);
      res.json(shares);
    } catch (error) {
      console.error("Error fetching shares:", error);
      res.status(500).json({ error: "Failed to fetch shares" });
    }
  });

  app.post("/api/shares", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertShareSchema.safeParse({
      postId: req.body.postId,
      userId: req.user.id,
      userName: req.user.name,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const share = await storage.createShare(result.data);
    res.json(share);
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.get("/api/story-reactions/:storyId", async (req, res) => {
    try {
      const reactions = await storage.getReactionsByStoryId(req.params.storyId);
      res.json(reactions);
    } catch (error) {
      console.error("Error fetching story reactions:", error);
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });

  app.post("/api/story-reactions", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertStoryReactionSchema.safeParse({
      storyId: req.body.storyId,
      userId: req.user.id,
      userName: req.user.name,
      reaction: req.body.reaction,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const reaction = await storage.createStoryReaction(result.data);
    res.json(reaction);
  });

  app.delete("/api/story-reactions/:storyId", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    await storage.deleteStoryReaction(req.params.storyId, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/story-views/:storyId", async (req, res) => {
    try {
      const views = await storage.getViewsByStoryId(req.params.storyId);
      res.json(views);
    } catch (error) {
      console.error("Error fetching story views:", error);
      res.status(500).json({ error: "Failed to fetch views" });
    }
  });

  app.post("/api/story-views", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertStoryViewSchema.safeParse({
      storyId: req.body.storyId,
      userId: req.user.id,
      userName: req.user.name,
      userAvatar: req.user.avatar || null,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const view = await storage.createStoryView(result.data);
    res.json(view);
  });

  app.get("/api/hidden-posts", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    try {
      const hiddenPosts = await storage.getHiddenPostsByUserId(req.user.id);
      res.json(hiddenPosts);
    } catch (error) {
      console.error("Error fetching hidden posts:", error);
      res.status(500).json({ error: "Failed to fetch hidden posts" });
    }
  });

  app.post("/api/hidden-posts", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertHiddenPostSchema.safeParse({
      postId: req.body.postId,
      userId: req.user.id,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const hiddenPost = await storage.createHiddenPost(result.data);
    res.json(hiddenPost);
  });

  app.delete("/api/hidden-posts/:postId", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    await storage.deleteHiddenPost(req.params.postId, req.user.id);
    res.json({ success: true });
  });

  app.post("/api/reported-posts", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    const result = schema.insertReportedPostSchema.safeParse({
      postId: req.body.postId,
      userId: req.user.id,
      userName: req.user.name,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const report = await storage.createReportedPost(result.data);
    res.json(report);
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", uploadFavicon.single("favicon"), async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      const updateData: any = {};
      const validOrientations = new Set(["portrait", "landscape", "both"]);
      if (req.body.siteTitle) updateData.siteTitle = req.body.siteTitle;
      if (req.body.siteDescription) updateData.siteDescription = req.body.siteDescription;
      if (req.body.loginMessage) updateData.loginMessage = req.body.loginMessage;
      if (req.body.gameOrientation) {
        if (!validOrientations.has(req.body.gameOrientation)) {
          return res.status(400).json({ error: "Invalid game orientation value" });
        }
        updateData.gameOrientation = req.body.gameOrientation;
      }
      if (req.file) {
        updateData.faviconPath = "/" + req.file.filename;
      }
      const settings = await storage.updateSettings(updateData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/direct-messages/conversations", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    try {
      const conversations = await storage.getConversationsForUser(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/direct-messages/:userId", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    try {
      const messages = await storage.getDirectMessagesBetweenUsers(req.user.id, req.params.userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/direct-messages", uploadDirectMessage.single("file"), async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    
    const receiverUser = await storage.getUser(req.body.receiverId);
    if (!receiverUser) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    const messageData: any = {
      senderId: req.user.id,
      senderName: req.user.name,
      senderAvatar: req.user.avatar || null,
      receiverId: req.body.receiverId,
      receiverName: receiverUser.name,
      receiverAvatar: receiverUser.avatar || null,
      content: req.body.content || null,
    };

    if (req.file) {
      messageData.filePath = req.file.path;
      messageData.fileName = req.file.originalname;
      messageData.fileType = req.file.mimetype;
    }

    const result = schema.insertDirectMessageSchema.safeParse(messageData);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    try {
      const message = await storage.createDirectMessage(result.data);
      res.json(message);
    } catch (error) {
      console.error("Error creating direct message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.patch("/api/direct-messages/:id/read", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    try {
      await storage.markDirectMessageAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  app.delete("/api/direct-messages/:id", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    try {
      await storage.deleteDirectMessage(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting direct message:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.get("/api/users", async (req, res) => {
    if (!req.user) {
      return res.status(403).json({ error: "Must be logged in" });
    }
    try {
      const allUsers = await storage.getAllUsers();
      const filteredUsers = allUsers
        .filter((u) => u.id !== req.user!.id)
        .map((u) => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
        }));
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
