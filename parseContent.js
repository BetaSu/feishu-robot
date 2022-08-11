const { parse } = require("node-html-parser");

// 将RSS的HTML结构解析成飞书的富文本结构
module.exports = function parseContent(name, item) {
  const { link = "", creator, pubDate } = item;
  const contentParser = contentParserMap[name]
    ? contentParserMap[name]
    : contentParserMap.default;
  const rowOne = [
    {
      tag: "text",
      text: `⏰ 发布时间：${new Date(pubDate).toLocaleString()}  `,
    },
    {
      tag: "a",
      text: "🔗 原文链接 \n",
      href: link,
    },
  ];
  const result = [rowOne, ...contentParser(item)];

  if (creator) {
    rowOne.unshift({
      tag: "text",
      text: `✍️作者：${creator}  `,
    });
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
    if (href && title) {
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

const contentParserMap = {
  "JavaScript Weekly": JSWeeklyStyleParser,
  "Frontend Focus": JSWeeklyStyleParser,
  "React Status": JSWeeklyStyleParser,
  "Node Weekly": JSWeeklyStyleParser,
  default({ content }) {
    const root = parse(content);
    return [[createText(root.textContent)]];
  },
};

function createText(text) {
  return {
    tag: "text",
    text,
  };
}

function createRow(text) {
  return {
    tag: "text",
    text: `${text}\n`,
  };
}

function createA(text, href) {
  return {
    tag: "a",
    href,
    text: text || href,
  };
}

// contentParserMap["JavaScript Weekly"]({ content: data });
