import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { DiasOfiModule } from './dias-ofi/dias-ofi.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    DiasOfiModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
