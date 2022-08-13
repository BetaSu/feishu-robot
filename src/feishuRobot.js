const axios = require("axios").default;
const { writeLog } = require("./diff");
const { webHookToken } = require("../token");
const parseContent = require("./parseContent");

const webhook = `https://open.feishu.cn/open-apis/bot/v2/hook/${webHookToken}`;

const reqList = [];
const REQ_INTERVAL = 1000;
let reqTimer;

module.exports = async function sendNewsDebounce(name, item) {
  const msg = {
    msg_type: "post",
    content: {
      post: {
        zh_cn: {
          title: `来自「${name}」的资讯 —— 📖 ${item.title}`,
          content: parseContent(name, item),
        },
      },
    },
  };
  reqList.push(msg);
  scheduleReq();
};

function scheduleReq() {
  if (reqTimer) {
    return;
  }
  reqTimer = setTimeout(async () => {
    if (!reqList.length) {
      return;
    }

    try {
      const reqMsg = reqList.shift();
      const { data } = await axios.post(webhook, reqMsg);
      if (data.code) {
        writeLog("发送消息出错：" + data.msg.slice(0, 100));
      }
    } catch (e) {
      writeLog("发送消息出错：" + (e + "").slice(0, 100));
    } finally {
      reqTimer = null;
      scheduleReq();
    }
  }, REQ_INTERVAL);
}
