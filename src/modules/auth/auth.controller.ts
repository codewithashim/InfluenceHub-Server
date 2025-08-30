import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { ConfigService } from 'src/shared/config/config.service';
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      name: string;
    };
  }
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: SignupDto })
  
  async signup(@Body() signupDto: SignupDto) {
    try {
      const user = await this.auth.signup(signupDto.email, signupDto.password);
      return { user: { id: user.id, email: user.email, role: user.role } };
    } catch (error) {
      throw new HttpException('Signup failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: LoginDto })
  
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const user = await this.auth.validateUser(loginDto.email, loginDto.password);
      const token = this.auth.sign(user);
      const isCookieMode = (this.configService.get('AUTH_COOKIE') || 'true').toLowerCase() === 'true';
      if (isCookieMode) {
        const cookieName = this.configService.get('COOKIE_NAME') || 'access_token';
        const cookieSecure = (this.configService.get('COOKIE_SECURE') || 'false').toLowerCase() === 'true';
        response.cookie(cookieName, token, {
          httpOnly: true,
          secure: cookieSecure,
          sameSite: 'lax',
          maxAge: 1000 * 60 * 60 * 24 * 7,
        });
        return { token, user: { id: user.id, email: user.email, role: user.role } };
      }
      return { token, user: { id: user.id, email: user.email, role: user.role } };
    } catch (error) {
      throw new HttpException('Login failed', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  logout(@Res({ passthrough: true }) response: Response) {
    try {
      const isCookieMode = (this.configService.get('AUTH_COOKIE') || 'true').toLowerCase() === 'true';
      if (isCookieMode) {
        const cookieName = this.configService.get('COOKIE_NAME') || 'access_token';
        response.clearCookie(cookieName);
      }
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new HttpException('Logout failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getCurrentUser(@Req() request: Request) {
    try {
      const user: any = request.user || {};
      return { user: { id: user.id, email: user.email, role: user.role, name: user.name } };
    } catch (error) {
      throw new HttpException('Failed to get user info', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
