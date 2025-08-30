import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get application status' })
  @ApiResponse({
    status: 200,
    description: 'Application status with database connection info',
    schema: {
      type: 'string',
      example: 'InfluenceHub-Server - Database Connected',
    },
  })
  async getStatus(): Promise<string> {
    return await this.appService.getHello();
  }
}
