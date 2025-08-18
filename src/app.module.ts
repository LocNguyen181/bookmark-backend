import { Module } from '@nestjs/common';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    BookmarksModule,
  ],
})
export class AppModule {}
