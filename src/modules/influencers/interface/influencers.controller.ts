import { Body, Controller, Delete, Get, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InfluencersService } from '../influencers.service';
import { ListInfluencersDto } from './dto/list-influencers.dto';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { UpdateInfluencerDto } from './dto/update-influencer.dto';
import { ImportInfluencersDto } from './dto/import-influencers.dto';
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

  @Roles('admin')
  @Post('import')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
        return callback(new Error('Only CSV and Excel files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportInfluencersDto
  ) {
    return this.svc.import(file, dto);
  }
}
