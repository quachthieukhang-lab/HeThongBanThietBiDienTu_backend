import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Enable CORS and allow all origins
  app.enableCors({
    origin: '*', // Allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow specific HTTP methods
    credentials: true, // Allow credentials (optional)
  })

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
