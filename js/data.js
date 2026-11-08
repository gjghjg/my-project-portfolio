/**
 * 项目数据
 * ----------
 * 新增项目时，只需要在数组里加一条对象即可，页面会自动渲染。
 * 字段说明：
 *   title - 项目名称（必填）
 *   description - 一句话介绍这个项目做了什么（必填）
 *   tags - 用到的技术栈（数组，至少一个）
 *   link - 项目链接，GitHub 仓库或在线 Demo 地址（必填，合法的 URL）
 *   featured - 是否重点项目（可选，布尔值，便于以后扩展置顶/高亮）
 */
export const projects = [
  {
    title: "示例项目一",
    description: "这里写一句话介绍：这个项目解决了什么问题、用到了什么技术。",
    tags: ["HTML", "CSS", "JavaScript"],
    link: "https://github.com/yourname/project-one",
    featured: true,
  },
  {
    title: "示例项目二",
    description: "比如：一个待办事项应用，支持新增、完成、删除任务，并本地保存。",
    tags: ["JavaScript", "LocalStorage"],
    link: "https://github.com/yourname/project-two",
  },
  {
    title: "示例项目三",
    description: "比如：一个天气查询小工具，调用公开 API 展示实时天气。",
    tags: ["API", "Fetch"],
    link: "https://github.com/yourname/project-three",
  },
];
