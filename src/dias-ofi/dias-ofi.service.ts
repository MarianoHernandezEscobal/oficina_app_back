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

@Injectable()
export class DiasOfiService {


  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(DiaOficina.name) private diaOficinModel: Model<DiaOficinaDocument>,
    @InjectModel(Feriado.name) private feriadoModel: Model<FeriadoDocument>,
    @InjectModel(Licencia.name) private licenciaModel: Model<LicenciaDocument>,
    private jwtService: JwtService
  ) { }

  async diasMeta(fecha: string, email: string) {
    const usuario = await this.usuarioModel.findOne({ email });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
  
    const meta = usuario.meta;
    const fechaObj = fecha ? new Date(fecha.split('T')[0]) : new Date();
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
  
    const licencias = await this.licenciaModel.find({
      email,
      fechaInicio: {
        $lte: new Date(año, mes + 1, 0),
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
  
    return {
      diasLicencia,
      diasEnMes,
      diasLaborables,
      feriados: feriadosArray,
      diasOficina: diasOficina - feriadosArray.length - diasLicencia,
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
        const fecha = new Date(fechaString);
        const diaSemana = fecha.getDay();
        if (diaSemana === 0 || diaSemana === 6) {
          throw new BadRequestException('No se puede registrar un día de fin de semana');
        }

        // Obtener año, mes y día para la validación
        const año = fecha.getFullYear();
        const mes = fecha.getMonth();
        const dia = fecha.getDate();

        // Verificar si ya existe un registro para el mismo día, mes y año
        const registroExistente = await this.diaOficinModel.findOne({
          email: body.email,
          fecha: {
            $gte: new Date(año, mes, dia, 0, 0, 0, 0),
            $lt: new Date(año, mes, dia + 1, 0, 0, 0, 0)
          }
        });

        if (registroExistente) {
          throw new BadRequestException(`Ya existe un registro para el día ${dia}/${mes + 1}/${año}`);
        }
      }

      // Crear registros para todas las fechas
      const registros = body.fechas.map(fecha => ({
        email: body.email,
        fecha: fecha
      }));

      await this.diaOficinModel.insertMany(registros);
      return { message: 'Dias registrados correctamente' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.log(error);
      throw new Error('Error al registrar el dia');
    }
  }

  dias(email: string) {
    return this.diaOficinModel.find({ email }).exec();
  }

  update(id: number, updateDiasOfiDto: UpdateDiasOfiDto) {
    return this.diaOficinModel.findByIdAndUpdate(id, updateDiasOfiDto, { new: true }).exec();
  }

  async remove(fecha: string, email: string) {
    const dia = await this.diaOficinModel.findOne({ email, fecha: { $gte: new Date(fecha), $lt: new Date(fecha) } });
    if (!dia) {
      throw new Error('Registro no encontrado');
    }
    if (dia.email.toString() !== email) {
      throw new Error('No tienes permiso para eliminar este registro');
    }
    return this.diaOficinModel.deleteOne({ email, fecha: { $gte: new Date(fecha), $lt: new Date(fecha) } }).exec();
  }

  async addFeriados(feriados: FeriadosDto[]) {
    const feriadosArray = feriados.map(feriado => {
      const [year, month, day] = feriado.fecha.split('-').map(Number);
      const fecha = new Date(year, month - 1, day, 12, 0, 0, 0);
      
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
    await this.licenciaModel.insertOne({
      ...licencias,
      email: email
    });
    return { message: 'Licencias agregadas correctamente' };
  }

  async getLicencias(email: string, fecha: string) {
    const fechaObj = fecha ? new Date(fecha) : new Date();
    const mes = fechaObj.getMonth();
    const año = fechaObj.getFullYear();
    const licencias = await this.licenciaModel.find({ 
      email, 
      fechaInicio: { 
        $gte: new Date(año, mes, 1), 
        $lt: new Date(año, mes + 1, 1) 
      } 
    }).exec();    
    return licencias;
  }

  async calcularDiasLicencias(fechaInicio: string, fechaFin: string) {
    const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
    const fechaFinDate = new Date(fechaFin + 'T00:00:00');
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
}
