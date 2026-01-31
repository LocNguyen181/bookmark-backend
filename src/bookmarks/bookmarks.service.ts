import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) { }

  async getBookmarks(page: number = 1, limit: number = 10): Promise<{ items: any[], totalPages: number, total: number }> {
    try {
      const skip = (page - 1) * Number(limit);
      const take = Number(limit);

      const [items, total] = await Promise.all([
        this.prisma.bookmark.findMany({
          skip,
          take,
          orderBy: { dateAdded: 'desc' },
        }),
        this.prisma.bookmark.count(),
      ]);

      const formattedItems = items.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
      }));

      return {
        items: formattedItems,
        totalPages: Math.ceil(total / take),
        total,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Got Error');
    }
  }

  async create(url: string, tags?: string[] | string): Promise<any> {
    try {
      const title = await this.fetchTitle(url);

      const normalized = Array.isArray(tags) ? tags : (typeof tags === 'string' ? [tags] : []);
      const cleanedTags = (normalized || [])
        .map(t => (t ?? '').toString().trim())
        .filter(t => t.length > 0);

      const result = await this.prisma.bookmark.create({
        data: {
          url,
          title,
          tags: cleanedTags.length > 0 ? JSON.stringify(cleanedTags) : null,
        },
      });

      return {
        ...result,
        tags: cleanedTags,
      };
    } catch (e) {
      console.error(e);
      throw new Error('Got Error');
    }
  }

  async delete(id: string | number): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    await this.prisma.bookmark.delete({
      where: { id: numericId },
    });
  }

  async searchItem(key: string): Promise<any[]> {
    try {
      const items = await this.prisma.bookmark.findMany({
        where: {
          OR: [
            { title: { contains: key } },
            { url: { contains: key } },
          ],
        },
      });

      return items.map(item => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
      }));
    } catch (e) {
      console.error(e);
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

  async addTags(id: string | number, tags: string[] | string): Promise<void> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const normalized = Array.isArray(tags) ? tags : [tags];
    const cleaned = normalized
      .map(t => (t ?? '').toString().trim())
      .filter(t => t.length > 0);

    if (cleaned.length === 0) return;

    const bookmark = await this.prisma.bookmark.findUnique({
      where: { id: numericId },
    });

    if (!bookmark) return;

    const currentTags: string[] = bookmark.tags ? JSON.parse(bookmark.tags) : [];
    const updatedTags = Array.from(new Set([...currentTags, ...cleaned]));

    await this.prisma.bookmark.update({
      where: { id: numericId },
      data: {
        tags: JSON.stringify(updatedTags),
      },
    });
  }
}