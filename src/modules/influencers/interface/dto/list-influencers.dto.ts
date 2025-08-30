import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortKey { followers='followers', engagement_rate='engagement_rate' }
export enum Order { asc='asc', desc='desc' }
export enum Platform { instagram='instagram', tiktok='tiktok', youtube='youtube', x='x' }

export class ListInfluencersDto {
  @IsOptional() @IsEnum(Platform) platform?: Platform;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) min_followers?: number;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() q?: string;

  @IsOptional() @IsEnum(SortKey) sort?: SortKey;
  @IsOptional() @IsEnum(Order) order?: Order;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize: number = 25;
}
