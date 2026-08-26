import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockPrismaService: any = {
    project: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    projectMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      return await cb(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  describe('verifyProjectAccess', () => {
    it('should pass if user is Super Admin', async () => {
      // Test through findOne which calls verifyProjectAccess
      mockPrismaService.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      const user = { id: 'u1', role: { name: 'Super Admin' } };
      
      const result = await service.findOne('proj-1', user);
      expect(result.id).toBe('proj-1');
      expect(mockPrismaService.projectMember.findUnique).not.toHaveBeenCalled();
    });

    it('should pass if user is a member', async () => {
      mockPrismaService.projectMember.findUnique.mockResolvedValue({ id: 'mem-1' });
      mockPrismaService.project.findFirst.mockResolvedValue({ id: 'proj-1' });
      const user = { id: 'u1', role: { name: 'User' } };
      
      const result = await service.findOne('proj-1', user);
      expect(result.id).toBe('proj-1');
      expect(mockPrismaService.projectMember.findUnique).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.projectMember.findUnique.mockResolvedValue(null);
      const user = { id: 'u1', role: { name: 'User' } };
      
      await expect(service.findOne('proj-1', user)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create project and add owner in a transaction', async () => {
      const createDto = { name: 'New Project', description: 'Desc' };
      mockPrismaService.project.create.mockResolvedValue({ id: 'proj-1', ...createDto });
      mockPrismaService.projectMember.create.mockResolvedValue({ id: 'mem-1' });

      const result = await service.create(createDto, 'u1');
      expect(result.id).toBe('proj-1');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'New Project' })
      });
      expect(mockPrismaService.projectMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: ProjectRole.OWNER, userId: 'u1' })
      });
    });
  });
});
