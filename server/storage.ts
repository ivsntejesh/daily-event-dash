import { 
  users, events, publicEvents, tasks, publicTasks, userRoles, syncLog,
  type User, type InsertUser, type Event, type InsertEvent,
  type PublicEvent, type InsertPublicEvent, type Task, type InsertTask,
  type PublicTask, type InsertPublicTask, type UserRole, type SyncLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event operations
  getEventsByUser(userId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Public event operations
  getPublicEvents(): Promise<PublicEvent[]>;
  createPublicEvent(event: InsertPublicEvent): Promise<PublicEvent>;
  updatePublicEvent(id: string, event: Partial<InsertPublicEvent>): Promise<PublicEvent | undefined>;
  deletePublicEvent(id: string): Promise<boolean>;
  
  // Task operations
  getTasksByUser(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // Public task operations
  getPublicTasks(): Promise<PublicTask[]>;
  createPublicTask(task: InsertPublicTask): Promise<PublicTask>;
  updatePublicTask(id: string, task: Partial<InsertPublicTask>): Promise<PublicTask | undefined>;
  deletePublicTask(id: string): Promise<boolean>;
  
  // User role operations
  getUserRole(userId: number): Promise<UserRole | undefined>;
  
  // Sync log operations
  getSyncLogs(): Promise<SyncLog[]>;
  createSyncLog(log: Partial<SyncLog>): Promise<SyncLog>;
  updateSyncLog(id: string, log: Partial<SyncLog>): Promise<SyncLog | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Event operations
  async getEventsByUser(userId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Public event operations
  async getPublicEvents(): Promise<PublicEvent[]> {
    return await db.select().from(publicEvents).orderBy(desc(publicEvents.createdAt));
  }

  async createPublicEvent(event: InsertPublicEvent): Promise<PublicEvent> {
    const result = await db.insert(publicEvents).values(event).returning();
    return result[0];
  }

  async updatePublicEvent(id: string, event: Partial<InsertPublicEvent>): Promise<PublicEvent | undefined> {
    const result = await db.update(publicEvents).set(event).where(eq(publicEvents.id, id)).returning();
    return result[0];
  }

  async deletePublicEvent(id: string): Promise<boolean> {
    const result = await db.delete(publicEvents).where(eq(publicEvents.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Task operations
  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await db.update(tasks).set(task).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Public task operations
  async getPublicTasks(): Promise<PublicTask[]> {
    return await db.select().from(publicTasks).orderBy(desc(publicTasks.createdAt));
  }

  async createPublicTask(task: InsertPublicTask): Promise<PublicTask> {
    const result = await db.insert(publicTasks).values(task).returning();
    return result[0];
  }

  async updatePublicTask(id: string, task: Partial<InsertPublicTask>): Promise<PublicTask | undefined> {
    const result = await db.update(publicTasks).set(task).where(eq(publicTasks.id, id)).returning();
    return result[0];
  }

  async deletePublicTask(id: string): Promise<boolean> {
    const result = await db.delete(publicTasks).where(eq(publicTasks.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User role operations
  async getUserRole(userId: number): Promise<UserRole | undefined> {
    const result = await db.select().from(userRoles).where(eq(userRoles.userId, userId)).limit(1);
    return result[0];
  }

  // Sync log operations
  async getSyncLogs(): Promise<SyncLog[]> {
    return await db.select().from(syncLog).orderBy(desc(syncLog.startedAt));
  }

  async createSyncLog(log: Partial<SyncLog>): Promise<SyncLog> {
    const result = await db.insert(syncLog).values(log as any).returning();
    return result[0];
  }

  async updateSyncLog(id: string, log: Partial<SyncLog>): Promise<SyncLog | undefined> {
    const result = await db.update(syncLog).set(log).where(eq(syncLog.id, id)).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
