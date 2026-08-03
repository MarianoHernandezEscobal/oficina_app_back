import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDiaOficinDto, CreateUserDto } from './dto/create-dias-ofi.dto';
import { UpdateDiasOfiDto } from './dto/update-dias-ofi.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuarios.schemas';
import { JwtService } from '@nestjs/jwt';
import { DiaOficina, DiaOficinaDocument } from './schemas/dia-oficina.schema';
import { Feriado, FeriadoDocument } from './schemas/feriados.schema';
import { FeriadosDto } from './dto/feriados.dto';
import { LicenciaDto } from './dto/licencia.dto';
import { Licencia, LicenciaDocument } from './schemas/licencias.schemas';
import * as moment from 'moment-timezone';

@Injectable()
export class DiasOfiService {


  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(DiaOficina.name) private diaOficinModel: Model<DiaOficinaDocument>,
    @InjectModel(Feriado.name) private feriadoModel: Model<FeriadoDocument>,
    @InjectModel(Licencia.name) private licenciaModel: Model<LicenciaDocument>,
    private jwtService: JwtService
  ) { }

  /** Parsea YYYY-MM-DD en hora local (evita que UTC reste un día/mes). */
  private parseFechaLocal(fecha: string): Date {
  // Expecting YYYY-MM-DD format, interpret in Argentina timezone
  return moment.tz(fecha, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').toDate();
}

  async diasMeta(fecha: string, email: string) {
    const usuario = await this.usuarioModel.findOne({ email });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const meta = usuario.meta;
    const fechaObj = fecha ? this.parseFechaLocal(fecha) : new Date();
    const mes = fechaObj.getMonth();
    const año = fechaObj.getFullYear();

    const diasEnMes = new Date(año, mes + 1, 0).getDate();

    let diasLaborables = 0;
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fechaDia = new Date(año, mes, dia);
      const diaSemana = fechaDia.getDay();
      if (diaSemana >= 1 && diaSemana <= 5) {
        diasLaborables++;
      }
    }

    const diasOficina = Math.ceil(diasLaborables * (meta / 100));

    const feriados = await this.feriadoModel.find({
      fecha: {
        $gte: new Date(año, mes, 1),
        $lt: new Date(año, mes + 1, 1),
      },
    }).exec();

    const feriadosArray = feriados.map((feriado) => ({
      fecha: feriado.fecha,
      nombre: feriado.nombre,
      descripcion: feriado.descripcion,
    }));

    // Licencias que se solapan con el mes: inicio <= finMes && fin >= inicioMes
    const licencias = await this.licenciaModel.find({
      email,
      fechaInicio: {
        $lte: new Date(año, mes + 1, 0, 23, 59, 59, 999),
      },
      fechaFin: {
        $gte: new Date(año, mes, 1),
      },
    }).exec();

    const licenciasArray = licencias.map((licencia) => ({
      fechaInicio: licencia.fechaInicio,
      fechaFin: licencia.fechaFin,
      dias: licencia.dias,
    }));

    let diasLicencia = 0;

    for (const licencia of licenciasArray) {
      let inicio = new Date(licencia.fechaInicio.getFullYear(), licencia.fechaInicio.getMonth(), licencia.fechaInicio.getDate());
      let fin = new Date(licencia.fechaFin.getFullYear(), licencia.fechaFin.getMonth(), licencia.fechaFin.getDate());

      const inicioMes = new Date(año, mes, 1);
      const finMes = new Date(año, mes + 1, 0);

      if (inicio < inicioMes) inicio = inicioMes;
      if (fin > finMes) fin = finMes;

      let cursor = new Date(inicio);
      while (cursor <= fin) {
        const diaSemana = cursor.getDay();
        if (diaSemana >= 1 && diaSemana <= 5) {
          diasLicencia++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    let feriadosLaborables = 0;
    for (const feriado of feriadosArray) {
      const fechaFeriado = new Date(feriado.fecha);
      const diaSemana = fechaFeriado.getDay();
      if (diaSemana >= 1 && diaSemana <= 5) {
        feriadosLaborables++;
      }
    }

    return {
      diasLicencia,
      diasEnMes,
      diasLaborables,
      feriados: feriadosArray,
      diasPresencialidad: diasOficina,
      diasCumplimiento: diasOficina - feriadosLaborables - diasLicencia,
      mes: mes + 1,
      año,
    };
  }

  private generarToken(email: string) {
    return this.jwtService.sign({ user: email });
  }

  async createUser(createDiasOfiDto: CreateUserDto) {
    try {
      const nuevo = new this.usuarioModel({
        ...createDiasOfiDto,
        meta: createDiasOfiDto.meta || 60
      });
      const userNuevo = await nuevo.save();
      return { token: `Bearer ${this.generarToken(userNuevo.email)}` };
    } catch (error) {
      console.log(error);
      throw new Error('Error al crear el usuario');
    }
  }

  async findUser(email: string): Promise<Usuario> {
    return this.usuarioModel.findOne({ email }).exec();
  }

  async login(email: string, password: string) {
    const user = await this.usuarioModel.findOne({ email });
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    if (user.password !== password) {
      throw new Error('Contraseña incorrecta');
    }
    return { token: `Bearer ${this.generarToken(user.email)}` };
  }

  async fui(body: CreateDiaOficinDto) {
    try {
      // Validar que no sea fin de semana para cada fecha en el array
      for (const fechaString of body.fechas) {
  
        // Parsear la fecha como LOCAL (evita problemas de UTC)
        const fecha = moment.tz(fechaString, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').toDate();
        console.log(fecha);
        const diaSemana = fecha.getDay();
        console.log(diaSemana);
        if (diaSemana === 0 || diaSemana === 6) {
          console.log('No se puede registrar un día de fin de semana');
          throw new BadRequestException(
            'No se puede registrar un día de fin de semana',
          );
        }
        console.log('No es fin de semana');
        // Verificar si ya existe un registro para ese día
        const registroExistente = await this.diaOficinModel.findOne({
          email: body.email,
          fecha: {
            $gte: moment.tz(fechaString, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').startOf('day').toDate(),
            $lt: moment.tz(fechaString, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').add(1, 'day').toDate(),
          },
        });
        console.log(registroExistente);
        if (registroExistente) {
          throw new BadRequestException(
            `Ya existe un registro para el día ${fechaString}`,
          );
        }
      }
  
      // Crear registros para todas las fechas
      const registros = body.fechas.map((fechaString) => ({
        email: body.email,
        fecha: moment.tz(fechaString, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').toDate(),
      }));
  
      await this.diaOficinModel.insertMany(registros);
  
      return {
        message: 'Días registrados correctamente',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
  
      console.error(error);
      throw new Error('Error al registrar el día');
    }
  }

  dias(email: string) {
    return this.diaOficinModel.find({ email }).exec();
  }

  update(id: number, updateDiasOfiDto: UpdateDiasOfiDto) {
    return this.diaOficinModel.findByIdAndUpdate(id, updateDiasOfiDto, { new: true }).exec();
  }

  async remove(fecha: string, email: string) {
    try {
      const fechaObj = new Date(fecha);
      const año = fechaObj.getUTCFullYear();
      const mes = fechaObj.getUTCMonth();
      const dia = fechaObj.getUTCDate();

      const inicioDia = new Date(Date.UTC(año, mes, dia, 0, 0, 0, 0));
      const finDia = new Date(Date.UTC(año, mes, dia + 1, 0, 0, 0, 0));
      const diaOfi = await this.diaOficinModel.findOne({ email, fecha: { $gte: inicioDia, $lt: finDia } });
      if (!diaOfi) {
        throw new BadRequestException('Registro no encontrado');
      }
      if (diaOfi.email.toString() !== email) {
        throw new BadRequestException('No tienes permiso para eliminar este registro');
      }
      return this.diaOficinModel.deleteOne({ email, fecha: { $gte: inicioDia, $lt: finDia } }).exec();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.log(error);
      throw new Error('Error al eliminar el dia');
    }
  }

  async addFeriados(feriados: FeriadosDto[]) {
    const feriadosArray = feriados.map(feriado => {
      const fecha = moment.tz(feriado.fecha, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').toDate();

      return {
        fecha: fecha,
        nombre: feriado.nombre,
        descripcion: feriado.descripcion,
      };
    });
    await this.feriadoModel.insertMany(feriadosArray);
    return { message: 'Feriados agregados correctamente' };
  }

  async addLicencias(licencias: LicenciaDto, email: string) {
    await this.licenciaModel.create({
      ...licencias,
      fechaInicio: this.parseFechaLocal(licencias.fechaInicio),
      fechaFin: this.parseFechaLocal(licencias.fechaFin),
      email: email
    });
    return { message: 'Licencias agregadas correctamente' };
  }

  async getLicencias(email: string, fecha: string) {
    // Sin fecha: devolver todas las licencias del usuario
    if (!fecha) {
      return this.licenciaModel.find({ email }).exec();
    }

    const fechaObj = this.parseFechaLocal(fecha);
    const mes = fechaObj.getMonth();
    const año = fechaObj.getFullYear();

    // Licencias que se solapan con el mes consultado
    const licencias = await this.licenciaModel.find({
      email,
      fechaInicio: {
        $lte: new Date(año, mes + 1, 0, 23, 59, 59, 999),
      },
      fechaFin: {
        $gte: new Date(año, mes, 1),
      },
    }).exec();
    return licencias;
  }

  async calcularDiasLicencias(fechaInicio: string, fechaFin: string) {
    const fechaInicioDate = moment.tz(fechaInicio, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').startOf('day').toDate();
    const fechaFinDate = moment.tz(fechaFin, 'YYYY-MM-DD', 'America/Argentina/Buenos_Aires').endOf('day').toDate();
    let diasLaborables = 0;

    const fechaActual = new Date(fechaInicioDate);
    while (fechaActual <= fechaFinDate) {
      const diaSemana = fechaActual.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasLaborables++;
      }
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    const feriados = await this.feriadoModel.find({
      fecha: { $gte: fechaInicioDate, $lte: fechaFinDate }
    }).exec();

    const diasLaborablesFeriados = diasLaborables - feriados.length;

    return {
      diasLaborables,
      dias: diasLaborablesFeriados,
      feriados: feriados.length,
    };
  }

  async removeLicencia(id: string, email: string) {
    return this.licenciaModel.deleteOne({ _id: id, email }).exec();
  }
}
