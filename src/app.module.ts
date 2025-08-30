import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './shared/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './shared/config/config.module';
import { InfluencersModule } from './modules/influencers/influencers.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, InfluencersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
