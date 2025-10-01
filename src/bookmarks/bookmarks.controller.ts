import { Controller, Get, Post, Body, Delete, Param, Query } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './bookmark.model';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) { }

  @Get()
  getAll(): Promise<Bookmark[]> {
    return this.bookmarksService.getBookmarks();
  }

  @Post()
  async create(@Body() body: { url: string; tags?: string[] | string }) {
    console.log('Received body:', body);
    return this.bookmarksService.create(body.url, body.tags);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.bookmarksService.delete(id);
  }
  @Get('getByKeyWord')
  getByKeyWord(@Query('key') key: string): Promise<Bookmark[]> {
    return this.bookmarksService.searchItem(key);
  }

  @Post(':id/tags')
  async addTagsToBookmark(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ): Promise<void> {
    return this.bookmarksService.addTags(id, body.tags);
  }
}