import { Injectable } from '@nestjs/common';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService implements StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Buffer, originalName: string): Promise<string> {
    const ext = path.extname(originalName);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.promises.writeFile(filePath, file);

    // In a real local server, we would serve this via static module.
    // For now, we return a mock URL.
    return `/uploads/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
