const fs = require('fs');

let deptCode = fs.readFileSync('src/components/dashboards/Departments.tsx', 'utf-8');
deptCode = deptCode.replace(
`    if (!newDept.name) return`,
`    if (!newDept.name) { toast({ title: "Validation Error", description: "Department name is required.", variant: "destructive" }); return; }`
);
fs.writeFileSync('src/components/dashboards/Departments.tsx', deptCode);

let branchCode = fs.readFileSync('src/components/dashboards/Branches.tsx', 'utf-8');
branchCode = branchCode.replace(
`    if (!newBranch.name) return`,
`    if (!newBranch.name) { toast({ title: "Validation Error", description: "Branch name is required.", variant: "destructive" }); return; }`
);
fs.writeFileSync('src/components/dashboards/Branches.tsx', branchCode);

let teamCode = fs.readFileSync('src/components/dashboards/Teams.tsx', 'utf-8');
teamCode = teamCode.replace(
`    if (!newTeam.name || !newTeam.department_id) return`,
`    if (!newTeam.name || !newTeam.department_id) { toast({ title: "Validation Error", description: "Team name and department are required.", variant: "destructive" }); return; }`
);
fs.writeFileSync('src/components/dashboards/Teams.tsx', teamCode);

console.log("Added validation toasts.");
