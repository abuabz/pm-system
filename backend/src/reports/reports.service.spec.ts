import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../database/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockPrismaService = {
    task: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  describe('getProjectProgress', () => {
    it('should correctly calculate completion percentage', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([
        { projectId: 'p1', status: 'TODO', project: { name: 'Project 1' } },
        { projectId: 'p1', status: 'DONE', project: { name: 'Project 1' } },
        { projectId: 'p1', status: 'DONE', project: { name: 'Project 1' } },
        { projectId: 'p1', status: 'IN_PROGRESS', project: { name: 'Project 1' } },
      ]);

      const result = await service.getProjectProgress('p1');
      
      expect(result).toHaveLength(1);
      expect(result[0].total).toBe(4);
      expect(result[0].done).toBe(2);
      expect(result[0].completionPercentage).toBe(50);
    });

    it('should return 0 percentage if no tasks exist', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getProjectProgress('p1');
      expect(result).toHaveLength(0);
    });
  });

  describe('getUserProductivity', () => {
    it('should calculate total actual and estimated hours per user', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([
        { 
          assigneeId: 'u1', 
          assignee: { firstName: 'John', lastName: 'Doe' },
          estimatedHours: 5,
          actualHours: 4
        },
        { 
          assigneeId: 'u1', 
          assignee: { firstName: 'John', lastName: 'Doe' },
          estimatedHours: 2,
          actualHours: 3
        },
      ]);

      const result = await service.getUserProductivity();
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].tasksCompleted).toBe(2);
      expect(result[0].totalEstimated).toBe(7);
      expect(result[0].totalActual).toBe(7);
    });
  });
});
