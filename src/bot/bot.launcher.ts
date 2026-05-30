import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context, Keyboard } from '@maxhub/max-bot-api';
import { BotService } from './bot.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotLauncher implements OnModuleInit {
  private readonly logger = new Logger(BotLauncher.name);
  private bot: Bot<Context>;

  constructor(
    private readonly botService: BotService,
    private readonly configService: ConfigService,
  ) {
    const token = this.configService.getOrThrow<string>('BOT_TOKEN');
    this.bot = new Bot<Context>(token);
  }

  private async sendWelcome(ctx: Context): Promise<void> {
    try {
      const userId = ctx.user?.user_id ? String(ctx.user.user_id) : 'unknown';
      const userName = ctx.user?.name || ctx.user?.username || 'студент';
      await this.botService.updateUserActivity(userId);

      const welcomeText = `👋 Привет, ${userName}!\n👨‍🎓 Я чат‑помощник для студентов РГЭУ (РИНХ). Готов помочь!`;
      const keyboard = this.botService.getMainMenuKeyboard();

      await ctx.reply(welcomeText, {
        attachments: [Keyboard.inlineKeyboard(keyboard)],
        format: 'markdown',
      });
    } catch (err: unknown) {
      this.logger.error(
        `Ошибка приветствия: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  onModuleInit(): void {
    this.logger.log('Инициализация МАКС бота...');

    this.bot.use(async (ctx, next) => {
      this.logger.log(`Обновление: ${ctx.updateType}`);
      return next();
    });

    this.bot.command('start', async (ctx) => {
      await this.sendWelcome(ctx);
    });

    this.bot.on('bot_started', async (ctx) => {
      await this.sendWelcome(ctx);
    });

    this.bot.action(/.*/, async (ctx) => {
      try {
        const userId = ctx.user?.user_id ? String(ctx.user.user_id) : 'unknown';
        const data = ctx.match ? ctx.match[0] : '';
        const userName = ctx.user?.name || ctx.user?.username || 'студент';
        if (!data) return;

        await this.botService.updateUserActivity(userId);
        const response = this.botService.handleCallback(data, userName);

        await ctx.answerOnCallback({
          message: {
            text: response.text,
            attachments: [
              Keyboard.inlineKeyboard(
                response.reply_markup?.inline_keyboard || [],
              ),
            ],
            format: 'markdown',
          },
        });
      } catch (err: unknown) {
        this.logger.error(
          `Ошибка action: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    });

    this.bot
      .start()
      .then(() => this.logger.log('Бот запущен'))
      .catch((err: unknown) =>
        this.logger.error(`Ошибка запуска: ${String(err)}`),
      );
  }
}
