const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// Add imports
const imports = `
import { CRMDashboard } from "@/components/dashboards/CRMDashboard"
import { Leads } from "@/components/dashboards/Leads"
import { Opportunities } from "@/components/dashboards/Opportunities"
import { Accounts } from "@/components/dashboards/Accounts"
import { Contacts } from "@/components/dashboards/Contacts"
import { Customers } from "@/components/dashboards/Customers"
import { SalesPipeline } from "@/components/dashboards/SalesPipeline"
import { Quotations } from "@/components/dashboards/Quotations"
import { FollowUps } from "@/components/dashboards/FollowUps"
import { Meetings } from "@/components/dashboards/Meetings"
import { Calls } from "@/components/dashboards/Calls"
import { Emails } from "@/components/dashboards/Emails"
import { Deals } from "@/components/dashboards/Deals"
import { CustomerSupport } from "@/components/dashboards/CustomerSupport"
import { Complaints } from "@/components/dashboards/Complaints"
import { Feedback } from "@/components/dashboards/Feedback"
import { Contracts } from "@/components/dashboards/Contracts"
`;

if (!code.includes("import { CRMDashboard }")) {
    code = code.replace('import { HRDashboard } from "@/components/dashboards/HRDashboard"', imports + 'import { HRDashboard } from "@/components/dashboards/HRDashboard"');
}

// Replace Placeholders with actual components
code = code.replace(/<PlaceholderPage title="CRM Dashboard"[^>]*\/>/g, "<CRMDashboard onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="Leads"[^>]*\/>/g, "<Leads />");
code = code.replace(/<PlaceholderPage title="Opportunities"[^>]*\/>/g, "<Opportunities />");
code = code.replace(/<PlaceholderPage title="Accounts \(Companies\)"[^>]*\/>/g, "<Accounts />");
code = code.replace(/<PlaceholderPage title="Contacts"[^>]*\/>/g, "<Contacts />");
code = code.replace(/<PlaceholderPage title="Customers"[^>]*\/>/g, "<Customers />");
code = code.replace(/<PlaceholderPage title="Sales Pipeline"[^>]*\/>/g, "<SalesPipeline onNavigateToTab={handleNavigateToTab} />");
code = code.replace(/<PlaceholderPage title="Quotations"[^>]*\/>/g, "<Quotations />");
code = code.replace(/<PlaceholderPage title="Follow-ups"[^>]*\/>/g, "<FollowUps />");
code = code.replace(/<PlaceholderPage title="Meetings"[^>]*\/>/g, "<Meetings />");
code = code.replace(/<PlaceholderPage title="Calls"[^>]*\/>/g, "<Calls />");
code = code.replace(/<PlaceholderPage title="Emails"[^>]*\/>/g, "<Emails />");
code = code.replace(/<PlaceholderPage title="Deals"[^>]*\/>/g, "<Deals />");
code = code.replace(/<PlaceholderPage title="Customer Support"[^>]*\/>/g, "<CustomerSupport />");
code = code.replace(/<PlaceholderPage title="Complaints"[^>]*\/>/g, "<Complaints />");
code = code.replace(/<PlaceholderPage title="Feedback"[^>]*\/>/g, "<Feedback />");
code = code.replace(/<PlaceholderPage title="Contracts"[^>]*\/>/g, "<Contracts />");

fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Patched CRM modules in Admin.tsx");
