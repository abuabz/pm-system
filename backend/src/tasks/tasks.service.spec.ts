import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;

  const mockPrismaService: any = {
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    projectMember: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      return await cb(mockPrismaService);
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('verifyProjectAccess', () => {
    it('should throw ForbiddenException if user not in project', async () => {
      mockPrismaService.projectMember.findUnique.mockResolvedValue(null);
      const user = { id: 'u1', role: { name: 'User' } };
      const dto = { title: 'T1', projectId: 'p1' };
      
      await expect(service.create(dto as any, user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create task and emit notification if assignee provided', async () => {
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      mockPrismaService.task.create.mockResolvedValue({ id: 't1', title: 'T1', assigneeId: 'u2' });
      
      const user = { id: 'u1', role: { name: 'User' } };
      const dto = { title: 'T1', projectId: 'p1', assigneeId: 'u2' };

      const result = await service.create(dto as any, user);
      
      expect(result.id).toBe('t1');
      expect(mockPrismaService.task.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('notification.send', expect.anything());
    });
  });

  describe('updateStatus', () => {
    it('should update status if task exists and user has access', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue({ id: 't1', projectId: 'p1' });
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      mockPrismaService.task.update.mockResolvedValue({ id: 't1', status: TaskStatus.IN_PROGRESS });

      const result = await service.updateStatus('t1', TaskStatus.IN_PROGRESS, { id: 'u1' });
      
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: TaskStatus.IN_PROGRESS }
      });
    });
  });
});
