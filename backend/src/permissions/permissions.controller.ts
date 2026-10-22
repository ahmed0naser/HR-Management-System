import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guards';
import type { payloadType } from 'src/common/types/payloadType';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() user: payloadType,
  ) {
    return this.permissionsService.create(dto, user);
  }

  @Get('/my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getMyPermissions(@CurrentUser() user: payloadType) {
    return this.permissionsService.findMine(user);
  }
}
