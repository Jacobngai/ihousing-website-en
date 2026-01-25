import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwind from '@astrojs/tailwind';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get __dirname equivalent for ES modules
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// EN site: Hardcoded English-only configuration
const SITE_URL = 'https://www.ihousing.net';
const DEFAULT_LOCALE = 'en';

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  },
  site: SITE_URL,
  output: 'static',
  adapter: vercel({
    webAnalytics: {
      enabled: true
    },
    imageService: true,
  }),
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [
    tailwind(),
    sitemap({
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        // Only declare the current locale for this domain
        locales: {
          [DEFAULT_LOCALE]: DEFAULT_LOCALE === 'en' ? 'en-MY' :
                           DEFAULT_LOCALE === 'zh' ? 'zh-Hans-MY' :
                           DEFAULT_LOCALE === 'ms' ? 'ms-MY' : 'en-MY',
        },
      },
      filter: (page) => {
        // Exclude root URL
        if (page === `${SITE_URL}/`) return false;
        return true;
      },
      serialize: (item) => {
        // Extract actual publish date from blog post URLs
        // Pattern: /en/blog/2026-01-25-post-title/ or /en/blog/post-title/
        const blogDateMatch = item.url.match(/\/blog\/(\d{4}-\d{2}-\d{2})-/);
        if (blogDateMatch) {
          // Use actual publish date from URL
          item.lastmod = new Date(blogDateMatch[1] + 'T12:00:00.000Z');
        } else {
          // For non-blog pages, use today's date
          item.lastmod = new Date();
        }

        // Priority rules for iHousing SEO strategy

        // Homepage: 1.0 (highest priority)
        if (item.url.match(/\/?$/)) {
          item.priority = 1.0;
          item.changefreq = 'weekly';
        }
        // Parkland Avenue: 0.95 (special project, high priority)
        else if (item.url.includes('/parkland')) {
          item.priority = 0.95;
          item.changefreq = 'weekly';
        }
        // Investment guides: 0.85 (targeting new investors)
        else if (item.url.includes('/invest/')) {
          item.priority = 0.85;
          item.changefreq = 'weekly';
        }
        // Renovation guides: 0.8 (targeting existing owners)
        else if (item.url.includes('/renovation/')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // Comparisons: 0.75 (decision-making content)
        else if (item.url.includes('/compare/')) {
          item.priority = 0.75;
          item.changefreq = 'monthly';
        }
        // For Owners section: 0.9 (primary target audience)
        else if (item.url.includes('/for-owners/')) {
          item.priority = 0.9;
          item.changefreq = 'monthly';
        }
        // Contact page: 0.8 (lead capture)
        else if (item.url.includes('/contact')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        // Blog index: 0.7
        else if (item.url.includes('/blog/')) {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        }
        // About page: 0.6
        else if (item.url.includes('/about')) {
          item.priority = 0.6;
          item.changefreq = 'monthly';
        }
        // Default for other pages
        else {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }

        return item;
      },
    }),
  ],
  // No i18n routing needed - single language site
  image: {
  image: {
    domains: ['www.ihousing.com.my'],
    remotePatterns: [
      {
        protocol: 'https',
      },
    ],
  },
});
