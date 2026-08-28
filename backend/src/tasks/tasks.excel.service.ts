import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as ExcelJS from 'exceljs';
import { TasksService } from './tasks.service';

@Injectable()
export class TasksExcelService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TasksService
  ) {}

  async generateTemplate(projectId: string, user: any): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PM System';
    
    // Main Tasks Sheet
    const tasksSheet = workbook.addWorksheet('Tasks');
    tasksSheet.columns = [
      { header: 'Task ID (Leave blank to create)', key: 'id', width: 40 },
      { header: 'Title (Required)', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Assignee Email', key: 'assigneeEmail', width: 30 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Priority', key: 'priority', width: 20 },
      { header: 'Due Date (YYYY-MM-DD)', key: 'dueDate', width: 25 },
      { header: 'Estimated Hours', key: 'estimatedHours', width: 20 },
      { header: 'Actual Hours', key: 'actualHours', width: 20 },
    ];
    
    // Style headers
    tasksSheet.getRow(1).font = { bold: true };
    tasksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Data Validation Dropdowns
    for (let i = 2; i <= 1000; i++) {
      tasksSheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"TODO,IN_PROGRESS,IN_REVIEW,DONE"']
      };
      tasksSheet.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"LOW,MEDIUM,HIGH,URGENT"']
      };
    }

    // Reference Data Sheet
    const refSheet = workbook.addWorksheet('Reference Data');
    refSheet.columns = [
      { header: 'User Name', key: 'userName', width: 30 },
      { header: 'User Email', key: 'userEmail', width: 35 },
    ];
    refSheet.getRow(1).font = { bold: true };
    
    // Populate Reference Data (only for this project)
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } }
    });

    if (project && project.members) {
      project.members.forEach((pm) => {
        if (!pm.user.deletedAt) {
          refSheet.addRow({
            userName: pm.user.name || '',
            userEmail: pm.user.email || '',
          });
        }
      });
    }

    // Protect Reference Data sheet
    await refSheet.protect('pmsystem', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    return workbook;
  }

  async processBulkUpload(file: Express.Multer.File, projectId: string, user: any): Promise<{ created: number, updated: number, errors: string[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);
    
    const sheet = workbook.getWorksheet('Tasks') || workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException("Invalid Excel file: Could not find any sheets.");
    }
    
    let created = 0;
    let updated = 0;
    const errors: string[] = [];
    
    // Build a user email -> id map for fast lookup
    const allUsers = await this.prisma.user.findMany({ select: { id: true, email: true } });
    const userMap = new Map<string, string>();
    allUsers.forEach((u: any) => userMap.set(u.email.toLowerCase(), u.id));

    // Get row count
    const rowCount = sheet.rowCount;
    
    for (let i = 2; i <= rowCount; i++) {
      const row = sheet.getRow(i);
      
      const id = row.getCell(1).value?.toString().trim();
      const title = row.getCell(2).value?.toString().trim();
      const description = row.getCell(3).value?.toString().trim();
      const assigneeEmail = row.getCell(4).value?.toString().trim();
      const status = row.getCell(5).value?.toString().trim()?.toUpperCase();
      const priority = row.getCell(6).value?.toString().trim()?.toUpperCase();
      const dueDate = row.getCell(7).value?.toString().trim();
      const estHours = row.getCell(8).value;
      const actHours = row.getCell(9).value;

      // Skip empty rows
      if (!title && !id) continue;

      try {
        let assigneeId = undefined;
        if (assigneeEmail) {
          assigneeId = userMap.get(assigneeEmail.toLowerCase());
          if (!assigneeId) {
            throw new Error(`Assignee email ${assigneeEmail} not found`);
          }
        }

        const taskData: any = {
          title,
          description: description || undefined,
          status: status || undefined,
          priority: priority || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          estimatedHours: estHours ? parseFloat(estHours.toString()) : undefined,
          actualHours: actHours ? parseFloat(actHours.toString()) : undefined,
          assigneeId
        };

        if (id) {
          // Update existing task
          // Check if this task belongs to the project
          const existingTask = await this.prisma.task.findUnique({ where: { id } });
          if (!existingTask) {
             throw new Error(`Task with ID ${id} not found`);
          }
          if (existingTask.projectId !== projectId) {
             throw new Error(`Task ${id} does not belong to the selected project`);
          }
          
          await this.tasksService.update(id, taskData, user);
          updated++;
        } else {
          // Create new task
          if (!title) throw new Error("Title is required for new tasks");
          
          taskData.projectId = projectId;
          
          await this.tasksService.create(taskData, user);
          created++;
        }
      } catch (error: any) {
        errors.push(`Row ${i}: ${error.message}`);
      }
    }
    
    return { created, updated, errors };
  }
}
