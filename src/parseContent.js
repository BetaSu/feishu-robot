const { parse } = require("node-html-parser");
const { uploadImg2FeishuFromImgUrl } = require("./uploadImg");

// 一方面用于新闻去重，一方面用于去广告
const blackListMap = {
  "Find Tech Jobs with Hired": true,
  "Find JavaScript Jobs with Hired": true,
};

// 将RSS的HTML结构解析成飞书的富文本结构
module.exports = async function parseContent(name, item) {
  const { link = "", creator, pubDate } = item;
  const contentParser = contentParserMap[name] || contentParserMap.default;
  const rowOne = [
    createText(`⏰ 发布时间：${new Date(pubDate).toLocaleString()}  `),
    createA("🔗 原文链接 \n", link),
    createRow(" "),
  ];
  const result = [rowOne, ...(await contentParser(item))];

  if (creator) {
    rowOne.unshift(createRow(`✍️ 作者：${creator}`));
  }
  return result;
};

function JSWeeklyStyleParser({ content }) {
  const root = parse(content);
  const result = [];
  root.querySelectorAll("tr").forEach((tr) => {
    const span = tr.querySelector("span");
    if (!span) {
      return;
    }
    const a = span.querySelector("a");
    if (!a) {
      return;
    }
    let href;
    let title;
    let content;
    if (a) {
      href = a.getAttribute("href");
      title = a.innerText.trimEnd();
    }
    if (span.nextSibling) {
      content = span.nextSibling.textContent.trimEnd();
    }
    if (href && title && !blackListMap[title]) {
      blackListMap[title] = true;
      const row = [createA(title, href)];
      result.push(row);
      if (content) {
        row.push(createRow(content));
      }
      // 分割不同行
      row.push(createRow(" "));
    }
  });
  return result;
}

async function ryfWeeklyStyleParser({ content }) {
  const root = parse(content.replaceAll("\n", ""));
  const result = [];
  // let row = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    const node = root.childNodes[i];
    if (node.tagName === "P") {
      const img = node.querySelector("img");
      if (img) {
        // 这是个图片
        const src = img.getAttribute("src");
        // result.push([createRow("图片" + src)]);
        // 注意存储空间啊～～
        const imgKey = await uploadImg2FeishuFromImgUrl(src);
        if (imgKey) {
          result.push([createImg(imgKey)]);
        }
      } else {
        // 这是一段话
        const a = node.querySelector("a");
        if (a) {
          // 包含链接
          const row = [];
          node.childNodes.forEach((n) => {
            if (n.tagName === "P") {
              row.push(createText(n.innerText));
            }
            if (n.tagName === "A") {
              row.push(createA(n.innerText, n.getAttribute("href")));
            }
          });
          result.push(row);
        } else {
          result.push([createText(node.innerText)]);
        }
      }
      continue;
    }
    if (["BLOCKQUOTE", "H3", "H2"].includes(node.tagName)) {
      let ctn = node.innerText;
      if (ctn.includes('<code class="language-bash">')) {
        ctn = ctn.replace(/<code[\s\S]*?>(([\s\S])*?)<\/code>/, (a, b) => {
          return b || a || ctn;
        });
      }
      result.push([createRow(ctn)]);
      continue;
    }
    if (node.tagName === "UL") {
      const list = node.querySelectorAll("li");
      if (list.length) {
        list.forEach((li) => {
          result.push([createLi(li.innerText)]);
        });
      }
    }
  }
  return result;
}

const contentParserMap = {
  "JavaScript Weekly": JSWeeklyStyleParser,
  "Frontend Focus": JSWeeklyStyleParser,
  "React Status": JSWeeklyStyleParser,
  "Node Weekly": JSWeeklyStyleParser,
  科技爱好者周刊: ryfWeeklyStyleParser,
  default({ content }) {
    const root = parse(content);
    return [[createText(root.textContent)]];
  },
};

function createText(text) {
  return {
    tag: "text",
    text: text.trim(),
  };
}

function createRow(text) {
  return {
    tag: "text",
    text: `${text.trim()}\n`,
  };
}

function createLi(text) {
  return {
    tag: "text",
    text: `- ${text.trim()}\n`,
  };
}

function createImg(key) {
  return {
    tag: "img",
    image_key: key,
    // width: 300,
    // height: 300,
  };
}

function createA(text, href) {
  return {
    tag: "a",
    href,
    text: text.trim() || href,
  };
}
