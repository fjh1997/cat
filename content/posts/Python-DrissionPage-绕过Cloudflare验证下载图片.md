---
title: Python DrissionPage 绕过Cloudflare验证下载图片
date: 2026-03-09 15:00:00
url: /posts/24102.html
tags:
  - Python
  - 爬虫
  - Cloudflare
---

有些网站（如 linux.do）的图片资源受 Cloudflare 保护，直接用 requests 请求会被拦截。本文介绍如何用 DrissionPage 控制真实浏览器通过验证，提取 cookie 后用 urllib 批量下载图片。

## 思路

1. 用 DrissionPage 启动 Chromium 浏览器访问目标页面
2. 等待 Cloudflare "Just a moment" 验证页面自动通过
3. 通过 CDP 协议提取浏览器中的 cookie
4. 用提取到的 cookie 构造请求头，用 urllib 下载图片

## 关键代码

### 1. 配置浏览器选项

```python
from DrissionPage import Chromium, ChromiumOptions

def build_browser_options(proxy_url: str | None) -> ChromiumOptions:
    options = ChromiumOptions()
    options.set_argument("--no-first-run")
    options.set_argument("--disable-features=Translate")
    if proxy_url:
        options.set_argument(f"--proxy-server={proxy_url}")
    options.auto_port()  # 自动分配调试端口，避免冲突
    return options
```

`auto_port()` 让每次启动使用不同端口，可以多实例并行。

### 2. 等待 Cloudflare 验证通过

```python
import time

PAGE_WAIT_SECONDS = 20

def wait_for_page(tab) -> None:
    wait_rounds = max(1, PAGE_WAIT_SECONDS // 2)
    for _ in range(wait_rounds):
        time.sleep(2)
        try:
            title = (tab.title or "").strip()
            lowered = title.lower()
            # Cloudflare 验证页的标题包含这些关键词
            if title and "just a moment" not in lowered and "checking your browser" not in lowered:
                return
        except Exception:
            pass
    time.sleep(3)
```

原理很简单：Cloudflare 验证页的 `<title>` 通常是 "Just a moment..." 或 "Checking your browser..."，只要轮询到标题变成正常内容，就说明验证通过了。

### 3. 通过 CDP 提取 Cookie

这是最核心的部分——用 Chrome DevTools Protocol 的 `Network.getAllCookies` 拿到浏览器里的所有 cookie：

```python
def domain_matches(host: str, domain: str) -> bool:
    """判断 host 是否匹配 cookie 的 domain 字段"""
    normalized = domain.lstrip(".")
    return bool(normalized) and (host == normalized or host.endswith(f".{normalized}"))


def extract_cookie_header(browser: Chromium, tab, host: str) -> str:
    cookies: list[dict] = []

    # 方法1: 通过 CDP 协议获取所有 cookie（包括 HttpOnly 的）
    try:
        cookies.extend(tab.run_cdp("Network.getAllCookies").get("cookies", []))
    except Exception:
        pass

    # 方法2: 通过 DrissionPage API 获取
    try:
        cookies.extend(browser.cookies(all_info=True))
    except Exception:
        pass

    # 去重，只保留目标域名的 cookie
    seen: set[tuple[str, str, str]] = set()
    host_cookies: list[dict] = []
    for cookie in cookies:
        domain = cookie.get("domain", "")
        if not domain_matches(host, domain):
            continue
        key = (cookie.get("name", ""), domain, cookie.get("path", "/"))
        if key in seen:
            continue
        seen.add(key)
        host_cookies.append(cookie)

    # 拼接成 HTTP Cookie 头格式
    return "; ".join(
        f"{cookie['name']}={cookie['value']}"
        for cookie in host_cookies
        if cookie.get("name") and cookie.get("value") is not None
    )
```

两种方式互补取 cookie：CDP 的 `Network.getAllCookies` 能拿到 `HttpOnly` 标记的 cookie（Cloudflare 的 `cf_clearance` 就是 HttpOnly 的），DrissionPage 自带的 API 作为兜底。

### 4. 收集会话信息（完整流程）

把上面的步骤串起来，打开浏览器 → 等验证 → 轮询提取 cookie → 验证 cookie 有效性：

```python
COOKIE_WAIT_SECONDS = 180

def collect_site_session(
    site_url: str,
    proxy_url: str | None,
    validation_url: str | None = None,
) -> tuple[str, str]:
    host = urllib.parse.urlparse(site_url).hostname or ""
    options = build_browser_options(proxy_url)

    browser = None
    try:
        browser = Chromium(options)
        tab = browser.latest_tab
        tab.get(site_url)
        wait_for_page(tab)

        deadline = time.time() + COOKIE_WAIT_SECONDS
        while time.time() < deadline:
            time.sleep(3)
            cookie_header = extract_cookie_header(browser, tab, host)
            if not cookie_header:
                continue

            # 从浏览器获取真实 User-Agent
            try:
                user_agent = tab.run_js("return navigator.userAgent")
            except Exception:
                user_agent = "Mozilla/5.0 ..."

            # 如果提供了验证 URL，先试下载一张图验证 cookie 是否可用
            if validation_url:
                ok, reason = probe_session(opener, validation_url, cookie_header, user_agent, site_url)
                if ok:
                    return cookie_header, user_agent
                continue

            return cookie_header, user_agent
    finally:
        if browser is not None:
            browser.quit()

    return "", "Mozilla/5.0 ..."
```

关键点：
- 设 180 秒超时，留足人工点击验证码的时间
- 每 3 秒轮询一次 cookie，拿到后立即用 `probe_session` 试下载一张图片验证 cookie 是否有效
- 用 `tab.run_js("return navigator.userAgent")` 获取浏览器真实 UA，保证后续请求的 UA 和获取 cookie 时一致

### 5. 带 Cookie 下载图片

```python
import ssl
import urllib.request

def build_opener(proxy_url: str | None) -> urllib.request.OpenerDirector:
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE  # 跳过 SSL 验证

    handlers = [urllib.request.HTTPSHandler(context=ssl_context)]
    if proxy_url:
        handlers.insert(0, urllib.request.ProxyHandler({
            "http": proxy_url, "https": proxy_url,
        }))
    return urllib.request.build_opener(*handlers)


def download_image(opener, url, output_path, cookie_header, user_agent) -> bool:
    request = urllib.request.Request(url)
    request.add_header("User-Agent", user_agent)
    request.add_header("Accept", "image/webp,image/apng,image/*,*/*;q=0.8")
    request.add_header("Referer", f"{urllib.parse.urlparse(url).scheme}://{urllib.parse.urlparse(url).netloc}/")
    request.add_header("Cookie", cookie_header)

    with opener.open(request, timeout=30) as response:
        data = response.read()
        content_type = response.headers.get("Content-Type", "")

    if not data or "text/html" in content_type.lower():
        raise ValueError(f"下载失败, content-type={content_type!r}")

    output_path.write_bytes(data)
    return True
```

注意设置 `Referer` 头，有些 CDN 会校验来源。下载后检查 `Content-Type`，如果返回的是 HTML 而不是图片，说明 cookie 已失效或被拦截了。

## 安装依赖

```bash
pip install DrissionPage
```

DrissionPage 会自动查找系统中已安装的 Chromium 内核浏览器（Chrome、Edge 等），无需额外安装 chromedriver。

## 总结

整个方案的核心就一句话：**用真实浏览器过 Cloudflare 验证，通过 CDP 协议偷 cookie，再把 cookie 塞到 urllib 请求里下载资源**。相比 undetected-chromedriver 等方案，DrissionPage 的优势是 API 简洁，且内置了 CDP 操作支持。
