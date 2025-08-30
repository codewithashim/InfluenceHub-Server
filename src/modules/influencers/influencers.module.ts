import { Module } from '@nestjs/common';
import { InfluencersController } from './interface/influencers.controller';
import { InfluencersService } from './influencers.service';
import { PrismaModule } from 'src/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InfluencersController],
  providers: [InfluencersService],
})
export class InfluencersModule {}
