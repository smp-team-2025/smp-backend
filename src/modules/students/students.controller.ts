import { Request, Response } from "express";
import { studentsService } from "./students.service";

export const studentsController = {
  async list(_req: Request, res: Response) {
    const students = await studentsService.listApprovedStudents();
    res.json(students);
  },
};