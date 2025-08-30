import {
  INestApplication,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    (this as any).$on('beforeExit', () => {
      void (async () => {
        try {
          await app.close();
        } finally {
          await this.$disconnect();
        }
      })();
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
