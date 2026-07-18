const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src/components');
files.push('./src/pages/Admin.tsx');
files.push('./src/pages/Auth.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace class names directly for tailwind integration
  content = content.replace(/text-\[#032E63\]/g, 'text-foreground');
  content = content.replace(/text-\[#08A04B\]/g, 'text-muted-foreground');
  
  content = content.replace(/bg-\[#032E63\]/g, 'bg-foreground text-background');
  content = content.replace(/bg-\[#08A04B\]/g, 'bg-secondary text-secondary-foreground');
  
  content = content.replace(/border-\[#032E63\]/g, 'border-border');
  content = content.replace(/border-\[#08A04B\]/g, 'border-border');
  content = content.replace(/border-l-\[#032E63\]/g, 'border-l-border');
  content = content.replace(/border-l-\[#08A04B\]/g, 'border-l-border');
  content = content.replace(/border-t-\[#032E63\]/g, 'border-t-border');
  content = content.replace(/border-t-\[#08A04B\]/g, 'border-t-border');

  content = content.replace(/fill-\[#032E63\]/g, 'fill-foreground');
  content = content.replace(/fill-\[#08A04B\]/g, 'fill-muted-foreground');

  content = content.replace(/bg-\[#f8fafc\]/g, 'bg-muted/20');
  
  // General hex fallback for inline styles (like HTML emails)
  content = content.replace(/#032E63/gi, '#18181b'); // near black
  content = content.replace(/#08A04B/gi, '#71717a'); // muted gray
  content = content.replace(/#f8fafc/gi, '#fafafa'); // light bg

  fs.writeFileSync(file, content, 'utf8');
});

console.log("Replaced colors in " + files.length + " files");
