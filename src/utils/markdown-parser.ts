/**
 * Markdown Parser for iHousing Blog Posts
 * Converts markdown content to HTML with proper styling
 */

export function parseMarkdown(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks (must be before inline code)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)\n(?!<li>)/gs, '$1</ul>\n');
  html = html.replace(/(?<!<\/ul>\n)(<li>)/gs, '<ul>$1');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<oli>$1</oli>');
  html = html.replace(/(<oli>.*<\/oli>)\n(?!<oli>)/gs, '$1</ol>\n');
  html = html.replace(/(?<!<\/ol>\n)(<oli>)/gs, '<ol>$1');
  html = html.replace(/<\/?oli>/g, (match) => match === '<oli>' ? '<li>' : '</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr />');

  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/^(?!<[^>]+>)(.+)$/gm, '<p>$1</p>');
  html = html.replace(/<p><(h[1-4]|ul|ol|li|blockquote|pre|table)/g, '<$1');
  html = html.replace(/<\/(h[1-4]|ul|ol|li|blockquote|pre|table)><\/p>/g, '</$1>');
  html = html.replace(/<p><\/p>/g, '');

  // Clean up extra paragraph tags around lists
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ol>)/g, '$1');
  html = html.replace(/(<\/ol>)<\/p>/g, '$1');
  html = html.replace(/<p>(<li>)/g, '$1');
  html = html.replace(/(<\/li>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  html = html.replace(/<p>(<h[1-4]>)/g, '$1');
  html = html.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr \/>)<\/p>/g, '$1');

  // Tables
  html = html.replace(/\|(.+)\|\n\|[-|\s:]+\|\n((?:\|.+\|\n?)+)/g, (_, header, body) => {
    const headers = header.split('|').filter(h => h.trim()).map(h => `<th>${h.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*<br \/>\s*<\/p>/g, '<br />');

  return html;
}

/**
 * Read and parse a markdown blog post file
 */
export async function parseBlogPost(markdownContent: string): Promise<{
  title: string;
  description: string;
  slug: string;
  date: string;
  category: string;
  language: string;
  content: string;
}> {
  // Extract frontmatter
  const frontmatterMatch = markdownContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('Invalid markdown format - no frontmatter found');
  }

  const frontmatterText = frontmatterMatch[1];
  const content = markdownContent.slice(frontmatterMatch[0].length);

  // Parse frontmatter
  const frontmatter: Record<string, string> = {};
  frontmatterText.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes from value
      frontmatter[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  // Parse markdown content to HTML
  const htmlContent = parseMarkdown(content);

  return {
    title: frontmatter.title || '',
    description: frontmatter.description || '',
    slug: frontmatter.slug || '',
    date: frontmatter.date || '',
    category: frontmatter.category || '',
    language: frontmatter.language || 'en',
    content: htmlContent
  };
}
