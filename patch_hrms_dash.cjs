const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// Add imports
const imports = `
import { HRDashboard } from "@/components/dashboards/HRDashboard"
import { Employees } from "@/components/dashboards/Employees"
import { Attendance } from "@/components/dashboards/Attendance"
import { LeaveManagement } from "@/components/dashboards/LeaveManagement"
import { Payroll } from "@/components/dashboards/Payroll"
import { PerformanceReviews } from "@/components/dashboards/PerformanceReviews"
import { OfferLetters } from "@/components/dashboards/OfferLetters"
import { ExitManagement } from "@/components/dashboards/ExitManagement"
import { AssetsAssigned } from "@/components/dashboards/AssetsAssigned"
`;

if (!code.includes("import { HRDashboard }")) {
    code = code.replace('import { CompanyProfile } from "@/components/dashboards/CompanyProfile"', imports + 'import { CompanyProfile } from "@/components/dashboards/CompanyProfile"');
}

// Replace Placeholders with actual components
code = code.replace(/<PlaceholderPage title="HR Dashboard"[^>]*\/>/g, "<HRDashboard onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="Employees"[^>]*\/>/g, "<Employees />");
code = code.replace(/<PlaceholderPage title="Attendance"[^>]*\/>/g, "<Attendance />");
code = code.replace(/<PlaceholderPage title="Leave Management"[^>]*\/>/g, "<LeaveManagement />");
code = code.replace(/<PlaceholderPage title="Payroll"[^>]*\/>/g, "<Payroll />");
code = code.replace(/<PlaceholderPage title="Performance Reviews"[^>]*\/>/g, "<PerformanceReviews />");
code = code.replace(/<PlaceholderPage title="Offer Letters"[^>]*\/>/g, "<OfferLetters />");
code = code.replace(/<PlaceholderPage title="Exit Management"[^>]*\/>/g, "<ExitManagement />");
code = code.replace(/<PlaceholderPage title="Assets Assigned"[^>]*\/>/g, "<AssetsAssigned />");

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched HRMS modules in Admin.tsx");
