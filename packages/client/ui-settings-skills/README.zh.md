---
description: "dsh Web 客户端独立的 Skills 设置页，用于启停随包提供的 Claude Design skill。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-skills

[English](README.md) | 中文

## 概述

在设置中打开 **Skills**，即可启用或停用随包提供的 **Claude Design** skill。基础 profile 默认启用它。开关会写入 `skill-filesystem` 的 `claudeDesignEnabled` volatile 字段，因此更改会保存在当前 profile 中，并更新 Host 的 skill 目录。停用随包副本不会影响同名的项目级和用户级 skills。该 skill 的随包内容来自 NousResearch 的 Hermes Agent；其元数据注明作者 BadTechBandit 和 MIT 许可证。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

独立的 **Skills** 分区会显示随包提供的 Claude Design skill 及其上游来源。打开开关会把随包副本加入 Host skill 目录；关闭后只会移除这个随包副本。设置会立即保存到当前 profile 的 `skill-filesystem` 条目。Host 服务此配置命名空间期间，此页面才会显示。

上游文件为 [NousResearch/hermes-agent 的 `skills/creative/claude-design/SKILL.md`](https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/claude-design)。上游元数据注明作者 BadTechBandit 和 MIT 许可证；随包文件保留原始元数据与来源说明。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

浏览器包会在 `ctx.configForms` 提供 `skill-filesystem` 时注册独立的 `settings.section` 条目。其控制器写入 volatile 字段 `claudeDesignEnabled`。启用时，文件系统 provider 会加入随包 skill 根目录；停用时只过滤自己随包的 `claude-design` 候选项，项目、自定义和用户目录保持独立。Settings 文档更新后会使 Host skill 目录失效并重新发现。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-settings](../ui-settings/README.zh.md)——Settings slots 与即时 Config 表单服务。
- [ui-settings-general](../ui-settings-general/README.zh.md)——Settings 外壳与导航分区。
- [ui-primitives](../ui-primitives/README.zh.md)——本页使用的开关控件。
- [skill-filesystem](../../skill/skill-filesystem/README.zh.md)——Host provider 与随包 skill 目录。
- [NousResearch Hermes Agent skill source](https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/claude-design)——上游 `claude-design` skill。

-----

<a id="model-experience"></a>
## 模型体验

无。此包属于浏览器设置界面，不注册模型界面。

#### KV Cache 影响

无；此包不组装或发送 provider 请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **当前只有一个随包 skill**——页面目前只提供 Claude Design。
- **仅 Web 设置**——页面由 web-app bundle 引入，不提供终端设置界面。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
