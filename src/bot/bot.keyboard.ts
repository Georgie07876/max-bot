import { BotButtons } from './bot.buttons';

interface IMaxButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export const getMainMenu = (): IMaxButton[][] => {
  const res = BotButtons.mainMenu();
  return res;
};
