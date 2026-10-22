import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionRequest } from './entities/permission-request.entity';
import { User } from 'src/users/entities/user.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionRequest, User])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
})
export class PermissionsModule {}
