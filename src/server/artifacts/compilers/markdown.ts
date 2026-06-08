import type { ArtifactType, ProposalCategory, Rule } from "@prisma/client";

type RuleGroupMap = Record<ProposalCategory, Rule[]>;

const categoryLabel: Record<ProposalCategory, string> = {
  personal: "个人规则",
  ai_collaboration: "AI 协作",
  coding: "编码规范",
  writing: "写作风格",
  knowledge: "知识沉淀",
  product: "产品思考",
};

function groupRules(rules: Rule[]) {
  return rules.reduce<RuleGroupMap>(
    (accumulator, rule) => {
      accumulator[rule.category].push(rule);
      return accumulator;
    },
    {
      personal: [],
      ai_collaboration: [],
      coding: [],
      writing: [],
      knowledge: [],
      product: [],
    },
  );
}

function toBulletList(rules: Rule[]) {
  if (rules.length === 0) {
    return ["- 暂无明确规则，后续可继续通过素材和反馈补齐。"];
  }

  return rules.map((rule) => `- ${rule.content}`);
}

function section(title: string, lines: string[]) {
  return [`## ${title}`, "", ...lines, ""].join("\n");
}

function buildAgentsMarkdown(groups: RuleGroupMap) {
  return [
    "# AGENTS.md",
    "",
    section("Project / User Context", [
      "- 当前项目追求 workflow-first、human-approved、artifact-oriented 的 PersonaOS 体系。",
      "- 任何输出都应优先遵守已有规则库，而不是即时发挥。",
    ]),
    section("Core Principles", toBulletList([...groups.personal, ...groups.knowledge])),
    section("AI Collaboration Rules", toBulletList(groups.ai_collaboration)),
    section("Coding Style", toBulletList(groups.coding)),
    section("Project Structure Preferences", [
      ...toBulletList(groups.product),
      ...toBulletList(groups.knowledge),
    ]),
    section("Boundaries", [
      ...toBulletList(groups.ai_collaboration.filter((rule) => /不要|禁止|边界|依赖|架构/.test(rule.content))),
      ...toBulletList(groups.coding.filter((rule) => /不要|禁止|边界|依赖|架构/.test(rule.content))),
    ]),
    section("Validation Requirements", [
      "- 修改后优先通过可复现、可检查的方式验证结果。",
      "- 对关键步骤保留可追踪输入输出，避免不可复盘的隐式变更。",
    ]),
    section("Communication Style", toBulletList(groups.writing)),
  ].join("\n");
}

function buildWritingStyleMarkdown(groups: RuleGroupMap) {
  return [
    "# Writing Style Guide",
    "",
    section("Core Voice", toBulletList([...groups.personal, ...groups.writing])),
    section("Structure Preferences", toBulletList(groups.writing)),
    section(
      "What to Avoid",
      toBulletList(
        [...groups.personal, ...groups.ai_collaboration, ...groups.writing].filter((rule) =>
          /不要|避免|禁止|反模式|空话|散/.test(rule.content),
        ),
      ),
    ),
    section("Preferred Blog Structure", [
      "- 先给出核心判断，再逐层展开背景、分析、例子和结论。",
      "- 长文不为了简短而牺牲信息量，而是通过标题、表格、步骤和示例降低理解成本。",
      ...toBulletList(groups.knowledge),
    ]),
    section("Examples of Good Output", [
      "- 高信息密度，但每一段都围绕主线推进。",
      "- 观点明确，证据和判断边界清楚，不用空泛形容词填充篇幅。",
    ]),
    section("Revision Rules", [
      "- 修改时优先修正结构和逻辑，而不是只做表层措辞替换。",
      "- 如果一段内容过散，优先重排层级、加小标题或改成流程化表达。",
    ]),
  ].join("\n");
}

function buildPersonalSystemMarkdown(groups: RuleGroupMap) {
  const orderedCategories: ProposalCategory[] = [
    "personal",
    "ai_collaboration",
    "coding",
    "writing",
    "knowledge",
    "product",
  ];

  return [
    "# Personal System",
    "",
    "## System Overview",
    "",
    "- 这份文档汇总 PersonaOS 当前已经确认的正式规则，用于统一个人偏好、工作方式和输出标准。",
    "",
    ...orderedCategories.flatMap((category) => [
      `## ${categoryLabel[category]}`,
      "",
      ...toBulletList(groups[category]),
      "",
    ]),
    "## Operating Notes",
    "",
    "- 所有新增规则都应先经过 proposal 审核，再进入正式规则库。",
    "- 如果输出不稳定，应优先回溯到素材、洞察和提案，而不是直接覆盖正式资产。",
    "",
  ].join("\n");
}

export function compileArtifactMarkdown(type: ArtifactType, rules: Rule[]) {
  const grouped = groupRules(rules);

  if (type === "agents_md") {
    return buildAgentsMarkdown(grouped);
  }

  if (type === "writing_style") {
    return buildWritingStyleMarkdown(grouped);
  }

  return buildPersonalSystemMarkdown(grouped);
}
