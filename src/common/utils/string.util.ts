// src/common/utils/string.util.ts
import { BadRequestException } from '@nestjs/common'
import { Types } from 'mongoose'

export class StringUtil {
  /**
   * Convert string to URL-friendly slug
   */
  static slugify(input: string): string {
    if (!input) return ''

    return input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]+/g, '') // Remove invalid chars
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/-+/g, '-') // Replace multiple - with single -
      .replace(/(^-|-$)+/g, '') // Trim - from both ends
  }

  /**
   * Convert string to MongoDB ObjectId with validation
   */
  static toId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id')
    return new Types.ObjectId(id)
  }

  /**
   * Validate MongoDB ObjectId without throwing error
   */
  static isValidObjectId(id: string): boolean {
    return Types.ObjectId.isValid(id)
  }

  /**
   * Generate slug with counter for uniqueness
   */
  static generateUniqueSlug(base: string, existingSlugs: string[]): string {
    let slug = this.slugify(base)
    let counter = 1
    let uniqueSlug = slug

    while (existingSlugs.includes(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    return uniqueSlug
  }
}