const fs = require('fs');
let code = fs.readFileSync('src/pages/Admin.tsx', 'utf-8');

// The mapping of new IDs to existing components
const mappings = {
    "executive_calendar": "<CeoMdTimetable />",
    "intern_management": "<InternManagement />",
    "document_generator": "<DocumentGenerator initialPayload={documentPayload} onClearPayload={() => setDocumentPayload(undefined)} />",
    "job_positions": "<JobPositionsManagement />",
    "marketing_posts": "<MarketingPostsManagement />",
    "audit_logs": "<AdminActivityLogs onNavigateToTab={handleNavigateToTab} />",
    "knowledge_tracker": "<KnowledgeTracker />",
    "rd_lab": "<RDLabManagement />",
    "press_media": "<NewsManagement />",
    "access_control": "<UserAccessSettings />",
    "dashboard": "<UniversalDashboard onNavigateToTab={handleNavigateToTab} />"
};

for (const [id, comp] of Object.entries(mappings)) {
    // Look for {activeTab === "id" && <PlaceholderPage... />} and replace with comp
    const regex = new RegExp(`\\{activeTab === "${id}" && <PlaceholderPage[^>]+/>\\}`, "g");
    code = code.replace(regex, `{activeTab === "${id}" && ${comp}}`);
}

// Write it back
fs.writeFileSync('src/pages/Admin.tsx', code);
console.log("Fixed components");
