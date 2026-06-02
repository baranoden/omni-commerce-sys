import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.AUTH_DB_HOST ?? 'localhost',
      port: Number(process.env.AUTH_DB_PORT ?? 5432),
      username: process.env.AUTH_DB_USERNAME ?? 'postgres',
      password: process.env.AUTH_DB_PASSWORD ?? '123456',
      database: process.env.AUTH_DB_NAME ?? 'auth_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
  ],
})
export class AppModule {}
