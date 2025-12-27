import express from "express";
import cors from "cors";
import { authRouter } from "./modules/auth/auth.router";
import { registrationRouter } from "./modules/registration/registration.router";
import { studentsRouter } from "./modules/students/students.router";
import { eventsRouter } from "./modules/events/events.router";
import { sessionsRouter } from "./modules/sessions/sessions.router";
import { hiwiRouter } from "./modules/hiwi/hiwi.router";
import { usersRouter } from "./modules/users/users.router";
import { attendanceRouter } from "./modules/attendance/attendance.router";








export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("SMP backend is running");
});

//Health check for the server
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

//Auth endpoint for login
app.use("/api/auth", authRouter);

//Registration form
app.use("/api/registrations", registrationRouter);

// Frontend uses /register endpoint (Issue #18)
app.use("/register", registrationRouter);

//Students endpoint
app.use("/api/students", studentsRouter);

//Events CRUD endpoint
app.use("/api/events", eventsRouter);

//Sessions CRUD endpoint
app.use("/api/events/:id/sessions", sessionsRouter);

//Hiwi CRUD endpoint
app.use("/api/hiwis", hiwiRouter);

//Users endpoint
app.use("/api/users", usersRouter);

//Attendance endpoint
app.use("/api/attendance", attendanceRouter);