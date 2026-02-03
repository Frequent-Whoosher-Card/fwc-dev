import TelegramBot from "node-telegram-bot-api";

export class TelegramService {
  /**
   * Sends a message using a specific bot token.
   * Instantiates a lightweight client for the request.
   */
  static async sendMessage(token: string, chatId: string, message: string) {
    try {
      // Create a new instance for this request (polling: false means no long-lived connection)
      const bot = new TelegramBot(token, { polling: false });

      await bot.sendMessage(chatId, message, {
        parse_mode: "Markdown",
      });
    } catch (error: any) {
      // Enhance error message for debugging
      throw new Error(`TelegramService Error: ${error.message || error}`);
    }
  }
}
