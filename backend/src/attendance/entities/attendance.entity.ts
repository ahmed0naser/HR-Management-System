import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DEFAULT_TIME, User } from 'src/users/entities/user.entity';
import { AttendanceStatus } from 'src/common/enums/attendanceStatus.enum';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  employee: User; // whose attendance this record is about

  @ManyToOne(() => User)
  recordedBy: User; // which Security Officer entered it

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamp', nullable: true })
  checkIn: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  checkOut: Date | null;

  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ default: false })
  isLate: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => DEFAULT_TIME })
  createdAt: Date;
}
