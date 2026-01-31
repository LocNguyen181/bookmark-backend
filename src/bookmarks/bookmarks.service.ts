import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Bookmark, BookmarkDocument } from './bookmark.model';
import { Model } from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
@Injectable()
export class BookmarksService {
  constructor(
    @InjectModel(Bookmark.name)
    private readonly bookmarkModel: Model<BookmarkDocument>,
  ) { }

  async getBookmarks(page: number = 1, limit: number = 10): Promise<{ items: Bookmark[], totalPages: number, total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.bookmarkModel.find().skip(skip).limit(limit).exec(),
        this.bookmarkModel.countDocuments().exec()
      ]);
      return {
        items,
        totalPages: Math.ceil(total / limit),
        total
      };
    } catch (e) {
      throw new Error('Got Error');
    }
  }

  async create(url: string, tags?: string[] | string): Promise<Bookmark> {
    try {
      const title = await this.fetchTitle(url);

      const normalized = Array.isArray(tags) ? tags : (typeof tags === 'string' ? [tags] : []);
      const cleanedTags = (normalized || [])
        .map(t => (t ?? '').toString().trim())
        .filter(t => t.length > 0);

      const newBookmark = new this.bookmarkModel({
        url,
        title,
        ...(cleanedTags.length > 0 ? { tags: cleanedTags } : {}),
      });
      return newBookmark.save();
    } catch (e) {
      throw new Error('Got Error');
    }

  }

  async delete(id: string): Promise<void> {
    await this.bookmarkModel.findByIdAndDelete(id);
  }

  async searchItem(key: string): Promise<Bookmark[]> {
    try {
      const result = await this.getBookmarks();
      const keyword = key;
      return result.items.filter(bookmark =>
        bookmark.title.toLowerCase().includes(keyword.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(keyword.toLowerCase()),
      );
    } catch (e) {
      throw new Error('Got Error');
    }
  }

  private async fetchTitle(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)'
        },
        timeout: 7000,
      });
      const html = response.data as string;
      const $ = cheerio.load(html);

      const getMeta = (selector: string) => $(selector).attr('content')?.toString().trim() || '';
      const collapseWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

      // Prefer explicit metadata first
      const candidates: string[] = [
        getMeta('meta[property="og:title"]'),
        getMeta('meta[name="twitter:title"]'),
        getMeta('meta[name="title"]'),
        $('head > title').first().text().trim(),
      ].filter(Boolean);

      const raw = candidates.find(Boolean) || '';
      const cleaned = collapseWhitespace(raw);

      return cleaned || url;
    } catch (err) {
      console.warn(`Failed to fetch title from ${url}`);
      return url;
    }
  }

  async addTags(id: string, tags: string[] | string): Promise<void> {
    const normalized = Array.isArray(tags) ? tags : [tags];
    const cleaned = normalized
      .map(t => (t ?? '').toString().trim())
      .filter(t => t.length > 0);
    if (cleaned.length === 0) return;

    await this.bookmarkModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { tags: { $each: cleaned } } },
        { upsert: false }
      )
      .exec();
  }
}