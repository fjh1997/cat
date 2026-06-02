---
title: Claude Code与Codebuddy Code配置自动审批与无代理fetch全攻略
abbrlink: 73921
date: 2026-06-02 12:00:00
tags:
  - Claude
  - Codebuddy
  - AI编程
  - 代理配置
---
用 AI 编程工具最烦的两件事：一是每次执行命令都要点"同意"，二是 WebFetch/WebSearch 在国内网络环境下动不动就超时。本文分别介绍 Claude Code 和 Codebuddy Code 如何配置自动审批权限，以及如何让 fetch 类命令在无代理（翻墙）情况下正常工作。

## 一、Claude Code 配置

Claude Code 的配置文件位于 `~/.claude/settings.json`（Windows 为 `%USERPROFILE%\.claude\settings.json`）。

### 1.1 自动审批（无需手动确认）

Claude Code 的权限系统核心是 `defaultMode`，它决定了工具调用的默认审批行为。将其设为 `bypassPermissions` 即可跳过所有权限弹窗：

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash(*)",
      "WebFetch",
      "WebSearch",
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "NotebookEdit(*)"
    ]
  }
}
```

**`defaultMode` 的可选值**（这是 Claude Code 权限系统的关键，很多人只配了 `allow` 却没生效，就是缺了这个）：

| 模式 | 行为 |
|------|------|
| `default` | 标准行为：首次使用每个工具时弹窗确认 |
| `acceptEdits` | 自动接受文件编辑和常见文件操作（mkdir、touch、mv、cp 等） |
| `plan` | 计划模式：只读，不编辑源文件 |
| `auto` | 自动审批工具调用，但有后台安全检查（研究预览功能） |
| `dontAsk` | 未在 `allow` 中预审批的工具自动拒绝（而非弹窗询问） |
| **`bypassPermissions`** | **跳过所有权限弹窗**，仅保留 `rm -rf /` 和 `rm -rf ~` 的硬编码熔断保护 |

**为什么 `defaultMode` 才是关键**：只配 `allow` 列表而不设 `defaultMode`，Claude Code 仍然会对未匹配的工具弹出确认框。`bypassPermissions` 是全局开关，`allow` 列表则用于更细粒度的控制（如只允许特定命令 `Bash(npm run *)` 而非全部）。两者配合使用效果最佳。

> ⚠️ `bypassPermissions` 会跳过对 `.git`、`.claude`、`.vscode` 等目录的写入保护，建议仅在隔离环境（容器、虚拟机）中使用。

如果你还想跳过危险模式的二次确认提示，再加上：

```json
{
  "skipDangerousModePermissionPrompt": true
}
```

### 1.2 让 Fetch 在国内网络下可用

Claude Code 的 WebFetch 和 WebSearch 需要访问外部 API，在国内直连经常超时。解决方法是配置 HTTP 代理环境变量，在 `settings.json` 的 `env` 字段中设置：

```json
{
  "env": {
    "http_proxy": "http://127.0.0.1:10808",
    "https_proxy": "http://127.0.0.1:10808"
  }
}
```

> 其中 `10808` 是你本地代理客户端（如 Clash/V2Ray）的 HTTP 代理端口，请按实际情况修改。

另外，如果你使用的代理存在自签证书，还需要设置跳过 TLS 验证（启动 Claude Code 前在终端执行）：

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

### 1.3 其他实用配置

```json
{
  "model": "opus",
  "theme": "dark",
  "autoUpdates": false,
  "skipWebFetchPreflight": true
}
```

- `model`：指定默认模型
- `skipWebFetchPreflight`：跳过 WebFetch 的预检请求（OPTIONS），某些代理环境下 preflight 会被拦截，开启后直接发 GET 请求

### 1.4 Claude Code 完整配置参考

```json
{
  "enabledPlugins": {
    "rust-analyzer-lsp@claude-plugins-official": true
  },
  "env": {
    "http_proxy": "http://127.0.0.1:10808",
    "https_proxy": "http://127.0.0.1:10808"
  },
  "model": "opus",
  "theme": "dark",
  "autoUpdates": false,
  "skipWebFetchPreflight": true,
  "skipDangerousModePermissionPrompt": true,
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash(*)",
      "WebFetch",
      "WebSearch",
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "NotebookEdit(*)"
    ]
  }
}
```

## 二、Codebuddy Code 配置

Codebuddy Code 的配置文件位于 `~/.codebuddy/config.json`（Windows 为 `%USERPROFILE%\.codebuddy\config.json`）。

### 2.1 自动审批

Codebuddy Code 同样采用 `defaultMode` + `allow` 白名单的权限模型，配置方式与 Claude Code 一致：

```json
{
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash(*)",
      "WebFetch",
      "WebSearch",
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "NotebookEdit(*)"
    ]
  }
}
```

- `defaultMode: "bypassPermissions"` 是关键全局开关，跳过所有权限审批
- `allow` 列表定义了具体允许的工具操作，与 Claude Code 的写法一致

### 2.2 让 Fetch 正常工作

和 Claude Code 类似，在 `env` 字段中配置代理：

```json
{
  "env": {
    "http_proxy": "http://127.0.0.1:10808",
    "https_proxy": "http://127.0.0.1:10808"
  }
}
```

如果代理有自签证书问题，启动前同样需要设置：

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
```

### 2.3 Codebuddy Code 完整配置参考

```json
{
  "env": {
    "http_proxy": "http://127.0.0.1:10808",
    "https_proxy": "http://127.0.0.1:10808"
  },
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": [
      "Bash(*)",
      "WebFetch",
      "WebSearch",
      "Edit(*)",
      "Write(*)",
      "Read(*)",
      "NotebookEdit(*)"
    ]
  }
}
```

## 三、无代理环境下的替代方案

如果你没有本地代理客户端，还有几种方式让 Fetch 生效：

### 方案 A：使用系统代理

如果公司/学校网络有统一代理，直接把代理地址填入 `env` 即可：

```json
{
  "env": {
    "http_proxy": "http://proxy.company.com:8080",
    "https_proxy": "http://proxy.company.com:8080"
  }
}
```

### 方案 B：Cloudflare Worker 反代

对于 WebFetch 抓取特定网站的场景，可以部署一个 Cloudflare Worker 作为反向代理，然后在工具中直接访问 Worker 地址，无需翻墙。具体方法参考之前的[文章](https://blog.csdn.net/fjh1997/article/details/135051515)。

### 方案 C：跳过 Preflight 请求

部分代理环境会拦截 OPTIONS 预检请求导致 WebFetch 失败。Claude Code 可设置：

```json
{
  "skipWebFetchPreflight": true
}
```

Codebuddy Code 中同样有类似配置项，开启后直接发送 GET 请求，绕过 preflight。

## 四、安全提醒

自动审批模式虽然方便，但也意味着 AI 工具可以不经确认地执行任何命令、读写任何文件。建议：

1. **仅在受控环境中使用**，不要在生产服务器上开启
2. **定期检查操作日志**，确认没有误操作
3. **敏感目录可以用 `deny` 列表排除**，例如：
   ```json
   {
     "permissions": {
       "defaultMode": "bypassPermissions",
       "allow": ["Bash(*)", "Read(*)"],
       "deny": ["Bash(rm -rf /*)"]
     }
   }
   ```

---

配置完成后，AI 编程助手就能丝滑地自动执行命令和访问网络了，再也不用频繁点确认了。
