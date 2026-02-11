import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserSettingsService } from './user-settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class UserSettingsController {
  constructor(private readonly settingsService: UserSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user settings' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.settingsService.getSettings(user.sub);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user settings (partial)' })
  updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.settingsService.updateSettings(user.sub, dto);
  }
}
