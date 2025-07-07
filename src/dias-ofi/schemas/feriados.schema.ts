import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeriadoDocument = Feriado & Document;

@Schema()
export class Feriado {

    @Prop({ required: true })
    fecha: Date;

    @Prop({ required: true })
    nombre: string;

    @Prop()
    descripcion: string;

}

export const FeriadoSchema = SchemaFactory.createForClass(Feriado);
