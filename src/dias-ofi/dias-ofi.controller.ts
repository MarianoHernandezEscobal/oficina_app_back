import { Controller, Get, Post, Body, Request,  UseGuards, Delete, Query } from '@nestjs/common';
import { DiasOfiService } from './dias-ofi.service';
import { UpdateDiasOfiDto } from './dto/update-dias-ofi.dto';
import { CreateUserDto } from './dto/create-dias-ofi.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('dias-ofi')
export class DiasOfiController {
  constructor(private readonly diasOfiService: DiasOfiService) {}

  @Post('users')
  createUser(@Body() createDiasOfiDto: CreateUserDto) {
    return this.diasOfiService.createUser(createDiasOfiDto);
  }

  @Get('users')
  findAllUsers() {
    return this.diasOfiService.findAllUsers();
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.diasOfiService.login(loginDto.email, loginDto.password);
  }

  @Post('fui')
  @UseGuards(AuthGuard('jwt'))
  async registrar(@Request() req, @Body('fechas') fechas: Date[]) {
    return this.diasOfiService.fui({
      email: req.user.email,
      fechas
    });
  }

  @Get('dias')
  @UseGuards(AuthGuard('jwt'))
  async obtenerPorUsuario(@Request() req) {
    return this.diasOfiService.dias(req.user.email);
  }

  @Delete('dias')
  @UseGuards(AuthGuard('jwt'))
  async eliminar(@Request() req, @Query('id') id: string) {
    return this.diasOfiService.remove(id, req.user.email);
  }

}
