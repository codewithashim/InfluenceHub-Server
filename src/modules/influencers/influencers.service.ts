import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
 
import { CreateInfluencerDto } from './interface/dto/create-influencer.dto';
import { ListInfluencersDto, Order, SortKey } from './interface/dto/list-influencers.dto';
import { UpdateInfluencerDto } from './interface/dto/update-influencer.dto';
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
}
