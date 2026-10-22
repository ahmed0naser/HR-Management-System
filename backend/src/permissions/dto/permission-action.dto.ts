import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PermissionAction } from 'src/common/enums/permission-action.enum';

export class PermissionActionDto {
  @IsEnum(PermissionAction)
  action: PermissionAction;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  comment?: string;
}
