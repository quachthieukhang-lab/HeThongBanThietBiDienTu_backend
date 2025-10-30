import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  // req.user được gắn bởi JwtAuthGuard hoặc JwtOptionalAuthGuard
  // payload có dạng: { sub, email, roles }
  // chúng ta sẽ trả về toàn bộ payload
  return request.user
})
