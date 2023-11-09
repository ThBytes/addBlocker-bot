const { Telegraf } = require("telegraf");
const dotEnv = require("dotenv");

const { connectDB } = require("./config/DB.js");
const { User } = require("./models/User.js");

//! Load config
dotEnv.config({ path: "./config/config.env" });

//! Connect to DB
connectDB();

//! initialize
const bot = new Telegraf(process.env.BOT_TOKEN);

//! Handle Evenets
bot.start((ctx) => ctx.reply("Welcome"));

bot.on("left_chat_member", async (ctx) => {
  try {
    let leftuser = ctx.message.left_chat_member;

    const user = await User.findOne({ telegramId: leftuser.id });

    await User.findByIdAndDelete(user._id);

    ctx.reply(`Bye! ${user.username}`);
  } catch (err) {
    console.log(err);
  }
});

bot.on("new_chat_members", async (ctx) => {
  try {
    let newUsers = [];

    ctx.message.new_chat_members.map((user) => {
      newUsers.push({ telegramId: user.id, username: user.username });
    });

    await User.create(newUsers);

    newUsers.forEach((user) => {
      ctx.reply(`Welcome to our Group! ${user.username}`);
    });
  } catch (err) {
    console.log(err);
  }
});

bot.on("message", async (ctx) => {
  try {
    if (ctx.chat.type === "group" || ctx.chat.type === "supergroup") {
      const messageText = ctx.message.text || "";
      const telegramUrlRegex = /(https?:\/\/t\.me\/[^\s]+)/g;

      if (messageText.match(telegramUrlRegex)) {
        const username = ctx.message.from.username;

        const user = await User.findOne({ telegramId: ctx.message.from.id });

        if (!user) {
          return;
        }

        user.warningCount++;

        if (user.warningCount >= 3) {
          await User.findByIdAndDelete(user._id);
          const warningMessage = `⚠️ Warning: @${username} shared a Telegram URL. You are Banned From this Group.`;
          ctx.reply(warningMessage);
          ctx.banChatMember(ctx.message.from.id);
        } else {
          await user.save();
          ctx.deleteMessage();
          const warningMessage = `⚠️ Warning: @${username} shared a Telegram URL.Your Warnings: ${user.warningCount}`;
          ctx.reply(warningMessage);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
});

//! Launch the bot
bot.launch();

//! Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
