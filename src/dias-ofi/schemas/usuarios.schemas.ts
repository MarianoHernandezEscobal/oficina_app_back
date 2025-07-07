import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

@Schema()
export class Usuario {
  nombre: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password: string;

  @Prop()
  createdAt: Date;

  @Prop()
  meta: number;

}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
