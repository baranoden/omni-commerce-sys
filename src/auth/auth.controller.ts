import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Kaydınız oluşturuldu')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Giriş başarılı')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ResponseMessage('Profil bilgileri getirildi')
  getProfile(@Req() req: { user: { userId: number } }) {
    return this.authService.getProfile(req.user.userId);
  }
}
