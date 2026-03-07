'use strict';

hexo.extend.filter.register('after_render:html', function (str, data) {
  if (!data.path) return str;

  var config = this.config;
  var url = config.url;
  var page = data.page || {};
  var scripts = [];

  // Determine page URL
  var pageUrl = url + '/' + data.path;
  pageUrl = pageUrl.replace(/\/index\.html$/, '/');

  // Author object reused across schemas
  var author = {
    '@type': 'Person',
    name: config.author,
    url: url
  };

  // --- Home page: WebSite schema ---
  if (data.path === 'index.html') {
    scripts.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.title,
      url: url,
      description: config.description,
      inLanguage: config.language,
      author: author
    });
  }

  // --- Article page: BlogPosting schema ---
  if (page.layout === 'post' && page.title) {
    var description = page.description || page.excerpt || config.description;
    // Strip HTML tags from excerpt
    description = description.replace(/<[^>]+>/g, '').trim();
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }

    var posting = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': pageUrl
      },
      headline: page.title,
      url: pageUrl,
      datePublished: page.date ? page.date.toISOString() : undefined,
      dateModified: page.updated ? page.updated.toISOString() : (page.date ? page.date.toISOString() : undefined),
      author: author,
      publisher: {
        '@type': 'Organization',
        name: config.title,
        url: url
      },
      description: description,
      inLanguage: config.language
    };

    // Add image if cover exists
    if (page.cover) {
      posting.image = page.cover;
    }

    // Add tags as keywords
    if (page.tags && page.tags.length) {
      var keywords = [];
      page.tags.forEach(function (tag) {
        keywords.push(tag.name);
      });
      if (keywords.length) {
        posting.keywords = keywords.join(', ');
      }
    }

    scripts.push(posting);
  }

  // --- BreadcrumbList for all pages ---
  var breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: config.title,
        item: url
      }
    ]
  };

  if (page.layout === 'post' && page.title) {
    breadcrumb.itemListElement.push({
      '@type': 'ListItem',
      position: 2,
      name: page.title,
      item: pageUrl
    });
  } else if (data.path !== 'index.html') {
    // Archive, tag, category pages etc.
    var pageName = page.title || data.path.replace(/\/index\.html$/, '').replace(/\.html$/, '');
    if (pageName) {
      breadcrumb.itemListElement.push({
        '@type': 'ListItem',
        position: 2,
        name: pageName,
        item: pageUrl
      });
    }
  }

  scripts.push(breadcrumb);

  // Inject JSON-LD before </head>
  if (scripts.length) {
    var jsonld = scripts.map(function (s) {
      return '<script type="application/ld+json">' + JSON.stringify(s) + '</script>';
    }).join('\n');
    str = str.replace(/<\/head>/, jsonld + '\n</head>');
  }

  return str;
});
