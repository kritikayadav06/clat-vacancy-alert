require("dotenv").config();

const https = require("https");
const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");

const bot = new TelegramBot(process.env.BOT_TOKEN);

const keywords = [
  "spot round",
  "vacant seat",
  "vacancy",
  "admission",
  "counselling",
  "counseling",
  "waitlist",
  "provisional admission",
  "merit list",
  "spot",
  "vacant",
  "vacancy",
  "admission against vacant seats",
  "physical counselling",
  "physical counseling",
  "round",
  "allotment",
];

async function checkCollege(college) {
  try {
    const url = college.url;

  

    const response = await axios.get(url, {
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    });
    const $ = cheerio.load(response.data);

    let savedNotices = [];

    if (fs.existsSync("notices.json")) {
      savedNotices = JSON.parse(fs.readFileSync("notices.json", "utf8"));
    }

    const newNotices = [];

    $("a").each((i, element) => {
      const title = $(element).text().trim();
      const link = $(element).attr("href");

      if (!title || !link) return;

      const lowerTitle = title.toLowerCase();

      const isRelevant = keywords.some((keyword) =>
        lowerTitle.includes(keyword),
      );

      if (isRelevant) {
        const alreadyExists = savedNotices.some(
          (notice) => notice.link === link && notice.college === college.name,
        );

        if (!alreadyExists) {
          const notice = {
            college: college.name,
            title,
            link,
          };

          console.log(`New notice found for ${college.name}`);
          console.log(title);

          newNotices.push(notice);
          savedNotices.push(notice);
        }
      }
    });

    fs.writeFileSync("notices.json", JSON.stringify(savedNotices, null, 2));

    if (newNotices.length > 0) {
      let message = `🔔 ${college.name}\n\n`;

      newNotices.forEach((notice) => {
        message += `📌 ${notice.title}\n`;
        message += `${notice.link}\n\n`;
      });

      bot
        .sendMessage(process.env.CHAT_ID, message)
        .then(() => {
          console.log(`Telegram alert sent for ${college.name}`);
        })
        .catch((error) => {
          console.error(
            "Telegram Error:",
            error.response?.body || error.message,
          );
        });
    }

    console.log(`${college.name}: ${newNotices.length} new notices found`);
  } catch (error) {
    console.error(`${college.name}:`, error.message);
  }
}

const colleges = require("./colleges");

async function run() {
  for (const college of colleges) {
    console.log(`Checking ${college.name}...`);

    await checkCollege(college);
  }
}

run();

cron.schedule("*/15 * * * *", async () => {
  console.log("\n==============================");
  console.log("Checking colleges...");
  console.log(new Date().toLocaleString());
  console.log("==============================\n");

  await run();
});
