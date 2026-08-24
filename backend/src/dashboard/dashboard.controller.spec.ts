import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockDashboardService = {
    getMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call getMetrics', async () => {
    const req = { user: { id: 'test-user', role: { name: 'Super Admin' } } };
    mockDashboardService.getMetrics.mockResolvedValue({ totalProjects: 5 });

    const result = await controller.getMetrics(req);
    expect(result).toEqual({ totalProjects: 5 });
    expect(service.getMetrics).toHaveBeenCalledWith(req.user);
  });
});
