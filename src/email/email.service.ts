import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { UserService } from '../user/user.service';
import { ProcessedEmail, ProcessedEmailDocument } from '../schemas/processed-email.entity';
import { Stream } from 'stream';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectModel(ProcessedEmail.name)
    private processedEmailModel: Model<ProcessedEmailDocument>,
    private userService: UserService,
  ) {}

  private createImapConnection(email: string, password: string): Imap {
    return new Imap({
      user: email,
      password,
      host: 'imap.gmail.com', // TODO: Make configurable
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });
  }

  private async fetchEmailContent(imap: Imap, uid: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const fetch = imap.fetch(uid, { bodies: '' });

      fetch.on('message', (msg) => {
        msg.on('body', async (stream: Stream) => {
          try {
            const parsed: ParsedMail = await simpleParser(stream);
            resolve({
              subject: parsed.subject,
              text: parsed.text,
              html: parsed.html,
              from: Array.isArray(parsed.from) ? parsed.from[0]?.text : parsed.from?.text,
              to: Array.isArray(parsed.to) ? parsed.to[0]?.text : parsed.to?.text,
              date: parsed.date,
              messageId: parsed.messageId,
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      fetch.on('error', reject);
    });
  }

  async fetchEmails(userId: string): Promise<any[]> {
    const user = await this.userService.findOne(userId);
    const password = await this.userService.getDecryptedEmailPassword(userId);

    return new Promise((resolve, reject) => {
      const imap = this.createImapConnection(user.email, password);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err: Error | null, box) => {
          if (err) {
            imap.end();
            reject(err);
            return;
          }

          // Search for unread emails
          imap.search(['UNSEEN'], async (err: Error | null, uids) => {
            if (err) {
              imap.end();
              reject(err);
              return;
            }

            if (!uids.length) {
              imap.end();
              resolve([]);
              return;
            }

            try {
              const emails = await Promise.all(
                uids.map(uid => this.fetchEmailContent(imap, uid))
              );
              imap.end();
              resolve(emails);
            } catch (error) {
              imap.end();
              reject(error);
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  async saveProcessedEmail(emailData: Partial<ProcessedEmail>): Promise<ProcessedEmail> {
    const processedEmail = new this.processedEmailModel(emailData);
    return processedEmail.save();
  }

  async markEmailAsProcessed(
    id: string,
    status: string,
    data: Record<string, any>,
  ): Promise<ProcessedEmail> {
    const updatedEmail = await this.processedEmailModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          processedData: data,
          processedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    if (!updatedEmail) {
      throw new Error(`Email with id ${id} not found`);
    }

    return updatedEmail;
  }

  async findProcessedEmails(
    userId: string,
    status?: string,
    skip = 0,
    limit = 10,
  ): Promise<{ total: number; emails: ProcessedEmail[] }> {
    const query: any = { user: userId };
    if (status) {
      query.status = status;
    }

    const [total, emails] = await Promise.all([
      this.processedEmailModel.countDocuments(query),
      this.processedEmailModel
        .find(query)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('matchedIntention')
        .populate('executedActions')
        .exec(),
    ]);

    return { total, emails };
  }

  async findProcessedEmailById(id: string): Promise<ProcessedEmail> {
    const email = await this.processedEmailModel
      .findById(id)
      .populate('matchedIntention')
      .populate('executedActions')
      .exec();

    if (!email) {
      throw new Error(`Email with id ${id} not found`);
    }

    return email;
  }
}
