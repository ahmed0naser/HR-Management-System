import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DEFAULT_TIME, User } from 'src/users/entities/user.entity';
import { PermissionType } from 'src/common/enums/permission-type.enum';
import { PermissionStatus } from 'src/common/enums/permission-status.enum';

@Entity()
export class PermissionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  employee: User;

  @Column({ type: 'enum', enum: PermissionType })
  type: PermissionType;

  @Column({
    type: 'enum',
    enum: PermissionStatus,
    default: PermissionStatus.Pending,
  })
  status: PermissionStatus;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true, default: null })
  managerComment: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  hrComment: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => DEFAULT_TIME })
  createdAt: Date;
}
