import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    assign: jest.fn(),
    bulkUpdate: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call tasksService.findAll with query', async () => {
      const query = { page: 1, limit: 10 };
      const req = { user: { id: 'user-1' } };
      const expectedResult = {
        data: [],
        meta: { total: 0, page: 1, lastPage: 0 },
      };

      mockTasksService.findAll.mockResolvedValue(expectedResult);

      expect(await controller.findAll(query as any, req)).toEqual(
        expectedResult,
      );
      expect(service.findAll).toHaveBeenCalledWith(query, req.user);
    });
  });
});
