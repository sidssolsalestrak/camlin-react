import React, { useState } from 'react'
import axios from "../../../services/api";
import { Box, Button } from '@mui/material';
import StockDetails from './StockDetails';
import SalestrakCredential from './SalestrakCredential';
import OtherDetails from './OtherDetails';
import { ImDownload3 } from "react-icons/im";
import { useAlert } from "../../../utils/useAlert"

const boxStyle = { border: 1, borderColor: "divider", borderRadius: "5px", minHeight: "20vh", p: 1 }

const AddStockist = () => {
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        //Stockist Details
        type: "", name: "", code: "", Address: "", mobile: "", phone: "", pin: "", email: "", contactPerson: "",
        //Salestrak Login Credentials
        userID: "", password: "", confirmPassword: "", blockStatus: "0",
        //other Details
        zone: "", region: "", area: "", teritory: "", user: "", supplied_Type: "", supplied_By: "", state: "",
        city: "", category: "", matrixGroup: "",
    })

    const [errors, setErrors] = useState({});

    /*------------ handle form change ------------*/
    const handleChangeForm = (field, value) => {
        // Regex: allows only alphabets and numbers
        const regex = /^[a-zA-Z]*$/;

        if (field === "name") {
            if (!regex.test(value)) return; // stop if special char entered
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value
        }))

        // Clear error for this field on change
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: ""
            }));
        }
    }

    /*------------ form validation ------------*/
    const validateForm = () => {
        const newErrors = {};

        // StockDetails validation
        if (!formData.type) newErrors.type = "Type is required";
        if (!formData.name) newErrors.name = "Name is required";
        if (!formData.email) newErrors.email = "Email is required";
        if (!formData.mobile) newErrors.mobile = "Mobile is required";

        // SalestrakCredential validation
        if (!formData.userID) newErrors.userID = "User ID is required";

        // OtherDetails validation
        if (!formData.zone) newErrors.zone = "Zone is required";
        if (!formData.region) newErrors.region = "Region is required";
        if (!formData.area) newErrors.area = "Area is required";
        if (!formData.teritory) newErrors.teritory = "Territory is required";
        if (!formData.user) newErrors.user = "User is required";
        if (!formData.supplied_Type) newErrors.supplied_Type = "Supplied Type is required";
        if (!formData.supplied_By) newErrors.supplied_By = "Supplied By is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.city) newErrors.city = "City is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /*------------ form submit ------------*/
    const handleFormSubmit = () => {
        if (!validateForm()) {
            showAlert("please fill all the Mandatory Fields", "error")
            return;
        }
        console.log("form data", formData);
    }

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            {/* left block */}
            <Box sx={{ flex: 1 }}>
                {/* Stockist Details */}
                <Box sx={boxStyle}>
                    <StockDetails
                        formData={formData}
                        handleChangeForm={handleChangeForm}
                        errors={errors}
                        setErrors={setErrors} />
                </Box>
                {/* Salestrak Login Credentials */}
                <Box sx={boxStyle} mt={2}>
                    <SalestrakCredential
                        formData={formData}
                        handleChangeForm={handleChangeForm}
                        errors={errors}
                        setErrors={setErrors} />
                </Box>
            </Box>
            {/* right block */}
            <Box sx={{ flex: 1 }}>
                {/* other Details */}
                <Box sx={boxStyle}>
                    <OtherDetails
                        formData={formData}
                        handleChangeForm={handleChangeForm}
                        errors={errors} />
                </Box>
                {/* submit */}
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                    <Button startIcon={<ImDownload3 style={{ height: "15px" }} />}
                        variant='contained' color="primary" onClick={handleFormSubmit}>
                        Create
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}

export default AddStockist
