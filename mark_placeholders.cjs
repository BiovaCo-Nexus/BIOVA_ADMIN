const fs = require('fs');

const content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

// Find all tabs that render PlaceholderPage
const regex = /activeTab\s*===\s*["']([^"']+)["']\s*&&\s*<PlaceholderPage/g;
let match;
const placeholderIds = new Set();
while ((match = regex.exec(content)) !== null) {
  placeholderIds.add(match[1]);
}

console.log('Found placeholder IDs:', placeholderIds.size);

// Now update INITIAL_TABS
const initialTabsStart = content.indexOf('const INITIAL_TABS = [');
const initialTabsEnd = content.indexOf('];', initialTabsStart);

if (initialTabsStart === -1 || initialTabsEnd === -1) {
  console.error("Could not find INITIAL_TABS");
  process.exit(1);
}

const beforeTabs = content.substring(0, initialTabsStart);
const tabsContent = content.substring(initialTabsStart, initialTabsEnd);
const afterTabs = content.substring(initialTabsEnd);

// Replace label: "Something" with label: "🔴 Something" IF the id matches
const newTabsContent = tabsContent.replace(/\{([^}]+)\}/g, (match, inner) => {
  const idMatch = inner.match(/id:\s*["']([^"']+)["']/);
  if (idMatch && placeholderIds.has(idMatch[1])) {
    // It's a placeholder tab! Add red dot to label if not already there
    return match.replace(/label:\s*["']([^"']+)["']/, (labelMatch, labelValue) => {
      if (!labelValue.startsWith('🔴')) {
        return `label: "🔴 ${labelValue}"`;
      }
      return labelMatch;
    });
  }
  return match;
});

const newContent = beforeTabs + newTabsContent + afterTabs;

fs.writeFileSync('src/pages/Admin.tsx', newContent);
console.log('Done marking placeholders!');
