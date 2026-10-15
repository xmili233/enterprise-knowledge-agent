---
name: 企业知识助手
description: 采用 assistant-ui ChatGPT 布局的企业知识问答与目录
colors:
  canvas: "#ffffff"
  assistant-ink: "#0d0d0d"
  sidebar: "#f9f9f9"
  selected: "#eaeaea"
  ink: "#202020"
  text: "#333333"
  secondary: "#666666"
  muted: "#737373"
  line: "#e5e5e5"
  paper: "#fafafa"
  focus: "#666666"
  highlight: "#f7eabe"
  danger: "#a32c25"
typography:
  display:
    fontFamily: "Geist Variable, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.8px"
  section:
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "34px"
  row:
    fontSize: "17px"
    fontWeight: 500
    lineHeight: "25px"
  body:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "27px"
  meta:
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "20px"
rounded:
  action: "7px"
  composer: "28px"
  user-message: "22px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  page: "40px"
components:
  button-primary:
    backgroundColor: "{colors.assistant-ink}"
    textColor: "{colors.canvas}"
    height: "36px"
    rounded: "50%"
  composer:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.composer}"
    padding: "17px 14px 12px 20px"
---

# Design System: 企业知识助手

## Overview

**Creative North Star: "对话与知识的工作台"**

采用用户指定的 assistant-ui 标准侧边栏布局。左侧新建对话、知识库和历史列表建立稳定导航；右侧白色画布专注聊天或资料浏览。聊天保持居中输入、黑色用户气泡与连续回答，知识库在独立页面中保持清晰目录。

**Key Characteristics:** 稳定侧边导航、可恢复对话、克制黑白色、独立知识目录、可追溯引用。

## Colors

页面背景为白色。聊天正文及主操作使用 `#0d0d0d`，知识库区域沿用 `#202020`。次级文字 `#666666`，占位文字 `#737373`，边线 `#e5e5e5`。来源高亮保留浅黄。颜色和尺寸为本项目实现，不宣称是 OpenAI 内部 token。

## Typography

使用自托管 Geist Variable 与系统中文字体。欢迎语桌面 30px / 500 / 1.4，手机 25px；章节标题 24px，目录名称 17px。输入框 16px，手机 15px。回答正文 14px / 27px，结论 16px / 29px，元信息 11–12px。欢迎语不再使用两行口号。

## Layout

工作台占满 100dvh，左侧 260px（1000px 以下 230px），右侧自适应。导航和内容各自滚动，页面本身不滚动。左侧内边距 25px 12px 20px，历史标题与入口间距 36px；每条历史至少 41px 高。

右侧标题栏高 64px，左右 32px。聊天内容最大 760px，空会话在剩余空间居中显示欢迎语和约 160px 高的三行输入框。发送后使用剩余高度显示消息，输入框停留在视口底部。

知识库页面最大 1080px，内边距 38px 44px 72px。桌面为名称与简介、文档数和更新日期三列。分类只筛选资料，所有问答统一查询全部演示知识库。

700px 以下不显示常驻侧边栏，通过标题栏菜单打开宽度至多 300px 的抽屉。标题栏高 60px；聊天左右 18px、知识库左右 22px。知识库隐藏更新时间列，保留文档数。导航选择后抽屉关闭。设计讲解沿用项目集合的统一阅读弹窗。

## Elevation & Depth

内容区保持白色画布，侧边栏使用 `#f9f9f9`，选中项使用 `#eaeaea`。工作台，不添加额外工作区外壳或装饰阴影。输入框用一像素边线；聚焦时边线加深到 `#929292`。目录使用一像素分隔线。抽屉和设计讲解保留浮层所需的阴影、遮罩和键盘焦点管理。

## Shapes

输入框圆角 28px，手机 24px；用户消息气泡圆角 22px；发送与停止按钮为 36px 圆形。目录没有卡片外壳。引用使用紧凑的编号按钮，保留正文连续性。

## Components

- **会话**：使用 assistant-ui LocalRuntime 和官方 Thread / Composer / Message / ActionBar 交互原语。发送后留在同一会话区域，不另起回答页面。
- **输入框**：上方为三行输入空间，右下方发送或停止。Enter 发送，Shift+Enter 换行，中文输入法组合中不提交。问题限 2–500 字。
- **消息操作**：回答可复制，最后一条可重新查找；重查原问题，新建对话保留旧会话，历史记录支持切换和删除。
- **知识目录**：纯文字整行按钮、底线搜索和分类分栏，不添加装饰图标与行尾箭头。
- **引用**：结论中的编号和来源行打开文件版本、章节、页码与高亮原文。

## Do's and Don'ts

- Do 保留左侧导航、右侧内容的任务结构。
- Do 保留可追溯引用与证据不足状态。
- Do 让图标承担发送、停止、复制、重查、关闭等真实操作。
- Don't 恢复两栏口号、浅灰大外壳、装饰品牌图标和重复提示。
- Don't 把 assistant-ui 描述为后端 Agent 或实际检索服务。
- Don't 复制 OpenAI 标志或添加无依据的正确率、审批结果。
