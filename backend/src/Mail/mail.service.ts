import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}
  async sendResetPasswordEmail(to: string, resetLink: string) {
    await this.mailService.sendMail({
      to,
      subject: 'reset your password',
      html: `
         <p>You requested a password reset.</p>
        <p>Make a POST request to this link with the new password to reset your password</p>
        <p>${resetLink}</p>
        <p>This link expires in 5 minutes. If you didn't request this, ignore this email.</p>`,
    });
  }
}
