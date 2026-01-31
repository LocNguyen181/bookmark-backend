import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, PrismaService],
  exports: [BookmarksService],
})
export class BookmarksModule { }
