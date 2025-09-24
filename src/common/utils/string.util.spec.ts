// src/common/utils/string.util.spec.ts
describe('StringUtil', () => {
  describe('slugify', () => {
    it('should convert Vietnamese text to slug', () => {
      expect(StringUtil.slugify('Xin Chào Việt Nam')).toBe('xin-chao-viet-nam')
      expect(StringUtil.slugify('Đường Hồ Chí Minh')).toBe('duong-ho-chi-minh')
    })

    it('should handle special characters', () => {
      expect(StringUtil.slugify('Hello @World!')).toBe('hello-world')
      expect(StringUtil.slugify('Test___Multiple---Spaces')).toBe('test-multiple-spaces')
    })
  })

  describe('toId', () => {
    it('should convert valid string to ObjectId', () => {
      const id = '507f1f77bcf86cd799439011'
      const objectId = StringUtil.toId(id)
      expect(objectId.toString()).toBe(id)
    })

    it('should throw error for invalid ObjectId', () => {
      expect(() => StringUtil.toId('invalid-id')).toThrow(BadRequestException)
    })
  })
})