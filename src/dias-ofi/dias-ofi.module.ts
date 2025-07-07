import { Module } from '@nestjs/common';
import { DiasOfiService } from './dias-ofi.service';
import { DiasOfiController } from './dias-ofi.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsuarioSchema } from './schemas/usuarios.schemas';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { DiaOficinaSchema } from './schemas/dia-oficina.schema';
import { FeriadoSchema } from './schemas/feriados.schema';
import { LicenciaSchema } from './schemas/licencias.schemas';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature([{ name: 'Usuario', schema: UsuarioSchema }]),
    MongooseModule.forFeature([{ name: 'DiaOficina', schema: DiaOficinaSchema }]),
    MongooseModule.forFeature([{ name: 'Feriado', schema: FeriadoSchema }]),
    MongooseModule.forFeature([{ name: 'Licencia', schema: LicenciaSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret123',
      signOptions: { expiresIn: '60d' },
    }),
  ],
  controllers: [DiasOfiController],
  providers: [DiasOfiService, JwtStrategy],
})
export class DiasOfiModule {}
