import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('HOST'),
        port: config.get<number>('PG_PORT'),
        username: config.get<string>('PG_USERNAME'),
        password: config.get<string>('PG_PASSWORD'),
        database: 'HR_System',
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') === 'dev' ? true : false,
      }),
    }),
    AuthModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
