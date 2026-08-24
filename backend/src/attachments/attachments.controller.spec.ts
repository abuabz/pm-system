import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let service: AttachmentsService;

  const mockAttachmentsService = {
    uploadAttachment: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: mockAttachmentsService,
        },
      ],
    }).compile();

    controller = module.get<AttachmentsController>(AttachmentsController);
    service = module.get<AttachmentsService>(AttachmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadAttachment', () => {
    it('should call attachmentsService.uploadAttachment', async () => {
      const mockFile = {
        buffer: Buffer.from('mock'),
        originalname: 'test.pdf',
      } as Express.Multer.File;
      const req = { user: { id: 'user-1' } };

      mockAttachmentsService.uploadAttachment.mockResolvedValue({
        id: 'att-1',
      });

      expect(
        await controller.uploadAttachment('task-1', mockFile, req),
      ).toEqual({ id: 'att-1' });
      expect(service.uploadAttachment).toHaveBeenCalledWith(
        'task-1',
        mockFile,
        req.user,
      );
    });
  });
});
