const axios = require("axios");
const { appID: app_id, appSecret: app_secret } = require("../token");
const { writeLog } = require("./diff");
const fse = require("fs-extra");
const path = require("path");
const { promisify } = require("util");
const stream = require("stream");
const { createWriteStream } = require("fs");
const FormData = require("form-data");

const finished = promisify(stream.finished);

const root = path.resolve(__dirname, "../");
let authorizationCache;

async function uploadImg2FeishuFromImgUrl(imgUrl) {
  try {
    const imgPath = await downloadImgFromImgUrl(imgUrl);
    const token = await fetchTenant_access_token();
    const uploadImgAPI = "https://open.feishu.cn/open-apis/im/v1/images";
    const form = new FormData();
    form.append("image_type", "message");
    form.append("image", fse.createReadStream(imgPath));

    const { data = {} } = await axios.post(uploadImgAPI, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
    });
    const { code, data: resData, msg } = data;
    if (code !== 0) {
      throw `上传图片报错 code：${code}，msg：${msg}`;
    }
    return resData.image_key;
  } catch (e) {
    console.warn(e);
    writeLog("操作图片下载、上传飞书报错：", e);
    return "";
  }
}

async function downloadImgFromImgUrl(imgUrl) {
  const { data, headers } = await axios.get(imgUrl, {
    responseType: "stream",
  });
  if (!data) {
    throw `从url ${imgUrl}下载图片失败`;
  }
  const { "content-type": type = "type/png" } = headers;
  const imgSuffix = type.split("/")[1];
  const imgName = `${new Date().getTime()}.${imgSuffix}`;
  const dirPath = path.resolve(root, `./temporaryData/`);
  const filePath = path.resolve(dirPath, `./${imgName}`);
  await fse.ensureDir(dirPath);
  const writer = createWriteStream(filePath);
  data.pipe(writer);
  await finished(writer);
  return filePath;
}

async function fetchTenant_access_token() {
  if (authorizationCache) {
    return authorizationCache;
  }
  const url =
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal";
  const { data = {} } = await axios.post(
    url,
    { app_id, app_secret },
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
  const { code, msg, expire, tenant_access_token } = data;
  if (code !== 0) {
    authorizationCache = null;
    throw `获取tenant_access_token失败,code: ${code}, msg: ${msg}`;
  }
  // 过期时间在200秒以上，存缓存
  if (expire > 200) {
    authorizationCache = tenant_access_token;
  } else {
    authorizationCache = null;
  }
  return tenant_access_token;
}

exports.uploadImg2FeishuFromImgUrl = uploadImg2FeishuFromImgUrl;
