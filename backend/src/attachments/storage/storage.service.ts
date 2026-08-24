export abstract class StorageService {
  /**
   * Uploads a file and returns the accessible URL
   * @param file The file buffer
   * @param originalName The original file name
   * @returns The URL of the uploaded file
   */
  abstract uploadFile(file: Buffer, originalName: string): Promise<string>;

  /**
   * Deletes a file by its URL
   * @param fileUrl The URL of the file to delete
   */
  abstract deleteFile(fileUrl: string): Promise<void>;
}
