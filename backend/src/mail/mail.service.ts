import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    // Mock implementation for the assessment
    this.logger.log(`\n========================================\n`);
    this.logger.log(`MOCK EMAIL SENT TO: ${email}`);
    this.logger.log(`SUBJECT: Password Reset Request`);
    this.logger.log(
      `BODY: Click the link below to reset your password:\n${resetUrl}`,
    );
    this.logger.log(`\n========================================\n`);
  }
}
