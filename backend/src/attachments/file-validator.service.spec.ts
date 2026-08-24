import { Test, TestingModule } from '@nestjs/testing';
import { FileValidatorService } from './file-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('FileValidatorService', () => {
  let service: FileValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileValidatorService],
    }).compile();

    service = module.get<FileValidatorService>(FileValidatorService);
  });

  it('should validate a valid PDF file', () => {
    // PDF Magic number: 25 50 44 46 (%PDF)
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00]);
    expect(service.validateMagicBytes(pdfBuffer, 'document.pdf')).toBe(true);
  });

  it('should validate a valid JPEG file', () => {
    // JPEG Magic number: FF D8 FF
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
    expect(service.validateMagicBytes(jpegBuffer, 'image.jpg')).toBe(true);
  });

  it('should reject a file with an invalid signature (e.g. executable)', () => {
    // MZ signature for executables: 4D 5A
    const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
    expect(() =>
      service.validateMagicBytes(exeBuffer, 'malicious.pdf'),
    ).toThrow(BadRequestException);
  });

  it('should reject when buffer is empty or too small', () => {
    const tinyBuffer = Buffer.from([0x01]);
    expect(() => service.validateMagicBytes(tinyBuffer, 'test.jpg')).toThrow(
      BadRequestException,
    );
  });
});
