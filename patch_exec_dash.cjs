const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// Add imports
const imports = `
import { MyWork } from "@/components/dashboards/MyWork"
import { Notifications } from "@/components/dashboards/Notifications"
import { AIBusinessAssistant } from "@/components/dashboards/AIBusinessAssistant"
import { GlobalSearch } from "@/components/dashboards/GlobalSearch"
`;
if (!code.includes("import { MyWork }")) {
    code = code.replace('import { PlaceholderPage } from "@/components/PlaceholderPage"', 'import { PlaceholderPage } from "@/components/PlaceholderPage"' + imports);
}

// Replace Placeholders with actual components
code = code.replace(/<PlaceholderPage title="My Work"[^>]*\/>/g, "<MyWork />");
code = code.replace(/<PlaceholderPage title="Notifications" category="Executive Dashboard"[^>]*\/>/g, "<Notifications />");
code = code.replace(/<PlaceholderPage title="AI Business Assistant"[^>]*\/>/g, "<AIBusinessAssistant />");
code = code.replace(/<PlaceholderPage title="Global Search"[^>]*\/>/g, "<GlobalSearch />");

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched Admin.tsx");
