# Team Agent Skill Builder

基于 Agent Team 协作框架的 Skill 创建工作流 v2.0，通过 Writer 和 Reviewer 双 Agent 迭代，确保输出高质量、结构化的 Skills。

## 📁 目录结构

```
team-agent-skill-builder/
├── SKILL.md                           # 主技能文档（完整工作流说明）
├── README.md                          # 本文件
├── templates/                         # 模板目录
│   ├── intelligence_library.md        # 智能库收集模板
│   ├── material_library.md            # 材料库组织模板
│   └── dialogue_template.md           # 群对话记录模板
├── examples/                          # 示例目录
│   └── sample_skill_creation.md       # 完整创建示例（Reddit 营销工具包）
└── scripts/                           # 工具脚本
    └── validate_skill.py              # Skill 验证脚本
```

## 🚀 快速开始

### 1. 启动 Skill 创建

在与 AI 对话时，使用以下提示词：

```
请使用 Team Agent Skill Builder 帮我创建一个新的 Skill。

我的需求是：[描述你的场景和目标]
```

### 2. 经历三个阶段

**阶段 1：访谈阶段**
- AI 会通过 2-3 轮对话收集你的需求
- 收集智能库、材料库、群对话材料

**阶段 2：Agent Team 协作**
- Writer Agent 生成初稿
- Reviewer Agent 审核并提出改进建议
- 最多迭代 3 轮直到质量达标

**阶段 3：自迭代系统**
- 根据使用反馈持续优化
- 更新智能库和模板

### 3. 获得交付物

- 完整的 `SKILL.md` 文件
- 配套的模板文件
- 实战示例文档

## 📖 核心概念

### Writer Agent（创作者）
- 负责内容生成和结构化输出
- 应用 `proven_solutions` 和 `RPM` 框架
- 确保输出符合 SKILL.md 格式规范

### Reviewer Agent（审核者）
- 负责质量把关和迭代优化
- 审核访谈深度、结构完整性、可执行性
- 提供建设性反馈和改进建议

### 迭代机制
- 最多 3 轮 Writer ↔ Reviewer 迭代
- 每轮都会优化内容质量
- 达到标准后自动终止

## 🎯 质量标准

一个合格的 Skill 必须包含：

- ✅ YAML frontmatter（name + description）
- ✅ 系统目标（明确的问题定义）
- ✅ 核心工作流（分步骤执行指南）
- ✅ 模板规范（具体的使用说明）
- ✅ 资源位置（相关文件链接）
- ✅ 至少 3 个高价值模板或示例

## 📚 学习资源

### 查看完整文档
阅读 [`SKILL.md`](./SKILL.md) 了解完整的工作流程和使用指南。

### 学习模板使用
- [`intelligence_library.md`](./templates/intelligence_library.md) - 如何收集智能库
- [`material_library.md`](./templates/material_library.md) - 如何组织材料库
- [`dialogue_template.md`](./templates/dialogue_template.md) - 如何记录对话

### 查看实战示例
阅读 [`sample_skill_creation.md`](./examples/sample_skill_creation.md) 查看从访谈到交付的完整案例。

## 🔧 验证工具

使用验证脚本检查你创建的 Skill 是否符合规范：

```bash
python scripts/validate_skill.py <your_skill_path>
```

示例：
```bash
python scripts/validate_skill.py d:/Antigravity/Jackypotato/skills/my-new-skill
```

## 💡 最佳实践

1. **充分访谈** - 不要急于开始创作，花时间理解真实需求
2. **具象表达** - 避免抽象术语，使用具体的场景和数据
3. **迭代优化** - 接受 Reviewer 的反馈，持续改进
4. **保留原话** - 记录用户的原始表述，不要过度转述
5. **验证可用** - 确保所有模板和示例都经过实际测试

## 🎓 进阶技巧

### 自定义迭代次数
默认最多 3 轮迭代，可根据复杂度调整：
- 简单 Skill: 1-2 轮
- 中等复杂度: 2-3 轮
- 高复杂度: 3+ 轮

### 集成外部工具
- `evolution-db.json`: 自动记录迭代历史
- `RPM 框架`: 控制输出长度（≤1000 字）
- `proven_solutions`: 引用已验证的解决方案

## 📊 效果评估

### 成功指标
- ✅ Skill 创建时间 < 30 分钟
- ✅ 首次使用成功率 > 90%
- ✅ 用户满意度评分 > 4.5/5
- ✅ 迭代次数 ≤ 3 轮

## 🤝 贡献

如果你在使用过程中发现问题或有改进建议，欢迎：
1. 记录在 `evolution-db.json`
2. 提交反馈给维护者
3. 参与模板和示例的优化

## 📄 许可证

本 Skill 遵循 MIT 许可证。

---

**版本**: v2.0  
**最后更新**: 2026-02-09  
**维护者**: Team Agent System
