import { Controller, Get, Post, Body, Delete, Param, Query } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './bookmark.model';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) { }

  @Get()
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return this.bookmarksService.getBookmarks(pageNum, limitNum);
  }

  @Post()
  async create(@Body() body: { url: string }) {
    return this.bookmarksService.create(body.url);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.bookmarksService.delete(id);
  }
  @Get('search')
  searchByKeyword(@Query('keyword') keyword: string): Promise<Bookmark[]> {
    return this.bookmarksService.searchItem(keyword);
  }

  @Post(':id/tags')
  async addTagsToBookmark(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ): Promise<void> {
    return this.bookmarksService.addTags(id, body.tags);
  }
}