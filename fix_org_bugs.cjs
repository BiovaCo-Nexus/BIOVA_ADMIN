const fs = require('fs');

// 1. Fix Departments.tsx
let deptCode = fs.readFileSync('src/components/dashboards/Departments.tsx', 'utf-8');
deptCode = deptCode.replace(
`    const { error } = await supabase.from('departments').insert(newDept)
    if (!error) {
      toast({ title: "Success", description: "Department added." })
      setNewDept({ name: "", head_name: "" })
      fetchDepartments()
    }`,
`    const { error } = await supabase.from('departments').insert(newDept)
    if (error) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Department added." })
      setNewDept({ name: "", head_name: "" })
      fetchDepartments()
    }`
);
fs.writeFileSync('src/components/dashboards/Departments.tsx', deptCode);

// 2. Fix Branches.tsx
let branchCode = fs.readFileSync('src/components/dashboards/Branches.tsx', 'utf-8');
branchCode = branchCode.replace(
`    const { error } = await supabase.from('branches').insert(newBranch)
    if (!error) {
      toast({ title: "Success", description: "Branch added." })
      setNewBranch({ name: "", city: "", branch_manager: "" })
      fetchBranches()
    }`,
`    const { error } = await supabase.from('branches').insert(newBranch)
    if (error) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Branch added." })
      setNewBranch({ name: "", city: "", branch_manager: "" })
      fetchBranches()
    }`
);
fs.writeFileSync('src/components/dashboards/Branches.tsx', branchCode);

// 3. Fix Teams.tsx
let teamCode = fs.readFileSync('src/components/dashboards/Teams.tsx', 'utf-8');
teamCode = teamCode.replace(
`    const { error } = await supabase.from('teams').insert(newTeam)
    if (!error) {
      toast({ title: "Success", description: "Team created." })
      setNewTeam({ name: "", leader_name: "", department_id: "" })
      fetchData()
    }`,
`    const { error } = await supabase.from('teams').insert(newTeam)
    if (error) {
      console.error(error);
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Success", description: "Team created." })
      setNewTeam({ name: "", leader_name: "", department_id: "" })
      fetchData()
    }`
);
fs.writeFileSync('src/components/dashboards/Teams.tsx', teamCode);

console.log("Added error toasts to forms.");
