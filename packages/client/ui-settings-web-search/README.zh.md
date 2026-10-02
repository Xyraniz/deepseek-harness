---
description: "Web app 插件页，用于选择 Exa 或 Parallel 搜索，并将 API 密钥保存到私有凭据中。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-web-search

[English](README.md) | 中文

## 概述

在侧栏打开**插件**，在官方分组里选择**网页搜索**。选择 Exa 或 Parallel，粘贴对应提供方的 API 密钥，然后保存。密码框每次打开时为空，只显示是否已配置密钥；留空会保留现有密钥。密钥通过私有凭据域写入，不进入设置文档，因此明文不会出现在任何响应中。页面只在 Host 服务 `web` 命名空间期间存在。

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

官方分组中的**网页搜索**卡片提供提供方下拉框和密钥密码框。选择 Exa 或 Parallel，粘贴对应密钥并按**保存**；密码框留空会保留现有密钥。只读来源（例如进程环境）中的密钥会显示为已配置，但无法在此编辑。提供方选择保存在 `web` 设置行中，而密钥只通过 `remote.credentials.set` 写入；`remote.credentials.describe` 只返回是否已配置和是否可写。按下**保存**之前不会写入，离开页面会丢弃草稿。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

宿主半侧是一个空的 `apply`，只为让本包占一条 Loader 行，客户端模块系统据此送出浏览器半侧。浏览器半侧通过 `ctx.configForms.get` 绑定 `web` 命名空间，并使用 `ui-primitives` 的共享 `SettingsFormModel` 暂存 `searchProvider`。密码框是只写密钥控件：所选提供方决定写入 `EXA_API_KEY` 还是 `PARALLEL_API_KEY`；写入走 `remote.credentials.set`，读取只通过 `remote.credentials.describe` 获取元数据。scope 变化时，以及 Host 对所监视引用发出 `credentials/reference-updated` 时，控制器都会重读凭据。Exa 和 Parallel 会在每次搜索时解析保存的密钥。页面通过 `ctx.configForms.whileServed` 把 `WebSearchCard` 注册到插件页的 `plugins.item` slot。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [ui-plugin-manager](../ui-plugin-manager/README.zh.md)——插件页以及本页注册进去的 `plugins.item` slot。
- [ui-settings](../ui-settings/README.zh.md)——本页依赖的设置 scope 与"命名空间被服务期间"的监视。
- [ui-primitives](../ui-primitives/README.zh.md)——本页渲染的设置表单模型与字段。
- [credentials](../../credentials/README.zh.md)——密钥写入所经的凭据引用 seam。
- [web](../../web/web/README.zh.md)——注册设置命名空间的服务。
- [web-search-exa](../../web/web-search-exa/README.zh.md) 与 [web-search-parallel](../../web/web-search-parallel/README.zh.md)——可选搜索提供方。

-----

<a id="model-experience"></a>
## 模型体验

无，本包是浏览器侧的设置界面，不注册任何模型面。

#### KV 缓存影响

无；本包既不组装也不发送提供方请求。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- **只编辑命名空间的三个字段**——提供方的模型、API 版本和 token 预算保持组合值不变；本页只编辑密钥、接口地址和搜索次数。
- **运行时不变量：**不发布伴生。本页没有自己拥有的关系：它显示的内容派生自设置镜像与凭据域，它写入的内容由 Host 校验。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
