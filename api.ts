export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

export const api = {
  auth: {
    getUser: () => fetchAPI("/auth/user"),
    loginGoogle: () => {
      window.location.href = "/api/auth/google";
    },
    loginGuest: () => fetchAPI("/auth/guest", { method: "POST" }),
    loginAdmin: (username: string, password: string) => 
      fetchAPI("/auth/admin", { 
        method: "POST",
        body: JSON.stringify({ username, password })
      }),
    logout: () => fetchAPI("/auth/logout", { method: "POST" }),
  },
  
  students: {
    getAll: () => fetchAPI("/students"),
    create: async (data: { name: string; grade: string; image: File }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("grade", data.grade);
      formData.append("image", data.image);
      
      const response = await fetch("/api/students", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    delete: (id: string) => fetchAPI(`/students/${id}`, { method: "DELETE" }),
  },
  
  teachers: {
    getAll: () => fetchAPI("/teachers"),
    create: async (data: { name: string; subject: string; image: File }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("subject", data.subject);
      formData.append("image", data.image);
      
      const response = await fetch("/api/teachers", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    delete: (id: string) => fetchAPI(`/teachers/${id}`, { method: "DELETE" }),
  },
  
  pictures: {
    getAll: () => fetchAPI("/pictures"),
    create: async (formData: FormData) => {
      const response = await fetch("/api/pictures", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    approve: (id: string) => fetchAPI(`/pictures/${id}/approve`, { method: "PATCH" }),
    delete: (id: string) => fetchAPI(`/pictures/${id}`, { method: "DELETE" }),
  },

  games: {
    getAll: () => fetchAPI("/games"),
    create: async (formData: FormData) => {
      const response = await fetch("/api/games", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        if (isJson) {
          const error = await response.json().catch(() => ({ error: "Create failed" }));
          throw new Error(error.error || "Create failed");
        }
        const text = await response.text();
        throw new Error(`Create failed (${response.status}): ${text.slice(0, 120)}`);
      }

      if (!isJson) {
        const text = await response.text();
        throw new Error(`Create failed: expected JSON response, got ${contentType || "unknown content type"} (${text.slice(0, 120)})`);
      }

      return response.json();
    },
    delete: (id: string) => fetchAPI(`/games/${id}`, { method: "DELETE" }),
  },
  
  messages: {
    getAll: () => fetchAPI("/messages"),
    create: async (formData: FormData) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Send failed" }));
        throw new Error(error.error || "Send failed");
      }
      return response.json();
    },
    delete: (id: string) => fetchAPI(`/messages/${id}`, { method: "DELETE" }),
  },
  
  announcements: {
    getAll: () => fetchAPI("/announcements"),
    create: (data: any) => fetchAPI("/announcements", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/announcements/${id}`, { method: "DELETE" }),
  },

  stories: {
    getAll: () => fetchAPI("/stories"),
    create: async (formData: FormData) => {
      const response = await fetch("/api/stories", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    delete: (id: string) => fetchAPI(`/stories/${id}`, { method: "DELETE" }),
  },

  likes: {
    getByPostId: (postId: string) => fetchAPI(`/likes/${postId}`),
    create: (postId: string) => fetchAPI("/likes", { method: "POST", body: JSON.stringify({ postId }) }),
    delete: (postId: string) => fetchAPI(`/likes/${postId}`, { method: "DELETE" }),
  },

  comments: {
    getByPostId: (postId: string) => fetchAPI(`/comments/${postId}`),
    create: (postId: string, content: string) => 
      fetchAPI("/comments", { method: "POST", body: JSON.stringify({ postId, content }) }),
    delete: (id: string) => fetchAPI(`/comments/${id}`, { method: "DELETE" }),
  },

  shares: {
    getByPostId: (postId: string) => fetchAPI(`/shares/${postId}`),
    create: (postId: string) => fetchAPI("/shares", { method: "POST", body: JSON.stringify({ postId }) }),
  },

  users: {
    getById: (id: string) => fetchAPI(`/users/${id}`),
  },

  storyReactions: {
    getByStoryId: (storyId: string) => fetchAPI(`/story-reactions/${storyId}`),
    create: (storyId: string, reaction: string) => 
      fetchAPI("/story-reactions", { method: "POST", body: JSON.stringify({ storyId, reaction }) }),
    delete: (storyId: string) => fetchAPI(`/story-reactions/${storyId}`, { method: "DELETE" }),
  },

  storyViews: {
    getByStoryId: (storyId: string) => fetchAPI(`/story-views/${storyId}`),
    create: (storyId: string) => 
      fetchAPI("/story-views", { method: "POST", body: JSON.stringify({ storyId }) }),
  },

  hiddenPosts: {
    getAll: () => fetchAPI("/hidden-posts"),
    create: (postId: string) => 
      fetchAPI("/hidden-posts", { method: "POST", body: JSON.stringify({ postId }) }),
    delete: (postId: string) => fetchAPI(`/hidden-posts/${postId}`, { method: "DELETE" }),
  },

  reportedPosts: {
    create: (postId: string) => 
      fetchAPI("/reported-posts", { method: "POST", body: JSON.stringify({ postId }) }),
  },

  settings: {
    get: () => fetchAPI("/settings"),
    update: async (data: { siteTitle?: string; siteDescription?: string; loginMessage?: string; gameOrientation?: "portrait" | "landscape" | "both"; favicon?: File }) => {
      const formData = new FormData();
      if (data.siteTitle) formData.append("siteTitle", data.siteTitle);
      if (data.siteDescription) formData.append("siteDescription", data.siteDescription);
      if (data.loginMessage) formData.append("loginMessage", data.loginMessage);
      if (data.gameOrientation) formData.append("gameOrientation", data.gameOrientation);
      if (data.favicon) formData.append("favicon", data.favicon);
      
      const response = await fetch("/api/settings", {
        method: "PUT",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Update failed" }));
        throw new Error(error.error || "Update failed");
      }
      return response.json();
    },
  },

  directMessages: {
    getConversations: () => fetchAPI("/direct-messages/conversations"),
    getWithUser: (userId: string) => fetchAPI(`/direct-messages/${userId}`),
    send: async (data: { receiverId: string; content?: string; file?: File }) => {
      const formData = new FormData();
      formData.append("receiverId", data.receiverId);
      if (data.content) formData.append("content", data.content);
      if (data.file) formData.append("file", data.file);
      
      const response = await fetch("/api/direct-messages", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Send failed" }));
        throw new Error(error.error || "Send failed");
      }
      return response.json();
    },
    markAsRead: (messageId: string) => fetchAPI(`/direct-messages/${messageId}/read`, { method: "PATCH" }),
    delete: (id: string) => fetchAPI(`/direct-messages/${id}`, { method: "DELETE" }),
  },

  getAllUsers: () => fetchAPI("/users"),
};
