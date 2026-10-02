# 使用 Web UI

[English](index.md) | 中文

请先按照[根目录 README](../../../README.zh.md#run) 中的说明启动 Web UI；命令会打印其访问地址。本指南从服务器已经运行的状态开始。`dsh` 进程会把启动时所在的目录作为默认文件系统位置；全新的 Web UI 则不会选中任何工作区，你需要添加一个工作区。

## 配置模型

打开**设置 → 模型**，输入 [DeepSeek API 密钥](https://platform.deepseek.com/)并保存。模型路由会立即可用，不需要重启服务器。

[模型配置指南](./providers.zh.md)介绍其他提供方和自定义 OpenAI 兼容端点。

## 选择工作区

点击**选择工作区**，添加启动 `dsh` 时所在的项目目录，然后选中它。选中工作区前，会话输入框不可用。

## 运行任务

启动一个会话并发送：

> Summarize this repository and identify its main packages.

Agent（智能体）可以读取和编辑工作区文件、运行命令、委派工作并维护计划。如果根据当前权限策略，某项操作需要审批，Web UI 会先询问你。

## 在手机上打开 Web UI

如果手机和电脑连接同一个 Wi-Fi，请在电脑上运行 `dsh --profile web --mobile`，然后扫描终端中显示的二维码。手机必须能通过本地网络访问这台电脑。

若要从当前 Wi-Fi 之外访问，请配置命名 Cloudflare Tunnel 指向本地 Web 服务（`http://127.0.0.1:3080`），然后运行 `dsh --profile web --public-url https://dsh.example.com`。DSH 会打印带 token 的链接和二维码；它不会索取 Cloudflare 凭据，但命名隧道必须已在 Cloudflare 与 `cloudflared` 中完成配置。Quick Tunnel 不受支持，因为其边缘节点会缓冲 Server-Sent Events，而 DSH 使用 SSE 传输实时响应（[Cloudflare Quick Tunnel 限制](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)）。打印的链接允许访问该会话，因此只与可信的人分享。

## 继续使用

- [配置模型](./providers.zh.md)
- [使用 Python SDK](./python-sdk.zh.md)
- [使用其他 CLI 模式](../../../apps/cli/README.zh.md)
- [开发插件](../develop/basic/index.zh.md)
