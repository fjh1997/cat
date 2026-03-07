'use strict';

hexo.extend.filter.register('before_post_render', function (data) {
  if (data.description) return data;
  if (!data._content) return data;

  // Strip markdown syntax to get plain text
  var text = data._content
    .replace(/^---[\s\S]*?---/, '')       // remove frontmatter
    .replace(/!\[.*?\]\(.*?\)/g, '')      // remove images
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // keep link text
    .replace(/#{1,6}\s+/g, '')            // remove headings
    .replace(/[*_~`>]/g, '')              // remove emphasis/quote marks
    .replace(/```[\s\S]*?```/g, '')       // remove code blocks
    .replace(/`[^`]+`/g, '')             // remove inline code
    .replace(/\n+/g, ' ')                // collapse newlines
    .replace(/\s+/g, ' ')                // collapse whitespace
    .trim();

  if (text.length > 0) {
    data.description = text.substring(0, 150);
  }

  return data;
});
