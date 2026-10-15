// Scripted research runs for the local demo. Every policy, score and quote is a
// fictional fixture; nothing here performs real retrieval or model inference.

/** Evidence scored below this value is dropped, as in PaperQA2's relevance cutoff. */
export const EVIDENCE_CUTOFF = 5;

export interface Candidate {
  /** `documentId:passageId` */
  ref: string;
  /** Relevance from 0 to 10, assigned while gathering evidence. */
  score: number;
  /** One-line summary written for the sub-question. */
  summary: string;
}

export type ResearchStep =
  | { kind: "think"; text: string }
  | { kind: "search"; query: string; bases: string[]; hits: string[] }
  | { kind: "evidence"; question: string; candidates: Candidate[] };

export interface Citation {
  ref: string;
  /** Exact sentence copied from the passage, located for highlighting. */
  quote: string;
}

export interface ResearchPlan {
  outcome: "grounded" | "insufficient";
  steps: ResearchStep[];
  /** Markdown answer. `[[n]]` cites one source; `[[n,m]]` groups quotes from one document. */
  answer: string;
  citations: Citation[];
}

const travel: ResearchPlan = {
  outcome: "grounded",
  steps: [
    {
      kind: "think",
      text: "用户想知道出差改签产生的费用能不能报销。这类规定通常会区分改签原因：因为公务安排变化和因为个人原因，处理方式很可能不一样。先在「差旅与报销」里查找差旅制度中关于改签的条款。",
    },
    {
      kind: "search",
      query: "出差 改签费 报销",
      bases: ["travel"],
      hits: ["travel-policy", "expense-guide"],
    },
    {
      kind: "evidence",
      question: "因公务或个人原因改签，费用能否报销？",
      candidates: [
        {
          ref: "travel-policy:business-change",
          score: 9,
          summary: "公务原因产生的合理改签费可以报销，需要变更说明和负责人书面确认。",
        },
        {
          ref: "travel-policy:personal-change",
          score: 9,
          summary: "个人原因产生的退改签费用和差价由员工承担。",
        },
        {
          ref: "travel-policy:scope",
          score: 4,
          summary: "说明办法的适用范围，没有涉及改签。",
        },
        {
          ref: "expense-guide:process",
          score: 3,
          summary: "介绍报销审批流程，与改签条件没有直接关系。",
        },
      ],
    },
    {
      kind: "think",
      text: "两条高分证据已经说明：公务原因的合理改签费可以报销，但需要行程变更说明和负责人书面确认；个人原因的费用由员工承担。不过回答还缺一块：提交报销时要准备哪些材料、有没有时间限制。换个关键词补查一次，把根目录的通用文件也纳入范围。",
    },
    {
      kind: "search",
      query: "改签 报销材料 提交时限",
      bases: ["travel", "root"],
      hits: ["travel-policy", "expense-guide", "expense-checklist"],
    },
    {
      kind: "evidence",
      question: "改签费用报销需要哪些材料，什么时候提交？",
      candidates: [
        {
          ref: "travel-policy:evidence",
          score: 9,
          summary: "列出改签报销需要附上的行程、凭证、说明和负责人确认。",
        },
        {
          ref: "expense-guide:deadline",
          score: 8,
          summary: "出差结束后 30 个自然日内提交，超期需单独核实。",
        },
        {
          ref: "expense-guide:process",
          score: 7,
          summary: "在费用系统新建报销单并关联已批准的出差申请。",
        },
        {
          ref: "expense-checklist:materials",
          score: 4,
          summary: "通用材料清单，具体要求以差旅制度为准。",
        },
      ],
    },
    {
      kind: "think",
      text: "材料和时限都找到了。通用材料清单写着「以相关制度为准」，所以优先引用差旅制度和报销指引的原文。整理回答：先给结论，再分公务和个人两种情况说明，最后列出材料和时限。",
    },
  ],
  answer: `改签费用能否报销，要先区分原因：

- **公务安排变更**：客户会议、项目安排等公务原因导致的合理改签费用，可以申请报销；需要提供行程变更说明，并取得直属负责人的书面确认。
- **个人原因变更**：退票费、改签费及行程差价，由员工本人承担。[[1,2,3]]

### 提交时准备这些材料

原行程、变更后的行程、改签费用凭证、行程变更说明和负责人书面确认。[[4]]

### 提交时限与流程

出差结束后 30 个自然日内提交，并在费用系统中关联已批准的出差申请。[[5,6]]`,
  citations: [
    {
      ref: "travel-policy:business-change",
      quote: "因客户会议、项目安排等公务原因调整行程而产生的合理改签费用，可以申请报销",
    },
    {
      ref: "travel-policy:business-change",
      quote: "申请人应提供行程变更说明，并取得直属负责人的书面确认",
    },
    {
      ref: "travel-policy:personal-change",
      quote: "因个人原因产生的退票费、改签费以及行程差价，由员工本人承担",
    },
    {
      ref: "travel-policy:evidence",
      quote: "改签费用报销须附原行程、变更后的行程、改签费用凭证、行程变更说明及直属负责人书面确认",
    },
    {
      ref: "expense-guide:deadline",
      quote: "员工应于出差结束后 30 个自然日内提交报销申请",
    },
    {
      ref: "expense-guide:process",
      quote: "在费用系统中新建报销单，关联已获批准的出差申请并上传凭证",
    },
  ],
};

const leave: ResearchPlan = {
  outcome: "grounded",
  steps: [
    {
      kind: "think",
      text: "问题是年假需要提前多久申请，应该在考勤与休假制度里。除了提前的天数，申请前还要确认什么，也值得一并说明。先在「员工手册」中检索。",
    },
    {
      kind: "search",
      query: "年假 申请 提前",
      bases: ["people"],
      hits: ["leave-policy", "onboarding"],
    },
    {
      kind: "evidence",
      question: "年假需要提前多久申请？",
      candidates: [
        {
          ref: "leave-policy:annual",
          score: 9,
          summary: "建议提前 3 个工作日申请，申请前确认余额并沟通工作安排。",
        },
        {
          ref: "leave-policy:balance",
          score: 6,
          summary: "个人余额以人事系统为准，制度不记录个人余额。",
        },
        {
          ref: "onboarding:contacts",
          score: 2,
          summary: "列出常用服务的联系部门，没有休假规定。",
        },
      ],
    },
    {
      kind: "think",
      text: "制度建议提前 3 个工作日申请，还要求先确认余额、沟通工作安排。余额以人事系统为准这一点也要提醒，免得用户以为制度里能查到。",
    },
  ],
  answer: `建议**提前 3 个工作日**提交年假申请，获批后再休假[[1]]。

### 申请前先做两件事

在人事系统确认个人可用的年假余额，并与直属负责人沟通工作安排[[2]]。

### 个人余额另行确认

年假额度和余额以人事系统核定结果为准，制度本身不记录个人余额[[3]]。`,
  citations: [
    {
      ref: "leave-policy:annual",
      quote: "建议提前 3 个工作日提交申请，获批后休假",
    },
    {
      ref: "leave-policy:annual",
      quote: "应在人事系统确认个人可用年假余额，并与直属负责人沟通工作安排",
    },
    {
      ref: "leave-policy:balance",
      quote: "个人年假额度与余额以人事系统核定结果为准",
    },
  ],
};

const security: ResearchPlan = {
  outcome: "grounded",
  steps: [
    {
      kind: "think",
      text: "这是一个文件外发的合规问题。回答不能只说「可以」或「不可以」，最好同时找到明确的禁止条款和对外协作时允许的做法。先查「信息安全规范」。",
    },
    {
      kind: "search",
      query: "内部文件 私人邮箱 外发",
      bases: ["security"],
      hits: ["data-security", "account-guide"],
    },
    {
      kind: "evidence",
      question: "内部文件能否发送到私人邮箱，对外协作有什么要求？",
      candidates: [
        {
          ref: "data-security:personal-email",
          score: 10,
          summary: "明确禁止发送到私人邮箱或个人网盘，对外协作需用企业平台。",
        },
        {
          ref: "data-security:permission",
          score: 8,
          summary: "共享敏感资料需负责人核准，不得使用公开链接。",
        },
        {
          ref: "account-guide:request",
          score: 3,
          summary: "讲账号权限申请，与文件外发无关。",
        },
      ],
    },
    {
      kind: "think",
      text: "条款明确禁止发送到私人邮箱或个人网盘，也给出了对外协作的正确方式和共享权限要求。账号权限指引与外发无关，已排除。可以回答了。",
    },
  ],
  answer: `**不可以。**公司内部文件不得发送到私人邮箱，也不能上传到个人网盘。对外协作应使用企业批准的平台，发出前确认接收人、资料密级和访问期限。[[1,2]]

### 只开放必要权限

涉及客户信息或敏感资料的共享，需要资料负责人核准，不能通过公开链接向不特定人员开放[[3]]。

> 具体文件能否外发，需要资料负责人判断。`,
  citations: [
    {
      ref: "data-security:personal-email",
      quote: "公司内部文件不得发送至私人邮箱或上传至个人网盘",
    },
    {
      ref: "data-security:personal-email",
      quote: "应使用企业批准的协作平台，并在发出前确认接收人、资料密级及访问期限",
    },
    {
      ref: "data-security:permission",
      quote: "涉及客户信息或敏感资料的共享，应由资料负责人核准，不得通过公开链接向不特定人员开放",
    },
  ],
};

const expense: ResearchPlan = {
  outcome: "grounded",
  steps: [
    {
      kind: "think",
      text: "用户问报销申请怎么提交，需要说清楚在哪里提交、审批顺序和时间要求。先在「差旅与报销」和根目录的通用文件里检索。",
    },
    {
      kind: "search",
      query: "报销 提交 审批流程",
      bases: ["travel", "root"],
      hits: ["expense-guide", "expense-checklist", "travel-policy"],
    },
    {
      kind: "evidence",
      question: "报销申请如何提交，审批顺序和时限是什么？",
      candidates: [
        {
          ref: "expense-guide:process",
          score: 9,
          summary: "新建报销单、关联出差申请、上传凭证，依次审核复核。",
        },
        {
          ref: "expense-guide:deadline",
          score: 8,
          summary: "出差结束后 30 个自然日内提交，超期需单独核实。",
        },
        {
          ref: "expense-checklist:materials",
          score: 5,
          summary: "通用的报销材料清单。",
        },
        {
          ref: "travel-policy:scope",
          score: 2,
          summary: "出差前的申请要求，与报销提交无关。",
        },
      ],
    },
    {
      kind: "think",
      text: "操作指引里有完整的提交流程和时限要求。通用材料清单可以作为补充，但流程以操作指引为准。按「怎么提交、审批顺序、时限」组织回答。",
    },
  ],
  answer: `在费用系统中新建报销单，关联已批准的出差申请并上传凭证。提交后依次由直属负责人审核、财务部复核；资料不完整会退回补充。[[1,2]]

### 提交时限

出差结束后 30 个自然日内提交。超期需要附情况说明，由财务部单独核实，不会自动批准。[[3,4]]`,
  citations: [
    {
      ref: "expense-guide:process",
      quote: "在费用系统中新建报销单，关联已获批准的出差申请并上传凭证",
    },
    {
      ref: "expense-guide:process",
      quote: "提交后依次由直属负责人审核、财务部复核；资料不完整时退回补充",
    },
    {
      ref: "expense-guide:deadline",
      quote: "员工应于出差结束后 30 个自然日内提交报销申请",
    },
    {
      ref: "expense-guide:deadline",
      quote: "超期申请须附情况说明，由财务部单独核实，不自动批准",
    },
  ],
};

const purchase: ResearchPlan = {
  outcome: "grounded",
  steps: [
    {
      kind: "think",
      text: "问的是办公设备怎么采购。关键在于先申请再采购，还是可以自己买了再报销，这两种做法差别很大。查「采购与费用」。",
    },
    {
      kind: "search",
      query: "办公设备 显示器 采购",
      bases: ["purchase"],
      hits: ["purchase-policy", "expense-guide"],
    },
    {
      kind: "evidence",
      question: "办公设备的采购流程是什么，能否自行购买后报销？",
      candidates: [
        {
          ref: "purchase-policy:purchase",
          score: 9,
          summary: "先申请再由行政部统一采购，自行购买不自动获得报销资格。",
        },
        {
          ref: "expense-guide:process",
          score: 3,
          summary: "报销单审批流程，不涉及设备采购。",
        },
      ],
    },
    {
      kind: "think",
      text: "采购流程写明需要先申请、由行政部统一采购，并且特别说明自行购买的设备不会自动获得报销资格，这一点必须写进回答。",
    },
  ],
  answer: `办公设备需要**先申请，再由行政部统一采购**，不建议自行购买。

### 采购流程

提交设备采购申请，写明用途、预算和配置需求[[1]]。经直属负责人确认、财务核实预算后，由行政部统一采购[[2]]。

### 自行购买的风险

未经批准自行购买的设备，不会自动获得报销资格[[3]]。

> 具体预算和审批结果需另行确认。`,
  citations: [
    {
      ref: "purchase-policy:purchase",
      quote: "应先提交设备采购申请，写明用途、预算及配置需求",
    },
    {
      ref: "purchase-policy:purchase",
      quote: "经直属负责人确认、财务核实预算后，由行政部统一采购",
    },
    {
      ref: "purchase-policy:purchase",
      quote: "未经批准自行购买的设备，不自动获得报销资格",
    },
  ],
};

const office: ResearchPlan = {
  outcome: "grounded",
  steps: [
    {
      kind: "think",
      text: "问的是会议室怎么预订，应该在办公资源相关的指南里。顺便看看取消预订和设备报修有没有规定。",
    },
    {
      kind: "search",
      query: "会议室 预订",
      bases: ["office", "root"],
      hits: ["office-guide", "employee-services"],
    },
    {
      kind: "evidence",
      question: "会议室如何预订和取消？",
      candidates: [
        {
          ref: "office-guide:rooms",
          score: 9,
          summary: "通过企业日历预订，取消时释放，故障走行政服务入口。",
        },
        {
          ref: "employee-services:services",
          score: 4,
          summary: "说明会议室事项由行政部负责，没有预订步骤。",
        },
      ],
    },
    {
      kind: "think",
      text: "使用指南给出了预订步骤，以及取消和报修的要求。行政部的分工说明对预订步骤没有帮助，已排除。",
    },
  ],
  answer: `在企业日历中预订会议室：选择会议室，填写会议时间、人数和用途[[1]]。

### 取消与报修

会议取消时及时释放预订；设备故障通过行政服务入口报修[[2]]。

> 会议室是否空闲，需要在企业日历中确认。`,
  citations: [
    {
      ref: "office-guide:rooms",
      quote: "请在企业日历中选择会议室并填写会议时间、人数和用途",
    },
    {
      ref: "office-guide:rooms",
      quote: "会议取消时及时释放预订，设备故障通过行政服务入口报修",
    },
  ],
};

const personalBalance: ResearchPlan = {
  outcome: "insufficient",
  steps: [
    {
      kind: "think",
      text: "用户问自己还剩几天年假，这是个人数据。制度文件通常只规定规则，不会记录每个人的余额。先确认制度里是否有相关说明，再决定怎么回答。",
    },
    {
      kind: "search",
      query: "年假 余额",
      bases: ["people"],
      hits: ["leave-policy", "onboarding"],
    },
    {
      kind: "evidence",
      question: "制度能否确定某位员工剩余的年假天数？",
      candidates: [
        {
          ref: "leave-policy:balance",
          score: 9,
          summary: "明确余额以人事系统为准，制度不记录个人余额。",
        },
        {
          ref: "leave-policy:annual",
          score: 6,
          summary: "申请前需在人事系统确认可用余额。",
        },
        {
          ref: "onboarding:contacts",
          score: 3,
          summary: "考勤问题联系人力资源部，没有余额信息。",
        },
      ],
    },
    {
      kind: "think",
      text: "制度明确写着余额以人事系统核定结果为准，正文不记录个人余额，所以无法给出具体天数。能做的是说明原因，并告诉用户去哪里查。",
    },
  ],
  answer: `**无法仅凭制度确定你还剩几天年假。**个人年假额度与余额以人事系统核定结果为准，制度正文不记录个人余额[[1]]。

可以在人事系统中查看你的可用余额[[2]]。`,
  citations: [
    {
      ref: "leave-policy:balance",
      quote: "个人年假额度与余额以人事系统核定结果为准",
    },
    {
      ref: "leave-policy:annual",
      quote: "应在人事系统确认个人可用年假余额",
    },
  ],
};

const liveRoomStatus: ResearchPlan = {
  outcome: "insufficient",
  steps: [
    {
      kind: "think",
      text: "问的是会议室现在是否空闲，这需要实时数据，而知识库里的文件是静态的。先看看使用指南里有没有提到实时状态。",
    },
    {
      kind: "search",
      query: "会议室 空闲 状态",
      bases: ["office", "root"],
      hits: ["office-guide", "employee-services"],
    },
    {
      kind: "evidence",
      question: "资料能否提供会议室的实时空闲状态？",
      candidates: [
        {
          ref: "office-guide:rooms",
          score: 8,
          summary: "说明预订方式，并明确不包含实时空闲状态。",
        },
        {
          ref: "employee-services:services",
          score: 3,
          summary: "只说明会议室事项由行政部负责。",
        },
      ],
    },
    {
      kind: "think",
      text: "指南明确不包含会议室的实时空闲状态，没法回答「现在是否空闲」。可以说明这一点，并给出查看和预订的方式。",
    },
  ],
  answer: `**无法从资料中查到会议室现在是否空闲。**使用指南明确不包含会议室的实时空闲状态[[1]]。

可以在企业日历中查看并预订会议室[[2]]。`,
  citations: [
    {
      ref: "office-guide:rooms",
      quote: "本文件不包含会议室的实时空闲状态",
    },
    {
      ref: "office-guide:rooms",
      quote: "请在企业日历中选择会议室并填写会议时间、人数和用途",
    },
  ],
};

function unknown(question: string): ResearchPlan {
  const query = question.replace(/[？?。！!，,]/g, " ").trim().slice(0, 20) || question;
  return {
    outcome: "insufficient",
    steps: [
      {
        kind: "think",
        text: "这个问题在知识库里没有直接对应的主题。先用问题本身在全部知识库中检索，看看有没有相关条款。",
      },
      {
        kind: "search",
        query,
        bases: ["all"],
        hits: ["policy-versions", "employee-services"],
      },
      {
        kind: "evidence",
        question,
        candidates: [
          {
            ref: "policy-versions:versions",
            score: 2,
            summary: "讲制度的版本管理，与问题无关。",
          },
          {
            ref: "employee-services:services",
            score: 1,
            summary: "列出各部门办事分工，没有涉及这个问题。",
          },
        ],
      },
      {
        kind: "think",
        text: "两个候选段落都和问题无关，分数低于阈值。换一个更宽的说法再补查一次，避免因为用词不同而漏掉资料。",
      },
      {
        kind: "search",
        query: `${query} 相关规定`,
        bases: ["all"],
        hits: ["employee-services"],
      },
      {
        kind: "evidence",
        question,
        candidates: [
          {
            ref: "employee-services:services",
            score: 1,
            summary: "仍然只有办事分工，无法支持任何结论。",
          },
        ],
      },
      {
        kind: "think",
        text: "补查后仍然没有相关依据。不能凭空给出结论，直接说明找不到依据，并建议换个问法或浏览知识库。",
      },
    ],
    answer: `当前知识库中没有找到能回答这个问题的依据，暂不生成结论。

可以换一种问法，或向下浏览知识库查看已有的文件。`,
    citations: [],
  };
}

/**
 * The guided demo walks these in order; every one is answerable from the
 * fixtures, so the visitor sees evidence found, scored and cited.
 */
export const guidedQuestions = [
  "出差改签费可以报销吗？",
  "报销申请怎么提交？",
  "公司文件能发到私人邮箱吗？",
];

export const sampleQuestions = [
  "出差改签费可以报销吗？",
  "年假需要提前几天申请？",
  "公司文件能发到私人邮箱吗？",
  "报销申请怎么提交？",
  "办公设备应该怎么采购？",
  "会议室怎么预订？",
];

/** Picks the scripted run for a question by keyword, falling back to an honest miss. */
export function planResearch(question: string): ResearchPlan {
  const q = question.trim();
  if (/年假/.test(q) && /剩|余额|我有|我能休|几天假/.test(q))
    return personalBalance;
  if (/改签|退票/.test(q)) return travel;
  if (/年假|请假/.test(q)) return leave;
  if (/私人邮箱|个人邮箱|外发|共享|个人网盘/.test(q)) return security;
  if (/报销/.test(q) && /提交|申请|流程|怎么|材料/.test(q)) return expense;
  if (/采购|显示器|办公设备/.test(q)) return purchase;
  if (/会议室/.test(q))
    return /空闲|现在|今天|明天|有空/.test(q) ? liveRoomStatus : office;
  return unknown(q);
}
