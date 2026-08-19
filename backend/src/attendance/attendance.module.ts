import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRuleController } from './attendance-rule.controller';
import { AttendanceRuleService } from './attendance-rule.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { AttendanceRule } from './entities/attendanceRule.entity';

import { UserModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, AttendanceRule]), UserModule],
  controllers: [AttendanceController, AttendanceRuleController],
  providers: [AttendanceService, AttendanceRuleService],
})
export class AttendanceModule {}
