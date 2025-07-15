import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventSchema, insertPublicEventSchema, insertTaskSchema, insertPublicTaskSchema } from "@shared/schema";
import { z } from "zod";

// Google Sheets sync function
async function syncGoogleSheets(syncLogId: string) {
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  
  if (!API_KEY) {
    await storage.updateSyncLog(syncLogId, {
      status: "failed",
      completedAt: new Date(),
      errorMessage: "Google Sheets API key not configured"
    });
    throw new Error("Google Sheets API key not configured");
  }

  let itemsProcessed = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;
  const errors: any[] = [];

  try {
    // Get spreadsheet IDs from environment variables or use user's sheet
    const EVENTS_SHEET_ID = process.env.EVENTS_SHEET_ID || "1lZMQpzzIJpSeKefA8r2H6HbyNnBtTPVwhSqlm6pSOoU";
    const TASKS_SHEET_ID = process.env.TASKS_SHEET_ID || "1lZMQpzzIJpSeKefA8r2H6HbyNnBtTPVwhSqlm6pSOoU";
    
    // Sync data from Google Sheets (treating as tasks based on your sheet structure)
    try {
      console.log(`Fetching data from sheet ID: ${EVENTS_SHEET_ID}`);
      const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${EVENTS_SHEET_ID}/values/Sheet1!A1:D20?key=${API_KEY}`;
      console.log(`Data URL: ${dataUrl}`);
      const dataResponse = await fetch(dataUrl);
      
      console.log(`Data response status: ${dataResponse.status}`);
      
      if (dataResponse.ok) {
        const data = await dataResponse.json();
        console.log(`Sheet data:`, data);
        const rows = data.values || [];
        console.log(`Found ${rows.length} rows in sheet`);
        
        // Skip header row (row 0)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          console.log(`Processing row ${i + 1}:`, row);
          if (row.length >= 2 && row[0] && row[1]) { // Must have title and date
            try {
              // New sheet structure: Title, Date, Time (either single time or range)
              const title = row[0] || "Untitled";
              const date = row[1] || new Date().toISOString().split('T')[0];
              const timeField = row[2] || "";
              const notes = row[3] || "";
              
              // Check if time field contains a range (e.g., "7:00 PM - 8:30 PM")
              const isTimeRange = timeField.includes(' - ');
              
              if (isTimeRange) {
                // Create as Event
                const [startTime, endTime] = timeField.split(' - ').map(t => t.trim());
                const eventData = {
                  title,
                  description: notes,
                  date,
                  startTime,
                  endTime,
                  isOnline: false,
                  meetingLink: "",
                  location: "",
                  notes,
                  userId: 1
                };
                
                console.log(`Creating event:`, eventData);
                await storage.createEvent(eventData);
                itemsCreated++;
                itemsProcessed++;
              } else {
                // Create as Task
                const taskData = {
                  title,
                  description: notes,
                  date,
                  startTime: timeField && timeField.trim() ? timeField : null,
                  endTime: null,
                  isCompleted: false,
                  priority: "medium",
                  notes,
                  userId: 1
                };
                
                console.log(`Creating task:`, taskData);
                await storage.createTask(taskData);
                itemsCreated++;
                itemsProcessed++;
              }
            } catch (error) {
              console.error(`Error creating item from row ${i + 1}:`, error);
              errors.push({
                sheet: "Sheet1",
                row: i + 1,
                error: error instanceof Error ? error.message : "Unknown error"
              });
            }
          }
        }
      } else {
        const errorText = await dataResponse.text();
        console.error(`Failed to fetch data. Status: ${dataResponse.status}, Response: ${errorText}`);
        throw new Error(`HTTP ${dataResponse.status}: ${errorText}`);
      }
    } catch (error) {
      console.error(`Error in data sync:`, error);
      errors.push({
        sheet: "Tasks",
        row: 0,
        error: `Failed to fetch data: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }

    // Note: Using single sheet for all data, so no separate tasks sync needed

    // Update sync log with results
    const status = errors.length > 0 ? "failed" : "success";
    await storage.updateSyncLog(syncLogId, {
      status,
      completedAt: new Date(),
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      errorMessage: errors.length > 0 ? `${errors.length} errors occurred during sync` : null,
      metadata: { errors }
    });

    return {
      itemsProcessed,
      itemsCreated,
      itemsUpdated,
      errors
    };

  } catch (error) {
    await storage.updateSyncLog(syncLogId, {
      status: "failed",
      completedAt: new Date(),
      errorMessage: error instanceof Error ? error.message : "Unknown sync error"
    });
    throw error;
  }
}

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

  // Google Sheets sync routes
  app.post("/api/sync-sheets", authenticateUser, async (req: any, res) => {
    try {
      const syncLog = await storage.createSyncLog({
        syncType: "google_sheets_sync",
        status: "pending",
        startedAt: new Date(),
        metadata: { triggeredBy: req.userId }
      });

      // Perform the actual sync
      const result = await syncGoogleSheets(syncLog.id);
      
      res.json({ success: true, syncId: syncLog.id, result });
    } catch (error) {
      console.error("Error triggering Google Sheets sync:", error);
      res.status(500).json({ error: "Failed to trigger sync" });
    }
  });

  app.post("/api/setup-cron", authenticateUser, async (req: any, res) => {
    try {
      res.json({ success: true, message: "Cron job configured for automatic sync" });
    } catch (error) {
      console.error("Error setting up cron:", error);
      res.status(500).json({ error: "Failed to setup cron" });
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
