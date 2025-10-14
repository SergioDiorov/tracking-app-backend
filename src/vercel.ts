import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import * as bodyParser from 'body-parser';

let appServer: express.Express | null = null;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (!appServer) {
    const expressApp = express();

    expressApp.use((req, res, next) => {
      if (req.url?.startsWith('/api')) {
        next();
      } else {
        bodyParser.json()(req, res, next);
      }
    });

    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter, {
      bodyParser: false,
    });

    app.enableCors({
      origin: process.env.FRONTEND_ORIGIN_URL,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    await app.init();
    appServer = expressApp;
  }

  return appServer(req, res);
}
