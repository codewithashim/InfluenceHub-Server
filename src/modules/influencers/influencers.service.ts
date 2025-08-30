import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { CreateInfluencerDto } from './interface/dto/create-influencer.dto';
import { ListInfluencersDto, Order, SortKey } from './interface/dto/list-influencers.dto';
import { UpdateInfluencerDto } from './interface/dto/update-influencer.dto';
import { ImportInfluencersDto, ImportMode } from './interface/dto/import-influencers.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';

@Injectable()
export class InfluencersService {
  constructor(private prisma: PrismaService) { }

  async list(q: ListInfluencersDto) {
    const where: any = {};
    if (q.platform) where.platform = q.platform;
    if (q.min_followers != null) where.followers = { gte: q.min_followers };
    if (q.country) where.country = q.country.toUpperCase();
    if (q.category) where.categories = { has: q.category };
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { username: { contains: q.q, mode: 'insensitive' } },
      ];
    }

    const orderBy =
      q.sort === SortKey.engagement_rate
        ? { engagementRate: q.order === Order.asc ? 'asc' as const : 'desc' as const }
        : q.sort === SortKey.followers
          ? { followers: q.order === Order.asc ? 'asc' as const : 'desc' as const }
          : { createdAt: 'desc' as const };
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 25;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.influencer.count({ where }),
      this.prisma.influencer.findMany({
        where, orderBy, skip, take,
        select: {
          id: true, name: true, platform: true, username: true, followers: true,
          engagementRate: true, country: true, categories: true, email: true,
          createdAt: true, updatedAt: true
        },
      }),
    ]);

    return { data, page, pageSize, total };
  }

  async get(id: string) {
    const found = await this.prisma.influencer.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Influencer not found');
    return found;
  }

  async create(dto: CreateInfluencerDto) {
    try {
      return await this.prisma.influencer.create({
        data: {
          name: dto.name,
          platform: dto.platform,
          username: dto.username,
          followers: dto.followers,
          engagementRate: dto.engagement_rate,
          country: dto.country?.toUpperCase(),
          categories: dto.categories,
          email: dto.email ?? null,
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('platform + username must be unique');
      throw e;
    }
  }

  async update(id: string, dto: UpdateInfluencerDto) {
    try {
      return await this.prisma.influencer.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.platform && { platform: dto.platform }),
          ...(dto.username && { username: dto.username }),
          ...(dto.followers != null && { followers: dto.followers }),
          ...(dto.engagement_rate != null && { engagementRate: dto.engagement_rate }),
          ...(dto.country && { country: dto.country.toUpperCase() }),
          ...(dto.categories && { categories: dto.categories }),
          ...(dto.email !== undefined && { email: dto.email }),
        },
      });
    } catch (e: any) {
      if (e.code === 'P2002') throw new BadRequestException('platform + username must be unique');
      throw e;
    }
  }

  async remove(id: string) {
    await this.prisma.influencer.delete({ where: { id } });
  }

  async import(file: Express.Multer.File, dto: ImportInfluencersDto) {
    const filePath = file.path;
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

    let data: any[] = [];

    try {
      if (fileExtension === 'csv') {
        data = await this.parseCSV(filePath);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await this.parseExcel(filePath);
      } else {
        throw new BadRequestException('Unsupported file format');
      }

      const results = await this.processImportData(data, dto.mode || ImportMode.UPSERT);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return {
        message: 'Import completed successfully',
        totalProcessed: data.length,
        created: results.created,
        updated: results.updated,
        errors: results.errors,
      };
    } catch (error) {
      // Clean up uploaded file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  private async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  private async parseExcel(filePath: string): Promise<any[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  }

  private async processImportData(data: any[], mode: ImportMode) {
    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const row of data) {
      try {
        const influencerData = this.mapRowToInfluencerData(row);

        if (mode === ImportMode.CREATE) {
          await this.create(influencerData);
          results.created++;
        } else if (mode === ImportMode.UPDATE) {
          const existing = await this.prisma.influencer.findFirst({
            where: {
              platform: influencerData.platform,
              username: influencerData.username,
            },
          });
          if (existing) {
            await this.update(existing.id, influencerData);
            results.updated++;
          } else {
            results.errors.push(`Influencer ${influencerData.username} not found for update`);
          }
        } else if (mode === ImportMode.UPSERT) {
          const existing = await this.prisma.influencer.findFirst({
            where: {
              platform: influencerData.platform,
              username: influencerData.username,
            },
          });
          if (existing) {
            await this.update(existing.id, influencerData);
            results.updated++;
          } else {
            await this.create(influencerData);
            results.created++;
          }
        }
      } catch (error: any) {
        results.errors.push(`Row error: ${error.message}`);
      }
    }

    return results;
  }

  private mapRowToInfluencerData(row: any): CreateInfluencerDto {
    // Normalize column names (handle different cases and formats)
    const normalizedRow: any = {};
    Object.keys(row).forEach(key => {
      normalizedRow[key.toLowerCase().replace(/\s+/g, '_')] = row[key];
    });

    // Map common column name variations
    const name = normalizedRow.name || normalizedRow.full_name || normalizedRow.influencer_name || '';
    const platform = this.normalizePlatform(normalizedRow.platform || normalizedRow.social_platform || '');
    const username = normalizedRow.username || normalizedRow.handle || normalizedRow.account || '';
    const followers = this.parseNumber(normalizedRow.followers || normalizedRow.follower_count || 0);
    const engagementRate = this.parseNumber(normalizedRow.engagement_rate || normalizedRow.engagement || 0);
    const country = normalizedRow.country || normalizedRow.location || '';
    const categories = this.parseCategories(normalizedRow.categories || normalizedRow.category || normalizedRow.tags || '');
    const email = normalizedRow.email || normalizedRow.contact_email || null;

    if (!name || !platform || !username) {
      throw new BadRequestException('Missing required fields: name, platform, username');
    }

    return {
      name: String(name).trim(),
      platform,
      username: String(username).trim(),
      followers,
      engagement_rate: Math.min(engagementRate, 100), // Cap at 100%
      country: country ? String(country).trim().toUpperCase() : undefined,
      categories,
      email: email ? String(email).trim() : null,
    };
  }

  private normalizePlatform(platform: string): any {
    const normalized = String(platform).toLowerCase().trim();
    switch (normalized) {
      case 'instagram':
      case 'ig':
        return 'instagram';
      case 'tiktok':
      case 'tt':
        return 'tiktok';
      case 'youtube':
      case 'yt':
        return 'youtube';
      case 'twitter':
      case 'x':
        return 'x';
      default:
        throw new BadRequestException(`Invalid platform: ${platform}`);
    }
  }

  private parseNumber(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Remove commas and other formatting
      const cleaned = value.replace(/,/g, '').trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private parseCategories(value: any): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(/[,;|]/).map(cat => cat.trim()).filter(cat => cat.length > 0);
    }
    return [];
  }
}
