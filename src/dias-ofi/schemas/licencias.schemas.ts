import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LicenciaDocument = Licencia & Document;

@Schema()
export class Licencia {

    @Prop({ required: true })
    fechaInicio: Date;

    @Prop({ required: true })
    fechaFin: Date;

    @Prop({ required: true })
    dias: number;

    @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
    email: Types.ObjectId;

    @Prop()
    tipoLicencia: string;

    @Prop()
    descripcion: string;

    @Prop({ required: true })
    descontarDias: boolean;
}

export const LicenciaSchema = SchemaFactory.createForClass(Licencia);
