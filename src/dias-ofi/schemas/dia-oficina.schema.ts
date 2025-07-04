import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DiaOficinaDocument = DiaOficina & Document;

@Schema()
export class DiaOficina {

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  email: Types.ObjectId;

  @Prop({ type: Date, required: true })
  fecha: Date;
}

export const DiaOficinaSchema = SchemaFactory.createForClass(DiaOficina);
