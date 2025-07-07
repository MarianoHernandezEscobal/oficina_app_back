import { Controller, Get, Post, Body, Request,  UseGuards, Delete, Query } from '@nestjs/common';
import { DiasOfiService } from './dias-ofi.service';
import { UpdateDiasOfiDto } from './dto/update-dias-ofi.dto';
import { CreateUserDto } from './dto/create-dias-ofi.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { FeriadosDto } from './dto/feriados.dto';
import { LicenciaDto } from './dto/licencia.dto';

@Controller('dias-ofi')
export class DiasOfiController {
  constructor(private readonly diasOfiService: DiasOfiService) {}

  @Post('users')
  createUser(@Body() createDiasOfiDto: CreateUserDto) {
    return this.diasOfiService.createUser(createDiasOfiDto);
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  findUser(@Request() req) {
    return this.diasOfiService.findUser(req.user.email);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.diasOfiService.login(loginDto.email, loginDto.password);
  }

  @Post('fui')
  @UseGuards(AuthGuard('jwt'))
  async registrar(@Request() req, @Body('fechas') fechas: string[]) {
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

  @Get('meta')
  @UseGuards(AuthGuard('jwt'))
  async diasMeta(@Request() req, @Query('fecha') fecha: string) {
    return this.diasOfiService.diasMeta(fecha, req.user.email);
  }

  @Delete('dias')
  @UseGuards(AuthGuard('jwt'))
  async eliminar(@Request() req, @Query('fecha') fecha: string) {
    return this.diasOfiService.remove(fecha, req.user.email);
  }

  @Post('feriados')
  @UseGuards(AuthGuard('jwt'))
  async feriados(@Request() req, @Body('feriados') feriados: FeriadosDto[]) {
    return this.diasOfiService.addFeriados(feriados);
  }

  @Post('licencia')
  @UseGuards(AuthGuard('jwt'))
  async addLicencias(@Request() req, @Body() licencia: LicenciaDto) {
    return this.diasOfiService.addLicencias(licencia, req.user.email);
  }

  @Get('licencias')
  @UseGuards(AuthGuard('jwt'))
  async getLicencias(@Request() req, @Query('fecha') fecha: string) {
    return this.diasOfiService.getLicencias(req.user.email, fecha);
  }

  @Get('dias-licencias')
  @UseGuards(AuthGuard('jwt'))
  async diasLaborables(@Request() req, @Query('fechaInicio') fechaInicio: string, @Query('fechaFin') fechaFin: string) {
    return this.diasOfiService.calcularDiasLicencias(fechaInicio, fechaFin);
  }

}
