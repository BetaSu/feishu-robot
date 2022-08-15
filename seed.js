const { seedUrl } = require("./token");

module.exports = [
  // {
  //   name: "node.js",
  //   url: `https://${seedUrl}/nodejs/blog?language=zh-cn`,
  // },
  {
    name: "JavaScript Weekly",
    url: "https://cprss.s3.amazonaws.com/javascriptweekly.com.xml",
  },
  {
    name: "Frontend Focus",
    url: "https://cprss.s3.amazonaws.com/frontendfoc.us.xml",
  },
  {
    name: "React Status",
    url: "https://cprss.s3.amazonaws.com/react.statuscode.com.xml",
  },
  {
    name: "Node Weekly",
    url: "https://cprss.s3.amazonaws.com/nodeweekly.com.xml",
  },
  {
    name: "科技爱好者周刊",
    // url: "https://feeds.feedburner.com/ruanyifeng",
    url: "http://www.ruanyifeng.com/blog/atom.xml",
  },
];
