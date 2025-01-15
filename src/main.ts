import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/helpers/error-handler';
import { winstonConfig } from './common/helpers/winston.logger';

async function start() {
  try {
    const PORT = process.env.PORT || 3000;
    const app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger(winstonConfig),
    });
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    app.useGlobalFilters(new AllExceptionsFilter());

    const config = new DocumentBuilder()
      .addBearerAuth()
      .setTitle('FurniBayt')
      .setDescription('FurniBayt saytining Swagger REST API proyekti')
      .setVersion('1.0')
      .addTag('nestjs,validation,swagger,sequelize,pg,guard')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(PORT, () => {
      console.log(`Server started at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}
start();
