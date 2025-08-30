import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '../config/config.service';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {
    // Instantiate Prisma client using DATABASE_URL from our ConfigService when present
    const dbUrl = this.configService.get('DATABASE_URL');
    const prismaOptions: { datasources?: { db?: { url?: string } } } = {};
    if (dbUrl) prismaOptions.datasources = { db: { url: dbUrl } };

    if (Object.keys(prismaOptions).length > 0) {
      // PrismaClient type generation is complex; use a narrow any for options here.
      this.prisma = new PrismaClient(prismaOptions as any);
    } else {
      this.prisma = new PrismaClient();
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.logger.log('Connected to the database');
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Failed to connect to the database on startup', stack);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.log('Disconnected from the database');
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Error while disconnecting from the database', stack);
    }
  }

  /**
   * Lightweight check to see if DB is reachable. Does not change main connection state.
   */
  async isConnected(): Promise<boolean> {
    try {
      // Use a small quick query to verify DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      const stack = error instanceof Error ? error.stack : String(error);
      this.logger.error('Database connectivity check failed', stack);
      return false;
    }
  }

  getClient(): PrismaClient {
    return this.prisma;
  }
}
