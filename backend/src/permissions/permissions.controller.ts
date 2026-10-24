import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionActionDto } from './dto/permission-action.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guards';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { PermissionStatus } from 'src/common/enums/permission-status.enum';
import { PermissionType } from 'src/common/enums/permission-type.enum';
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

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin, RolesEnum.HR_Manager, RolesEnum.Manager)
  getAllPermissions(
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new ParseEnumPipe(PermissionStatus, { optional: true }))
    status: PermissionStatus | undefined,
    @Query('type', new ParseEnumPipe(PermissionType, { optional: true }))
    type: PermissionType | undefined,
    @CurrentUser() user: payloadType,
  ) {
    return this.permissionsService.findAll(
      pageNumber,
      limit,
      status,
      type,
      user,
    );
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: payloadType,
  ) {
    return this.permissionsService.findOne(id, user);
  }

  @Patch('/:id/manager-action')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Manager)
  managerAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PermissionActionDto,
    @CurrentUser() user: payloadType,
  ) {
    return this.permissionsService.managerAction(id, dto, user);
  }

  @Patch('/:id/hr-action')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.HR_Manager, RolesEnum.Admin)
  hrAction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PermissionActionDto,
    @CurrentUser() user: payloadType,
  ) {
    return this.permissionsService.hrAction(id, dto, user);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  cancelPermission(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: payloadType,
  ) {
    return this.permissionsService.cancel(id, user);
  }
}
