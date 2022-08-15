const Parser = require("rss-parser");
const seedList = require("./seed.js");
const sendNewsDebounce = require("./src/feishuRobot");
const { diffContent, writeLog } = require("./src/diff");

const parser = new Parser();

(async () => {
  for (let i = 0; i < seedList.length; i++) {
    const { url, name } = seedList[i];
    try {
      const { items } = await parser.parseURL(url);
      const newItemList = diffContent(name, items);
      newItemList.forEach((item) => {
        sendNewsDebounce(name, item);
      });
    } catch (e) {
      writeLog(`${name}失败 ${e}`);
    }
  }
})();
