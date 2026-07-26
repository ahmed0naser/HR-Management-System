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

@Controller('/users')
export class UserController {
  constructor(private readonly service: UserService) {}
  @Get()
  //   @UseGuards(Admin,HR)
  getAllUsers(
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.service.findAll(pageNumber, limit);
  }
  @Get('/:id')
  //   @UseGuards(Admin,HR,manager)
  getUser(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Post()
  //   @UseGuards(Admin,HR)
  createUser(@Body() dto: CreateUserDto) {
    return this.service.createUser(dto);
  }
  @Patch(':id')
  //   @UseGuards(Admin,HR)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id')
  //   @UseGuards(Admin)
  terminateUser(@Param('id') id: string) {
    return this.service.remove(id);
  }
  //   @Post(':id')
  //   @UseGuards(Admin,HR,self)
  //   @UseInterceptors(FileInterceptor('photo'))
  //   uploadPhoto(@UploadedFile()file){}
}
