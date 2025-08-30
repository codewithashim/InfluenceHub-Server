import { IsArray, IsEmail, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Platform } from './list-influencers.dto';

export class CreateInfluencerDto {
  @IsString() name: string;
  @IsEnum(Platform) platform: Platform;
  @IsString() username: string;
  @IsInt() @Min(0) followers: number;
  @IsNumber() @Min(0) @Max(100) engagement_rate: number;
  @IsOptional() @IsString() country?: string;
  @IsArray() @IsString({ each: true }) categories: string[];
  @IsOptional() @IsEmail() email?: string | null;
}
