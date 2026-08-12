import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guards';
import { AttendanceRuleService } from './attendance-rule.service';
import { ShiftType } from 'src/common/enums/shiftType.enum';
import { CreateAttendanceRuleDto } from './dto/createAttendanceRule.dto';
import { UpdateAttendanceRuleDto } from './dto/updateAttendanceRule.dto';

@Controller('attendance-rule')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RolesEnum.Admin, RolesEnum.HR_Manager)
export class AttendanceRuleController {
  constructor(private readonly attendanceRuleService: AttendanceRuleService) {}
  @Get()
  getAllRules() {
    return this.attendanceRuleService.findAll();
  }
  @Get('/:shift')
  getRule(@Param('shift') shift: ShiftType) {
    return this.attendanceRuleService.findOne(shift);
  }
  @Post()
  createRule(@Body() dto: CreateAttendanceRuleDto) {
    return this.attendanceRuleService.create(dto);
  }
  @Patch('/:id')
  updateRule(@Param('id') id: string, @Body() dto: UpdateAttendanceRuleDto) {
    return this.attendanceRuleService.update(id, dto);
  }
}
