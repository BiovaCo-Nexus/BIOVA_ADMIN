const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// Add imports
const imports = `
import { CompanyProfile } from "@/components/dashboards/CompanyProfile"
import { Departments } from "@/components/dashboards/Departments"
import { Branches } from "@/components/dashboards/Branches"
import { Teams } from "@/components/dashboards/Teams"
import { OrganizationChart } from "@/components/dashboards/OrganizationChart"
`;
if (!code.includes("import { CompanyProfile }")) {
    code = code.replace('import { CEODashboard } from "@/components/dashboards/CEODashboard"', imports + 'import { CEODashboard } from "@/components/dashboards/CEODashboard"');
}

// Replace Placeholders with actual components
code = code.replace(/<PlaceholderPage title="Company Profile"[^>]*\/>/g, "<CompanyProfile />");
code = code.replace(/<PlaceholderPage title="Departments"[^>]*\/>/g, "<Departments onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="Branches"[^>]*\/>/g, "<Branches />");
code = code.replace(/<PlaceholderPage title="Teams"[^>]*\/>/g, "<Teams onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="Organization Chart"[^>]*\/>/g, "<OrganizationChart />");

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched Organization modules in Admin.tsx");
