const fs = require('fs');
const lines = fs.readFileSync('tabs_list.txt', 'utf-8').split('\n').filter(l => l.trim().length > 0);

let currentCategory = "";
const tabs = [];

const toId = (str) => {
    return str.replace(/[^a-zA-Z0-9 ]/g, '').trim().toLowerCase().replace(/\s+/g, '_');
};

const getIcon = (str) => {
    str = str.toLowerCase();
    if (str.includes('dashboard') || str.includes('analytics') || str.includes('report') || str.includes('kpi') || str.includes('intelligence')) return 'BarChart3';
    if (str.includes('user') || str.includes('employee') || str.includes('team') || str.includes('intern') || str.includes('customer') || str.includes('contact') || str.includes('vendor')) return 'Users';
    if (str.includes('setting') || str.includes('config') || str.includes('maintenance')) return 'Settings';
    if (str.includes('doc') || str.includes('file') || str.includes('contract') || str.includes('invoice') || str.includes('bill') || str.includes('quote') || str.includes('order')) return 'FileText';
    if (str.includes('mail') || str.includes('message') || str.includes('newsletter') || str.includes('communication')) return 'Mail';
    if (str.includes('cal') || str.includes('time') || str.includes('schedule') || str.includes('holiday') || str.includes('meeting')) return 'Calendar';
    if (str.includes('money') || str.includes('financ') || str.includes('budget') || str.includes('cash') || str.includes('pay') || str.includes('expense') || str.includes('tax') || str.includes('gst')) return 'CreditCard';
    if (str.includes('product') || str.includes('inventory') || str.includes('stock') || str.includes('warehouse') || str.includes('batch')) return 'Package';
    if (str.includes('manufactur') || str.includes('machine') || str.includes('production')) return 'Factory';
    if (str.includes('research') || str.includes('lab') || str.includes('test') || str.includes('experiment')) return 'FlaskConical';
    if (str.includes('web') || str.includes('network') || str.includes('social') || str.includes('integration')) return 'Globe';
    if (str.includes('video') || str.includes('media') || str.includes('image')) return 'Image';
    if (str.includes('project') || str.includes('task') || str.includes('kanban')) return 'Kanban';
    if (str.includes('ai') || str.includes('predict') || str.includes('automat')) return 'Bot';
    if (str.includes('security') || str.includes('access') || str.includes('permission') || str.includes('role')) return 'Shield';
    if (str.includes('chart') || str.includes('hierarchy') || str.includes('org')) return 'Network';
    return 'Briefcase'; // Default
};

let outputTabs = "const INITIAL_TABS = [\n";
let outputRenders = "";
const ids = new Set();
const components = new Set();

for (let line of lines) {
    if (line.match(/^[\uD800-\uDBFF\uDC00-\uDFFF\u2000-\u3300]|^\p{Emoji}/u)) {
        // It's a category
        currentCategory = line.replace(/^[^a-zA-Z]+/, '').trim();
        outputTabs += `\n  // ${currentCategory}\n`;
    } else {
        // It's a tab
        let id = toId(line);
        // Ensure uniqueness
        if (ids.has(id)) {
            id = id + '_' + toId(currentCategory).split('_')[0];
        }
        ids.add(id);
        
        let icon = getIcon(line);
        outputTabs += `  { id: "${id}", label: "${line}", icon: ${icon}, category: "${currentCategory}" },\n`;
        
        // Render block
        outputRenders += `                {activeTab === "${id}" && <PlaceholderPage title="${line}" category="${currentCategory}" />}\n`;
        components.add(icon);
    }
}
outputTabs += "];\n";

fs.writeFileSync('generated_tabs.txt', outputTabs + "\n\n" + outputRenders);
fs.writeFileSync('generated_icons.txt', Array.from(components).join(', '));
console.log("Done");
