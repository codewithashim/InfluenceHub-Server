import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { InfluencersService } from '../influencers.service';
import { ListInfluencersDto } from './dto/list-influencers.dto';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { UpdateInfluencerDto } from './dto/update-influencer.dto';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { RolesGuard } from 'src/shared/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('influencers')
export class InfluencersController {
  constructor(private svc: InfluencersService) {}

  @Get()
  async list(@Query() q: ListInfluencersDto) {
    return this.svc.list(q);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Roles('admin')
  @Post()
  async create(@Body() dto: CreateInfluencerDto) {
    return this.svc.create(dto);
  }

  @Roles('admin')
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateInfluencerDto) {
    return this.svc.update(id, dto);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.svc.remove(id);
    return { message: 'deleted' };
  }
}
