const fse = require("fs-extra");
const path = require("path");
const token = require("./token");

// node.js.json {"xxx xxx": 1, "bbb bbb": 1} vue.json {"ccc ccc" : 1}}
const recordMapCache = {};

exports.diffContent = function diffContent(name, items) {
  const recordMap = getRecordMap(name);
  const newContentList = [];
  items.forEach((item) => {
    const record = createRecord(item.title, item.pubDate);
    if (recordMap[record] !== 1) {
      // 不存在记录
      newContentList.push(item);
      recordMap[record] = 1;
    }
  });
  newContentList.sort(({ pubDate: pubDateA }, { pubDate: pubDateB }) => {
    return new Date(pubDateA).getTime() - new Date(pubDateB).getTime();
  });
  if (newContentList.length) {
    // 写文件
    writeRecordMap(name);
  }
  return newContentList;
};

function getRecordMap(name) {
  if (!recordMapCache[name]) {
    recordMapCache[name] = readRecordMap(name);
  }
  return recordMapCache[name];
}

function readRecordMap(name) {
  const recordPath = path.resolve(__dirname, `./record/${name}.json`);
  try {
    return fse.readJSONSync(recordPath, { encoding: "utf8" });
  } catch (e) {
    writeLog(`读 ${name} recordMap出错, ${e}`);
    return {};
  }
}

function writeRecordMap(name) {
  // 写文件
  const recordPath = path.resolve(__dirname, `./record/${name}.json`);
  fse.ensureFileSync(recordPath);
  fse.writeJSONSync(recordPath, recordMapCache[name]);
}

function createRecord(title, pubDate) {
  return title + " " + pubDate;
}

function writeLog(msg) {
  const logPath = path.resolve(
    __dirname,
    `./log/${new Date().toLocaleString().replaceAll("/", "-")}.json`
  );
  fse.ensureFileSync(logPath);
  const tokenStr = (token.webHookToken || "").slice(0, 4);
  fse.writeFileSync(
    logPath,
    `${msg}\n` + `token:${tokenStr}\n` + JSON.stringify(recordMapCache)
  );
}

exports.writeLog = writeLog;
