const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// Add imports
const imports = `
import { CEODashboard } from "@/components/dashboards/CEODashboard"
import { MDDashboard } from "@/components/dashboards/MDDashboard"
import { CompanyGoalsOKRs } from "@/components/dashboards/CompanyGoalsOKRs"
import { KPIDashboard } from "@/components/dashboards/KPIDashboard"
import { BusinessIntelligence } from "@/components/dashboards/BusinessIntelligence"
import { ReportsCenter } from "@/components/dashboards/ReportsCenter"
`;
if (!code.includes("import { CEODashboard }")) {
    code = code.replace('import { PlaceholderPage } from "@/components/PlaceholderPage"', 'import { PlaceholderPage } from "@/components/PlaceholderPage"' + imports);
}

// Replace Placeholders with actual components
code = code.replace(/<PlaceholderPage title="CEO Dashboard"[^>]*\/>/g, "<CEODashboard onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="MD Dashboard"[^>]*\/>/g, "<MDDashboard onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="Company Goals \(OKRs\)"[^>]*\/>/g, "<CompanyGoalsOKRs />");
code = code.replace(/<PlaceholderPage title="KPI Dashboard"[^>]*\/>/g, "<KPIDashboard />");
code = code.replace(/<PlaceholderPage title="Business Intelligence"[^>]*\/>/g, "<BusinessIntelligence />");
code = code.replace(/<PlaceholderPage title="Reports Center"[^>]*\/>/g, "<ReportsCenter />");

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched Strategy modules in Admin.tsx");
