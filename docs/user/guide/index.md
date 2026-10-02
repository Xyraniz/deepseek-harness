# Use the Web UI

English | [中文](index.zh.md)

Start the Web UI through the [root README](../../../README.md#run); the command prints its URL. This guide begins after that server is running. The `dsh` process uses its invoking directory as the default filesystem location, but a fresh Web UI has no selected workspace until you add one.

## Configure a model

Open **Settings → Models**, enter a [DeepSeek API key](https://platform.deepseek.com/), and save it. The model route becomes usable immediately without restarting the server.

The [model configuration guide](./providers.md) covers other providers and custom OpenAI-compatible endpoints.

## Choose a workspace

Click **Choose workspace**, add the project directory where you started `dsh`, and select it. The session composer remains unavailable until a workspace is selected.

## Run a task

Start a session and send:

> Summarize this repository and identify its main packages.

The agent can read and edit workspace files, run commands, delegate work, and maintain a plan. The Web UI asks before operations that require approval under the active permission policy.

## Open the Web UI on a phone

For a phone on the same Wi-Fi, run `dsh --profile web --mobile` on your computer and scan the QR code printed in the terminal. The phone and computer must be able to reach each other over the local network.

For access outside your Wi-Fi, configure a named Cloudflare Tunnel to the local Web server (`http://127.0.0.1:3080`) and run `dsh --profile web --public-url https://dsh.example.com`. DSH prints a tokenized link and QR code; it does not ask for Cloudflare credentials, while the named tunnel itself must already be configured in Cloudflare and `cloudflared`. Quick Tunnels are not supported because their edge buffers Server-Sent Events, which DSH uses for live responses ([Cloudflare Quick Tunnel limits](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)). The printed link grants access to the session, so share it only with trusted people.

## Continue

- [Configure models](./providers.md)
- [Use the Python SDK](./python-sdk.md)
- [Use other CLI modes](../../../apps/cli/README.md)
- [Develop a plugin](../develop/basic/index.md)
