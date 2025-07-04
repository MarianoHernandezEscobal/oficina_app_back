import { Injectable } from '@nestjs/common';
import { CreateDiaOficinDto, CreateUserDto } from './dto/create-dias-ofi.dto';
import { UpdateDiasOfiDto } from './dto/update-dias-ofi.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario, UsuarioDocument } from './schemas/usuarios.schemas';
import { JwtService } from '@nestjs/jwt';
import { DiaOficina, DiaOficinaDocument } from './schemas/dia-oficina.schema';

@Injectable()
export class DiasOfiService {

  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(DiaOficina.name) private diaOficinModel: Model<DiaOficinaDocument>,
    private jwtService: JwtService
  ) { }

  private generarToken(email: string) {
    return this.jwtService.sign({ user: email });
  }

  async createUser(createDiasOfiDto: CreateUserDto) {
    try {
      const nuevo = new this.usuarioModel({ ...createDiasOfiDto });
      const userNuevo = await nuevo.save();
      return { token: `Bearer ${this.generarToken(userNuevo.email)}` };
    } catch (error) {
      console.log(error);
      throw new Error('Error al crear el usuario');
    }
  }

  async findAllUsers(): Promise<Usuario[]> {
    return this.usuarioModel.find().exec();
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
      const nuevo = new this.diaOficinModel({ email: body.email, fecha: body.fechas });
      await nuevo.save();
      return { message: 'Dias registrados correctamente' };
    } catch (error) {
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

  async remove(id: string, email: string) {
    const dia = await this.diaOficinModel.findById(id);
    if (!dia) {
      throw new Error('Registro no encontrado');
    }
    if (dia.email.toString() !== email) {
      throw new Error('No tienes permiso para eliminar este registro');
    }
    return this.diaOficinModel.findByIdAndDelete(id).exec();
  }
}
