import {
  ConflictException,
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientKafka } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService implements OnApplicationBootstrap, OnModuleDestroy {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject('AUTH_EVENTS_CLIENT')
    private readonly authEventsClient: ClientKafka,
  ) {}

  async onApplicationBootstrap() {
    await this.authEventsClient.connect();
  }

  async onModuleDestroy() {
    await this.authEventsClient.close();
  }

  async register(email: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Böyle bir kayıt mevcut');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(email, hashedPassword);

    this.authEventsClient.emit('auth.user.registered', {
      userId: user.id,
      email: user.email,
      occurredAt: new Date().toISOString(),
    });

    return {
      id: user.id,
      email: user.email,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Geçersiz kullanıcı bilgileri');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Geçersiz kullanıcı bilgileri');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    this.authEventsClient.emit('auth.user.logged_in', {
      userId: user.id,
      email: user.email,
      occurredAt: new Date().toISOString(),
    });

    return {
      access_token: token,
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }
}
