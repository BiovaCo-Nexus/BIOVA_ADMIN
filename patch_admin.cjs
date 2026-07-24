const fs = require('fs');

const adminCode = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');
const generatedTabs = fs.readFileSync('generated_tabs.txt', 'utf-8');

const parts = generatedTabs.split('];');
const tabsArrayCode = parts[0] + '];';
const renderCode = parts[1].trim();

// Add PlaceholderPage import if not there
let patchedCode = adminCode;
if (!patchedCode.includes("PlaceholderPage")) {
    patchedCode = patchedCode.replace(/import { BiovaCoLogo } from "@\/components\/BiovaCoLogo"/, 
        'import { BiovaCoLogo } from "@/components/BiovaCoLogo"\nimport { PlaceholderPage } from "@/components/PlaceholderPage"');
}

// Add new icons to lucide-react import
const existingLucideImportMatch = patchedCode.match(/import\s+{([^}]+)}\s+from\s+"lucide-react"/);
if (existingLucideImportMatch) {
    const existingIcons = new Set(existingLucideImportMatch[1].split(',').map(s => s.trim()));
    const newIcons = ["BarChart3", "Briefcase", "Bot", "Calendar", "FileText", "Users", "Network", "CreditCard", "Mail", "Package", "Factory", "Settings", "FlaskConical", "Globe", "Image", "Kanban", "Shield"];
    for (const icon of newIcons) existingIcons.add(icon);
    
    patchedCode = patchedCode.replace(existingLucideImportMatch[0], `import {\n  ${Array.from(existingIcons).join(',\n  ')}\n} from "lucide-react"`);
}

// Replace INITIAL_TABS
patchedCode = patchedCode.replace(/const INITIAL_TABS = \[([\s\S]*?)\];/, tabsArrayCode);

// Inject render code at the end of the conditionally rendered block
// Before: {activeTab === "news" && <NewsManagement />}
// Before: {activeTab === "access_settings" && <UserAccessSettings />}
//             </>
//           )}
//         </main>

patchedCode = patchedCode.replace(
    /\{activeTab === "access_settings" && <UserAccessSettings \/>\}/g,
    `{activeTab === "access_settings" && <UserAccessSettings />}\n${renderCode}`
);

fs.writeFileSync('src/pages/Admin.tsx', patchedCode);
console.log("Patched Admin.tsx");
