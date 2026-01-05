---
title: 使用cloudflare worker反代网站
date: 2021-10-07 23:25:50
tags:
---

```javascript
//这个代码是用example1.com反代example2.com

const current = 'example1.com'
const origin = 'example2.com'
 addEventListener('fetch', event => {
event.respondWith(handleRequest(event.request))
})
async function handleRequest(request) {
// new URL object to play with,
// based on the one being requested.
// e.g. https://domain.com/blog/page
var url = new URL(request.url)
// set hostname to the place we're proxying requests from
url.hostname = origin
url.protocol = 'https:';
console.log(url.pathname);
// remove the first occurence of /blog
// so it requests / of the proxy domain
// pass the modified url back to the request,
let response = await fetch(url, request)

if (request.url.endsWith('.png') ||request.url.endsWith('.jpg')||request.url.endsWith('.css')||request.url.endsWith('.gif')) {
    return response
  }
let { readable, writable } = new TransformStream()
  streamBody(response.body, writable)
  return new Response(readable, response)
}

async function streamBody(readable, writable) {
  let reader = readable.getReader()
  let writer = writable.getWriter()
  const decoder = new TextDecoder('utf-8')
  const encoder = new TextEncoder('utf-8')
  
  let body = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    body += decoder.decode(value)
  }

  body = body.replace(new RegExp(current,'g'), origin);
  await writer.write(encoder.encode(body))

  await writer.close()
}
```

