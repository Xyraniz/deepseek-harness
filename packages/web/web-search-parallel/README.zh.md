---
description: "ctx.web 的 Parallel Search 提供方，支持私有凭据存储并返回规范化的引用来源。"
kind: "package-reference"
---

# @deepseek-ai/dsh-web-search-parallel

[English](README.md) | 中文

## 概述

`dsh-web-search-parallel` 将 Parallel Search 注册为 `ctx.web` 的 `parallel` 后端。base 组合会将它作为默认 Exa 的替代项一并提供。结果会把首个非空白 excerpt 映射为共享来源 snippet，并保留发布日期。Web app 的插件页会将 `PARALLEL_API_KEY` 保存到私有凭据库；无界面部署可通过启动环境提供该密钥。

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

在 `@deepseek-ai/dsh-web` 之后挂载本提供方，并通过 `searchProvider: parallel` 选择它。每次搜索都会从凭据服务解析密钥；否则会回退到启动环境中的 `PARALLEL_API_KEY`。

```yaml
- name: '@deepseek-ai/dsh-web'
  config:
    searchProvider: parallel
- name: '@deepseek-ai/dsh-web-search-parallel'
```

在 Web app 中选择**插件 → 网页搜索 → Parallel**，粘贴 API 密钥并保存。密钥会写入私有凭据库，而不是设置文件。

| 字段 | 默认值 | 含义 |
|---|---|---|
| `apiKey` | `$PARALLEL_API_KEY` | API 密钥；私有凭据库中的已保存值优先 |
| `baseURL` | `https://api.parallel.ai/v1` | API 基址；末尾会追加 `/search` |
| `mode` | `fast` | Parallel 检索模式：`turbo`、`fast`、`basic` 或 `advanced` |

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现细节——点击展开</summary>

每次共享 web 搜索都会把查询作为单项 `search_queries` 数组和检索目标发送，并附上所选模式。请求会在 `x-api-key` 中发送密钥，并设置 `redirect: error`。没有非空白 excerpt 的结果会被丢弃；首个 excerpt 映射为 `snippet`，`publish_date` 映射为 `publishedAt`。凭据在每次请求时解析，因此浏览器设置页保存的密钥可直接用于搜索，且不会写入配置。

</details>

<a id="further-exploration"></a>
## 进一步探索

- [web](../README.zh.md)——共享提供方选择服务。
- [web 子系统](../../../docs/subsystems/web.zh.md)——请求、结果与提供方约定。
- [tool-web](../tool-web/README.zh.md)——面向模型的 `web_search` 工具。
- [web-search-exa](../web-search-exa/README.zh.md)——base 组合默认提供的另一种搜索方式。

<a id="model-experience"></a>
## 模型体验

Parallel 会向共享的 `web_search` 工具提供带引用的搜索来源。该提供方不会创建额外的面向模型工具，也不会更改工具 schema。

## 已知限制与延期工作

本提供方需要有效的 Parallel API 密钥。共享来源约定要求可移植 snippet，因此没有 excerpt 的结果会被丢弃。提供方额度、账户访问权限和返回结果由 Parallel 决定。

<a id="dev-note"></a>
## 开发备注

无。
