import { Controller, Get, Post, Body, Delete, Param, Query } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';

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
  async create(@Body() body: { url: string; tags?: string[]; actressName?: string; title?: string }) {
    return this.bookmarksService.create(body.url, body.tags, body.actressName, body.title);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.bookmarksService.delete(id);
  }
  @Get('search')
  searchByKeyword(@Query('keyword') keyword: string): Promise<any[]> {
    return this.bookmarksService.searchItem(keyword);
  }

  @Get('actress')
  searchByActress(@Query('name') name: string): Promise<any[]> {
    return this.bookmarksService.searchByActress(name);
  }

  @Get('actress-list')
  listUniqueActresses(@Query('query') query?: string): Promise<string[]> {
    return this.bookmarksService.listUniqueActresses(query);
  }

  @Post(':id/tags')
  async addTagsToBookmark(
    @Param('id') id: string,
    @Body() body: { tags: string[] },
  ): Promise<void> {
    return this.bookmarksService.addTags(id, body.tags);
  }

  @Get('fetch-info')
  async fetchInfo(@Query('url') url: string) {
    const title = await this.bookmarksService.fetchTitle(url);
    return { title };
  }

  @Post('sync-titles')
  async syncTitles() {
    return this.bookmarksService.syncAllTitles();
  }
}