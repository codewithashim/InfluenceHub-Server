import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { ConfigService } from 'src/shared/config/config.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Validation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  sign(user: { id: string; email: string; role: 'admin' | 'viewer' }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  async signup(email: string, password: string) {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) throw new HttpException('User already exists', HttpStatus.CONFLICT);

      const saltRounds = parseInt(this.configService.get('BCRYPT_SALT_ROUNDS') || '10');
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
        },
      });

      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Signup failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
