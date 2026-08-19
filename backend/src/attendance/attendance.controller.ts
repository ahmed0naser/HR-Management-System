import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/createAttendance.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import type { payloadType } from 'src/common/types/payloadType';
import { RolesGuard } from 'src/common/guards/roles.guards';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { AuthGuard } from '@nestjs/passport';
import { UpdateAttendanceDto } from './dto/UpdateAttendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Security_Officer)
  createAttendanceRecord(
    @Body() dto: CreateAttendanceDto,
    @CurrentUser() officer: payloadType,
  ) {
    return this.attendanceService.create(dto, officer.sub);
  }
  @Patch('/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Security_Officer)
  updateAttendanceRecord(
    @Body() dto: UpdateAttendanceDto,
    @Param('id') id: string,
  ) {
    return this.attendanceService.update(id, dto);
  }
  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  getOne(@Param('id') id: string, @CurrentUser() user: payloadType) {
    return this.attendanceService.findOne(id, user);
  }
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin, RolesEnum.HR_Manager, RolesEnum.Manager)
  getAll(
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.attendanceService.find(pageNumber, limit);
  }
}
