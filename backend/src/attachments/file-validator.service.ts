import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidatorService {
  /**
   * Validates if the file's magic bytes match allowed types (PDF, PNG, JPEG)
   */
  validateMagicBytes(buffer: Buffer, originalName: string) {
    if (!buffer || buffer.length < 4) {
      throw new BadRequestException('Invalid file buffer');
    }

    const hex = buffer.toString('hex', 0, 4).toUpperCase();
    const extension = originalName.split('.').pop()?.toLowerCase();

    // Magic numbers
    const isPDF = hex.startsWith('25504446'); // %PDF
    const isJPEG = hex.startsWith('FFD8FF');
    const isPNG = hex.startsWith('89504E47'); // \x89PNG
    const isDOCX = hex.startsWith('504B0304'); // PK.. (ZIP archive used by docx)

    if (extension === 'pdf' && !isPDF) {
      throw new BadRequestException(
        'Invalid PDF file signature. Possible malicious file.',
      );
    }
    if ((extension === 'jpg' || extension === 'jpeg') && !isJPEG) {
      throw new BadRequestException('Invalid JPEG file signature.');
    }
    if (extension === 'png' && !isPNG) {
      throw new BadRequestException('Invalid PNG file signature.');
    }
    if (extension === 'docx' && !isDOCX) {
      throw new BadRequestException('Invalid DOCX file signature.');
    }

    if (!isPDF && !isJPEG && !isPNG && !isDOCX) {
      throw new BadRequestException(
        'Unsupported file type signature. Only PDF, JPEG, PNG, and DOCX are allowed.',
      );
    }

    return true;
  }
}
