import { useEffect } from "react";
import Layout from "../layout";
import DataTable from "../utils/dataTable";
import { Box } from "@mui/material"

const TestTable = () => {
    const data = [
        { name: "Alice Johnson", age: 28, degree: "B.Sc Computer Science", position: "Frontend Developer", email: "alice.johnson@email.com" },
        { name: "Bob Martinez", age: 34, degree: "M.Sc Data Science", position: "Data Analyst", email: "bob.martinez@email.com" },
        { name: "Clara Thompson", age: 26, degree: "B.A. Graphic Design", position: "UI/UX Designer", email: "clara.thompson@email.com" },
        { name: "David Lee", age: 41, degree: "MBA", position: "Product Manager", email: "david.lee@email.com" },
        { name: "Emma Wilson", age: 30, degree: "M.Sc Software Eng.", position: "Backend Developer", email: "emma.wilson@email.com" },
        { name: "Frank Nguyen", age: 37, degree: "B.Sc Cybersecurity", position: "Security Engineer", email: "frank.nguyen@email.com" },
        { name: "Grace Patel", age: 25, degree: "B.Sc Information Tech", position: "QA Engineer", email: "grace.patel@email.com" },
        { name: "Henry Brown", age: 45, degree: "Ph.D. Computer Sci.", position: "CTO", email: "henry.brown@email.com" },
        { name: "Isabella Garcia", age: 31, degree: "M.Sc AI & ML", position: "ML Engineer", email: "isabella.garcia@email.com" },
        { name: "James Kim", age: 29, degree: "B.Sc Electrical Eng.", position: "DevOps Engineer", email: "james.kim@email.com" },
          { name: "Isabella Garcia", age: 31, degree: "M.Sc AI & ML", position: "ML Engineer", email: "isabella.garcia@email.com" },
        { name: "James Kim", age: 29, degree: "B.Sc Electrical Eng.", position: "DevOps Engineer", email: "james.kim@email.com" },
    ];


    const columns = [
        {
            field: "name",
            headerName: "Name",
            filterable: true,
        },
        {
            field: "age",
            headerName: "Age",
            filterable: true,
            showTotal: true
        },
        {
            field: "degree",
            headerName: "Degree",
            filterable: true,
            subColumns: [
                {
                    field: "degree",
                    headerName: "Degree sub",
                    filterable: true
                },
                {
                    field: "age",
                    headerName: "Role",
                    filterable: true
                },
            ]
        },
        {
            field: "position",
            headerName: "Position",
            filterable: true,
        },
        {
            field: "email",
            headerName: "Email",
            filterable: true,
        }
    ]



    return (
        <Box>
            <Layout>
                <Box sx={{ mt: 5, p: 5 }}>
                    <DataTable
                        columns={columns}
                        data={data}
                    />
                </Box>
            </Layout>
        </Box>
    )
}

export default TestTable