import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Bot, Context, Keyboard } from '@maxhub/max-bot-api';
import { BotService } from './bot.service';

@Injectable()
export class BotLauncher implements OnModuleInit {
  private readonly logger = new Logger(BotLauncher.name);
  private bot: Bot<Context>;

  constructor(private readonly botService: BotService) {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error('BOT_TOKEN не задан в .env');
    this.bot = new Bot<Context>(
      'f9LHodD0cOKNe1V91C1ebG2JOeXTPNNLxh7o0XKrkgqmv74UcyaV7EJe6aDyx5U7tqG14T9VmpikSeqZAV-m',
    );
  }

  private async sendWelcome(ctx: Context) {
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

  onModuleInit() {
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
