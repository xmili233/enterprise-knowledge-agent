# 企业知识助手

面向企业内部制度、报销及人事资料查询的前端交互原型，重点展示查找进展、证据筛选、回答引用与原文核对。设计场景是让员工既能看到处理条件，也能找到支持结论的文件依据。

在线版采用**三步预设问答与虚构企业资料**，不连接真实模型或企业检索服务。

## 在线体验

[打开知识助手](https://xmili233.github.io/enterprise-knowledge-agent/) · [阅读设计讲解](https://xmili233.github.io/enterprise-knowledge-agent/#design/overview) · [查看源码](https://github.com/xmili233/enterprise-knowledge-agent)

已通过 GitHub Pages 上线，无需安装或注册。建议按以下顺序体验：

1. 发送输入框中预填的“出差改签费可以报销吗？”。输入框为只读，引导演示按预设顺序进行。
2. 查看查找过程中的轮次、目标、进度与候选评分；回答开始后，过程默认收起，仍可展开查看。
3. 点击回答中的引用，核对文件版本、章节、页码与高亮原文；同一文件的多处引用可分别定位。
4. 继续发送页面给出的报销提交、文件外发问题。点击“返回首页”可从第一步重新体验，也可下滑浏览文件夹与文档。

## 实现重点与取舍

技术栈：React 19、TypeScript、Vite、Tailwind CSS、shadcn/ui 与 assistant-ui。

| 实现重点 | 做法与取舍 | 主要代码 |
| --- | --- | --- |
| 会话运行时与流式输出 | 使用 assistant-ui 管理消息、发送、取消和滚动；本地 `ChatModelAdapter` 逐步输出思考、工具调用结果与正文，响应 `AbortSignal`。将过程数据与界面分离，沿用框架的会话生命周期。 | [knowledge-adapter.ts](./src/lib/knowledge-adapter.ts)、[KnowledgeAssistant.tsx](./src/components/KnowledgeAssistant.tsx) |
| 查找过程的信息层级 | 按轮次关联目标、检索范围与筛选结果，使用紧凑评分行展示采用或排除的原因；详细原文按需打开，避免过程占据整个对话。 | [research-process.tsx](./src/components/agent/research-process.tsx)、[tool-uis.tsx](./src/components/agent/tool-uis.tsx) |
| 引用与原文映射 | 将引用编号关联到文件、段落与逐字摘录，支持行内预览、原文定位和同文件多处引用切换。高亮使用摘录在段落中的实际位置，使引用能落到具体句子。 | [answer-text.tsx](./src/components/agent/answer-text.tsx)、[SourcePanel.tsx](./src/components/SourcePanel.tsx)、[knowledge.ts](./src/data/knowledge.ts) |
| 提问与资料浏览的边界 | 首页通过两屏吸附连接提问与文件浏览；进入聊天后只保留对话内部滚动，避免误滑进知识库。目录支持文件与文件夹混排、搜索、路径返回和键盘打开。 | [App.tsx](./src/App.tsx)、[use-section-paging.ts](./src/lib/use-section-paging.ts)、[KnowledgeLibrary.tsx](./src/components/KnowledgeLibrary.tsx) |

## 当前范围与边界

- **页面只开放三个预设问题**：改签报销、报销提交和文件外发。支持停止输出、继续下一步和返回首页，不支持自由输入、上传文件或补充资料。
- **查找过程与答案由脚本提供**：检索路径、候选评分、引用和回答均预先编写。0–10 相关度用于演示筛选逻辑，不是实际模型评分或检索效果指标。
- **资料浏览可独立使用**：演示知识库包含 6 个文件夹、11 份虚构文件，其中 2 份在根目录。搜索匹配当前目录的文件或文件夹名称，不改变问答使用的演示资料范围。
- **会话只保存在当前浏览器**：返回首页保留已有记录，但当前没有历史管理入口，也没有跨设备同步或企业账号系统。
- **真实 Agent 能力属于设计方案**：文档解析、混合检索、自主补查、模型生成、权限过滤和版本有效性校验尚未实现；相关方案在设计讲解中单独说明。

底层场景数据还包含年假、采购、会议室以及依据不足等测试用例，用于验证适配器和引用契约，不代表在线页面开放了这些问答入口。

## 本地运行

推荐使用 **Node.js 24** 和 npm，与 CI 的运行版本一致。当前测试依赖不支持 Node.js 20。

```bash
npm ci
npm run dev
```

访问终端输出的本地地址。验证与生产预览：

```bash
npm test        # 运行现有测试
npm run build   # TypeScript 检查与生产构建
npm run preview # 预览 dist/ 中的构建结果
```

测试覆盖预设资料与引用的一致性、摘录逐字匹配、证据阈值、引用编号、依据不足场景、流式片段顺序、取消和本地会话保存。主要测试：[场景与引用契约](./src/lib/research.test.ts)、[流式适配器](./src/lib/knowledge-adapter.test.ts)、[本地会话存储](./src/lib/thread-store.test.ts)、[引用组件](./src/components/assistant-ui/elements/knowledge-elements.test.tsx)。这些测试不衡量真实检索召回率或模型回答准确率。

推送到 `main` 后，[GitHub Actions](./.github/workflows/deploy.yml) 会运行测试和构建，再发布到 GitHub Pages。线上构建使用 `npm run build -- --base=/enterprise-knowledge-agent/`，构建产物为静态站点。

## 设计资料与参考

- [PRODUCT.md](./PRODUCT.md)：使用场景与产品边界。
- [DESIGN.md](./DESIGN.md)：布局、视觉、交互与设计决策。
- [设计讲解章节](./src/content/design/)：场景拆解、准确性取舍，以及文档入库、检索、引用、权限和评估方案；可在[线上阅读](https://xmili233.github.io/enterprise-knowledge-agent/#design/overview)。

### 参考的开源项目

以下项目用于研究检索问答与证据组织方式。这里借鉴的是设计思路，未集成这四个项目的代码或服务，也未确定后端选型。

| 项目 | 参考方向 |
| --- | --- |
| [RAGFlow](https://github.com/infiniflow/ragflow) | 文档解析、分块与证据来源管理 |
| [PaperQA2](https://github.com/Future-House/paper-qa) | 搜索、收集证据、生成回答与补查的流程 |
| [Onyx](https://github.com/onyx-dot-app/onyx) | 企业知识搜索、上下文组织与引用映射 |
| [Kotaemon](https://github.com/Cinnamon/kotaemon) | 文档问答、原文阅读与引用高亮 |

具体取舍见设计讲解的[参考项目](https://xmili233.github.io/enterprise-knowledge-agent/#design/references)章节。

### 使用的组件与设计辅助

- **assistant-ui** 是实际使用的前端会话框架，不承担后端检索与 Agent 决策。从其官方注册表引入并适配了过程展示、文档引用等组件，代码见 [src/components/assistant-ui/](./src/components/assistant-ui/)，许可见 [docs/assistant-ui-LICENSE.txt](./docs/assistant-ui-LICENSE.txt)。
- 界面交互使用 shadcn/ui；设计讲解的阅读布局参考 [Muse](https://xmili233.github.io/muse-canvas/#design/overview)。设计规范制定时使用了 [gstack design-consultation](https://github.com/garrytan/gstack/tree/main/design-consultation) 作为辅助，最终规范记录在 [DESIGN.md](./DESIGN.md)。
- GitHub 图标来源与许可见 [public/THIRD_PARTY_NOTICES.txt](./public/THIRD_PARTY_NOTICES.txt)。
