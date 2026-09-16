import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:5173",
  });

  const config = new DocumentBuilder()
    .setTitle('Dai Truong Thanh API')
    .setDescription('Furniture Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);

  console.log(`Server running at: http://localhost:3000`);
  console.log(`Swagger docs: http://localhost:3000/api`);
}

bootstrap();