import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { RolesGuard } from 'src/common/guards/roles.guards';
import { SelfGuard } from 'src/common/guards/self.guard';
import { diskStorage } from 'multer';

@Controller('/users')
export class UserController {
  constructor(private readonly service: UserService) {}
  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin, RolesEnum.HR_Manager)
  getAllUsers(
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.service.findAll(pageNumber, limit);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin, RolesEnum.HR_Manager)
  @Get('/:id')
  getUser(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin, RolesEnum.HR_Manager)
  createUser(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin, RolesEnum.HR_Manager)
  @Patch(':id')
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RolesEnum.Admin)
  @Delete(':id')
  terminateUser(@Param('id') id: string) {
    return this.service.remove(id);
  }
  @Post('/profile-pic/:id')
  @UseGuards(AuthGuard('jwt'), SelfGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/photos',
        filename(req, file, cb) {
          const filename = `${Date.now()}-${Math.round(Math.random() * 1000000)}${file.originalname}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter(req, file, cb) {
        if (
          file.mimetype.startsWith('image') &&
          !file.mimetype.includes('gif')
        ) {
          cb(null, true);
        } else {
          cb(Error('Unaccepted image type please upload a valid image'), false);
        }
      },
    }),
  )
  uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
  ) {
    return this.service.uploadImage(file, id);
  }
}
