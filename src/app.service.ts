import { Injectable } from '@nestjs/common';
import { DatabaseService } from './shared/database/database.service';

@Injectable()
export class AppService {
  constructor(private readonly dbService: DatabaseService) {}

  async getHello(): Promise<string> {
    const isDbConnected = await this.dbService.isConnected();
    const projectName = 'InfluenceHub-Server';
    return isDbConnected
      ? `${projectName} - Database Connected`
      : `${projectName} - Database Not Connected`;
  }
}
