import { IsEnum, IsOptional } from 'class-validator';
import { Platform } from './list-influencers.dto';

export enum ImportMode {
  CREATE = 'create',
  UPDATE = 'update',
  UPSERT = 'upsert'
}

export class ImportInfluencersDto {
  @IsOptional()
  @IsEnum(ImportMode)
  mode?: ImportMode = ImportMode.UPSERT;
}
