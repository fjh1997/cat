'use strict';

hexo.extend.filter.register('after_render:html', function (str, data) {
  var url = this.config.url;
  if (!data.path) return str;
  var canonical = url + '/' + data.path;
  // Normalize: remove trailing index.html
  canonical = canonical.replace(/\/index\.html$/, '/');
  var tag = '<link rel="canonical" href="' + canonical + '">';
  return str.replace(/<head>/, '<head>\n' + tag);
});
