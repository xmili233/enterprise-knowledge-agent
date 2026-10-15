export const categories = ["全部", "制度规范", "财务报销", "人事行政"] as const;
export type Category = (typeof categories)[number];

export interface KnowledgeBase {
  id: string;
  name: string;
  category: Exclude<Category, "全部">;
  description: string;
  owner: string;
}
export interface Passage {
  id: string;
  heading: string;
  text: string;
  page: number;
}
export interface KnowledgeDocument {
  id: string;
  baseId: string | null;
  title: string;
  version: string;
  updated: string;
  code: string;
  passages: Passage[];
}
export const knowledgeBases: KnowledgeBase[] = [
  {
    id: "travel",
    name: "差旅与报销",
    category: "财务报销",
    description: "出差申请、费用标准与报销流程",
    owner: "财务部",
  },
  {
    id: "people",
    name: "员工手册",
    category: "人事行政",
    description: "考勤休假、员工福利与入职指引",
    owner: "人力资源部",
  },
  {
    id: "security",
    name: "信息安全规范",
    category: "制度规范",
    description: "数据使用、账号权限与文件共享",
    owner: "信息技术部",
  },
  {
    id: "purchase",
    name: "采购与费用",
    category: "财务报销",
    description: "办公设备采购、预算与审批要求",
    owner: "财务部",
  },
  {
    id: "office",
    name: "办公与行政",
    category: "人事行政",
    description: "会议室预订、办公资源与行政服务",
    owner: "行政部",
  },
  {
    id: "governance",
    name: "公司制度与流程",
    category: "制度规范",
    description: "制度发布、版本管理与审批职责",
    owner: "综合管理部",
  },
];

// All entities and policies in this file are fictional demo fixtures.
export const documents: KnowledgeDocument[] = [
  {
    id: "travel-policy",
    baseId: "travel",
    title: "差旅管理办法",
    version: "2.1",
    updated: "2026-09-01",
    code: "CM-FIN-001",
    passages: [
      {
        id: "scope",
        heading: "第一章 · 适用范围",
        page: 1,
        text: "本办法适用于澄明科技员工因公务产生的境内差旅。员工应在出行前提交出差申请，获得直属负责人批准后预订交通与住宿。",
      },
      {
        id: "business-change",
        heading: "第四章 · 第十二条 公务改签",
        page: 4,
        text: "因客户会议、项目安排等公务原因调整行程而产生的合理改签费用，可以申请报销。申请人应提供行程变更说明，并取得直属负责人的书面确认。",
      },
      {
        id: "personal-change",
        heading: "第四章 · 第十三条 个人改签",
        page: 4,
        text: "因个人原因产生的退票费、改签费以及行程差价，由员工本人承担，不纳入公司差旅报销范围。",
      },
      {
        id: "evidence",
        heading: "第五章 · 第十六条 申请材料",
        page: 5,
        text: "改签费用报销须附原行程、变更后的行程、改签费用凭证、行程变更说明及直属负责人书面确认。无法提供费用凭证的，须先向财务部说明情况，不视为自动获得报销资格。",
      },
    ],
  },
  {
    id: "expense-guide",
    baseId: "travel",
    title: "费用报销操作指引",
    version: "1.3",
    updated: "2026-09-12",
    code: "CM-FIN-002",
    passages: [
      {
        id: "deadline",
        heading: "第二节 · 提交时限",
        page: 2,
        text: "员工应于出差结束后 30 个自然日内提交报销申请。超期申请须附情况说明，由财务部单独核实，不自动批准。",
      },
      {
        id: "process",
        heading: "第三节 · 审批流程",
        page: 3,
        text: "在费用系统中新建报销单，关联已获批准的出差申请并上传凭证。提交后依次由直属负责人审核、财务部复核；资料不完整时退回补充。",
      },
    ],
  },
  {
    id: "leave-policy",
    baseId: "people",
    title: "考勤与休假管理制度",
    version: "3.0",
    updated: "2026-08-20",
    code: "CM-HR-001",
    passages: [
      {
        id: "annual",
        heading: "第三章 · 年假申请",
        page: 3,
        text: "员工申请年假前，应在人事系统确认个人可用年假余额，并与直属负责人沟通工作安排。建议提前 3 个工作日提交申请，获批后休假；紧急情况应及时联系负责人补办手续。",
      },
      {
        id: "balance",
        heading: "第三章 · 余额与适用条件",
        page: 3,
        text: "个人年假额度与余额以人事系统核定结果为准。本制度正文不记录员工个人余额，不能仅凭本文件确定某位员工可休假的天数。",
      },
    ],
  },
  {
    id: "onboarding",
    baseId: "people",
    title: "新员工入职指南",
    version: "1.2",
    updated: "2026-09-05",
    code: "CM-HR-002",
    passages: [
      {
        id: "first-day",
        heading: "第一节 · 入职当天",
        page: 1,
        text: "新员工到前台领取工牌后，由人力资源同事协助确认劳动资料与入职信息。电脑和账号由信息技术部统一配置，遇到权限问题请提交 IT 服务申请。",
      },
      {
        id: "contacts",
        heading: "第二节 · 常用服务",
        page: 2,
        text: "考勤与福利问题联系人力资源部，报销问题联系财务部，办公资源问题联系行政部。具体联系人以企业通讯录为准。",
      },
    ],
  },
  {
    id: "data-security",
    baseId: "security",
    title: "企业数据与文件共享规范",
    version: "2.0",
    updated: "2026-09-10",
    code: "CM-IT-001",
    passages: [
      {
        id: "personal-email",
        heading: "第二章 · 第六条 文件外发",
        page: 2,
        text: "公司内部文件不得发送至私人邮箱或上传至个人网盘。确有对外协作需求时，应使用企业批准的协作平台，并在发出前确认接收人、资料密级及访问期限。",
      },
      {
        id: "permission",
        heading: "第三章 · 第九条 最小权限",
        page: 3,
        text: "共享文件时仅开放完成工作所需的最小权限。涉及客户信息或敏感资料的共享，应由资料负责人核准，不得通过公开链接向不特定人员开放。",
      },
    ],
  },
  {
    id: "account-guide",
    baseId: "security",
    title: "账号与访问权限指引",
    version: "1.1",
    updated: "2026-08-15",
    code: "CM-IT-002",
    passages: [
      {
        id: "request",
        heading: "第一节 · 申请权限",
        page: 1,
        text: "员工应通过 IT 服务入口提交账号权限申请，注明业务用途、系统名称和使用期限。权限由直属负责人及系统管理员审批，禁止借用他人账号。",
      },
    ],
  },
  {
    id: "purchase-policy",
    baseId: "purchase",
    title: "办公设备采购流程",
    version: "1.4",
    updated: "2026-09-08",
    code: "CM-FIN-003",
    passages: [
      {
        id: "purchase",
        heading: "第二节 · 采购申请",
        page: 2,
        text: "购买显示器等办公设备，应先提交设备采购申请，写明用途、预算及配置需求，经直属负责人确认、财务核实预算后，由行政部统一采购。未经批准自行购买的设备，不自动获得报销资格。",
      },
    ],
  },
  {
    id: "office-guide",
    baseId: "office",
    title: "办公资源使用指南",
    version: "1.0",
    updated: "2026-08-28",
    code: "CM-AD-001",
    passages: [
      {
        id: "rooms",
        heading: "第二节 · 会议室预订",
        page: 2,
        text: "请在企业日历中选择会议室并填写会议时间、人数和用途。会议取消时及时释放预订，设备故障通过行政服务入口报修。本文件不包含会议室的实时空闲状态。",
      },
    ],
  },
  {
    id: "policy-versions",
    baseId: "governance",
    title: "制度发布与版本管理规范",
    version: "1.0",
    updated: "2026-09-01",
    code: "CM-GOV-001",
    passages: [
      {
        id: "versions",
        heading: "第三节 · 版本使用",
        page: 2,
        text: "发布制度时应注明版本号、生效日期及负责部门。制度更新后，由负责部门撤下过期版本并保留变更记录；存在冲突时应联系制度负责人确认，不得自行选择更有利的条款。",
      },
    ],
  },
  {
    id: "expense-checklist",
    baseId: null,
    title: "报销材料清单",
    version: "1.0",
    updated: "2026-09-12",
    code: "CM-GEN-001",
    passages: [
      {
        id: "materials",
        heading: "第一节 · 准备材料",
        page: 1,
        text: "提交费用报销时，应准备费用凭证、对应的申请记录与必要的情况说明。差旅费用应关联已获批准的出差申请；涉及行程变更时，还应提供变更说明及负责人确认。具体材料和适用条件以相关制度为准。",
      },
    ],
  },
  {
    id: "employee-services",
    baseId: null,
    title: "员工服务指南",
    version: "1.0",
    updated: "2026-09-05",
    code: "CM-GEN-002",
    passages: [
      {
        id: "services",
        heading: "第一节 · 办事分工",
        page: 1,
        text: "入职、考勤和福利事项联系人力资源部；报销事项联系财务部；办公资源和会议室事项联系行政部；账号、权限和设备故障联系信息技术部。具体办理入口和联系人以企业通讯录及服务系统中的当前信息为准。",
      },
    ],
  },
];

export const docsForBase = (baseId: string | null) =>
  documents.filter((doc) => doc.baseId === baseId);
export const baseUpdated = (baseId: string) =>
  docsForBase(baseId)
    .map((doc) => doc.updated)
    .sort()
    .at(-1) ?? "";
export const resolvePassage = (ref: string) => {
  const [documentId, passageId] = ref.split(":");
  const document = documents.find((doc) => doc.id === documentId);
  const passage = document?.passages.find((item) => item.id === passageId);
  return document && passage ? { document, passage } : undefined;
};
