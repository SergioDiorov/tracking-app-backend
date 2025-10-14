import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return 'Server is running successfully'
  }
}
