import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 10000;
  app.enableCors({
    origin: ['http://localhost:8100'],
    credentials: true,
  });
  
  await app.listen(port);
}
bootstrap();
