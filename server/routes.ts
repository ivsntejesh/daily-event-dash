import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertPublicEventSchema, insertTaskSchema, insertPublicTaskSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock authentication middleware - in real app would verify JWT tokens
  const authenticateUser = (req: any, res: any, next: any) => {
    // For demo purposes, assume user ID 1 is authenticated
    req.userId = 1;
    next();
  };

  // Events routes
  app.get("/api/events", authenticateUser, async (req: any, res) => {
    try {
      const events = await storage.getEventsByUser(req.userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/events", authenticateUser, async (req: any, res) => {
    try {
      const eventData = insertEventSchema.parse({ ...req.body, userId: req.userId });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(400).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEvent(id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Public events routes
  app.get("/api/public-events", async (req, res) => {
    try {
      const events = await storage.getPublicEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({ error: "Failed to fetch public events" });
    }
  });

  app.post("/api/public-events", authenticateUser, async (req: any, res) => {
    try {
      const eventData = insertPublicEventSchema.parse({ ...req.body, userId: req.userId });
      const event = await storage.createPublicEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating public event:", error);
      res.status(400).json({ error: "Failed to create public event" });
    }
  });

  app.put("/api/public-events/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const eventData = insertPublicEventSchema.partial().parse(req.body);
      const event = await storage.updatePublicEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ error: "Public event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating public event:", error);
      res.status(400).json({ error: "Failed to update public event" });
    }
  });

  app.delete("/api/public-events/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePublicEvent(id);
      if (!deleted) {
        return res.status(404).json({ error: "Public event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting public event:", error);
      res.status(500).json({ error: "Failed to delete public event" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", authenticateUser, async (req: any, res) => {
    try {
      const tasks = await storage.getTasksByUser(req.userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", authenticateUser, async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse({ ...req.body, userId: req.userId });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const taskData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(id, taskData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(400).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTask(id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Public tasks routes
  app.get("/api/public-tasks", async (req, res) => {
    try {
      const tasks = await storage.getPublicTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching public tasks:", error);
      res.status(500).json({ error: "Failed to fetch public tasks" });
    }
  });

  app.post("/api/public-tasks", authenticateUser, async (req: any, res) => {
    try {
      const taskData = insertPublicTaskSchema.parse({ ...req.body, userId: req.userId });
      const task = await storage.createPublicTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating public task:", error);
      res.status(400).json({ error: "Failed to create public task" });
    }
  });

  app.put("/api/public-tasks/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const taskData = insertPublicTaskSchema.partial().parse(req.body);
      const task = await storage.updatePublicTask(id, taskData);
      if (!task) {
        return res.status(404).json({ error: "Public task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating public task:", error);
      res.status(400).json({ error: "Failed to update public task" });
    }
  });

  app.delete("/api/public-tasks/:id", authenticateUser, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePublicTask(id);
      if (!deleted) {
        return res.status(404).json({ error: "Public task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting public task:", error);
      res.status(500).json({ error: "Failed to delete public task" });
    }
  });

  // Sync routes (replacing Supabase Edge Functions)
  app.get("/api/sync-logs", authenticateUser, async (req, res) => {
    try {
      const logs = await storage.getSyncLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  app.post("/api/sync", authenticateUser, async (req: any, res) => {
    try {
      // This would implement the Google Sheets sync functionality
      // For now, create a basic sync log entry
      const syncLog = await storage.createSyncLog({
        syncType: "manual_sync",
        status: "pending",
        startedAt: new Date(),
        metadata: { triggeredBy: req.userId }
      });
      
      // Here you would implement the actual sync logic
      // For demo purposes, mark as completed
      await storage.updateSyncLog(syncLog.id, {
        status: "success",
        completedAt: new Date(),
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0
      });

      res.json({ success: true, syncId: syncLog.id });
    } catch (error) {
      console.error("Error triggering sync:", error);
      res.status(500).json({ error: "Failed to trigger sync" });
    }
  });

  // User role route
  app.get("/api/user-role", authenticateUser, async (req: any, res) => {
    try {
      const userRole = await storage.getUserRole(req.userId);
      res.json(userRole);
    } catch (error) {
      console.error("Error fetching user role:", error);
      res.status(500).json({ error: "Failed to fetch user role" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
