import { Module } from '@nestjs/common';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appEnv = configService.get<string>('APP_ENV');
        let uri = '';
        if (appEnv === 'production') {
          uri = configService.get<string>('PROD_URI');
        } else if (appEnv === 'test') {
          uri = configService.get<string>('TEST_URI')
        } else {
          uri = configService.get<string>('PRODLOCAL_URI');
        }

        if (!uri) {
          throw new Error('MONGO_URI is undefined. Please set the environment variable.');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    BookmarksModule,
  ],
})
export class AppModule {}
