import React, { useEffect, useState } from 'react'
import axios from "../../../services/api";
import { Box, Button, Grid } from '@mui/material';
import StockDetails from './StockDetails';
import SalestrakCredential from './SalestrakCredential';
import OtherDetails from './OtherDetails';
import { ImDownload3 } from "react-icons/im";
import useToast from "../../../utils/useToast";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { useNavigate, useParams } from 'react-router-dom';

const boxStyle = { border: 1, borderColor: "divider", borderRadius: "5px", minHeight: "20vh", p: 1 }

const INITIAL_FORM_STATE = {
    //Stockist Details
    type: "", name: "", code: "", Address: "", mobile: "", phone: "", pin: "", email: "", contactPerson: "",
    //Salestrak Login Credentials
    userID: "", password: "", confirmPassword: "", blockStatus: "0",
    //other Details
    zone: "", region: "", area: "", teritory: "", user: [], supplied_Type: "", supplied_By: "", state: "",
    city: "", category: "", matrixGroup: "",
};

const AddStockist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const showAlert = useToast();
    const [loading, setloading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE)
    const [defaultUserId, setDefaultUserId] = useState(null);
    /*---------- original cat code and name for edit---------*/
    const [original, setoriginal] = useState({
        userID: "",
        password: "",
    })
    const [errors, setErrors] = useState({});
    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;

    /*------------ handle form change ------------*/
    const handleChangeForm = (field, value) => {
        // Regex: allows only alphabets and numbers
        const regex = /^[a-zA-Z]*$/;
        //allow only numbers
        const numRegex = /^[0-9]*$/;

        if (field === "name") {
            if (!regex.test(value)) return; // stop if special char entered
        }

        //allow only numbers
        if (["pin", "phone", "mobile"].includes(field)) {
            if (!numRegex.test(value)) return; // stop if alphabets or special char entered
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

    /*-------- confirmation modal -------*/
    const [confirmationDialog, setConfirmationDialog] = useState({
        open: false,
        title: "",
        message: "",
        onConfirm: null,
        loading: false,
        confirmText: "Confirm",
        cancelText: "Cancel",
        confirmColor: "primary"
    });

    const showConfirmationDialog = (config) => {
        setConfirmationDialog({
            ...confirmationDialog,
            ...config,
            open: true,
        });
    };

    const closeConfirmationDialog = () => {
        setConfirmationDialog({
            ...confirmationDialog,
            open: false,
        });
    };

    const showSubmitConfirmation = () => {
        if (!validateForm()) {
            showAlert.error("please fill all the Mandatory Fields", "error")
            return;
        }
        showConfirmationDialog({
            title: `${decodedId ? "Edit" : "Add"} Stockist`,
            message: `Are you sure you want to ${decodedId ? "Edit" : "Add"} this Stockist?`,
            confirmText: decodedId ? "Update" : "Add",
            confirmColor: "primary",
            onConfirm: () => !decodedId ? handleFormSubmit() : onEdit(),
        });
    };

    /*---------- get data for edit ---------*/
    const getEditData = async (decodedId) => {
        try {
            const res = await axios.post("/edit_Stockist", { id: decodedId })
            const data = res?.data?.data?.[0] || {};

            //get user id for user
            try {
                const userRes = await axios.post("/get_user", { stk_id: data?.id });
                const result = userRes?.data?.data || {};
                const rawUserId = result?.map((id) => id.user_id);
                const userIds = Array.isArray(rawUserId) ? rawUserId : [rawUserId].filter(Boolean);
                setDefaultUserId(userIds);
            } catch (error) {
                console.log(error);
            }

            setFormData({
                type: data.stk_type_id || "",
                code: data.stk_code || "",
                name: data.stk_name || "",
                Address: data.stk_add || "",
                contactPerson: data.stk_cont || "",
                pin: String(data.stk_pin) || "",
                phone: String(data.stk_tel) || "",
                mobile: String(data.stk_mob) || "",
                email: data.stk_email || "",
                state: data.state_id || "",
                city: data.city_id || "",
                category: data.stk_cat_id || "",
                matrixGroup: data.stk_matrix_id || "",
                zone: data.zone_id || "",
                region: data.reg_id || "",
                area: data.area_id || "",
                teritory: data.ter_id || "",
                userID: data.stk_login || "",
                supplied_By: data.sup_id || "",
                supplied_Type: data.sup_type_id || "",
                blockStatus: String(data.stk_stat) || "",
                password: "",
                confirmPassword: "",
                user: [],
            });

            setoriginal({
                userID: data.stk_login || "",
                password: data.stk_pwd || "",
            });

        } catch (error) {
            console.error(error);
            showAlert.error("Failed to edit")
        }
    }

    /*------------ form validation ------------*/
    const validateForm = () => {
        const newErrors = {};
        const validateEmail = (value) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            return emailRegex.test(value);
        };
        const validateUser = (value) => {
            const regex = /^[a-zA-Z0-9_]*$/;
            return regex.test(value);
        };
        const validatePassword = (value) => {
            const regex = /^[^\s]{8,}$/;
            return regex.test(value);
        };

        // StockDetails validation
        if (!formData.type) newErrors.type = "Type is required";
        if (!formData.name) newErrors.name = "Name is required";

        if (!formData.email) newErrors.email = "Email is required";
        else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";

        if (!formData.mobile) newErrors.mobile = "Mobile No is required";
        else if (formData.mobile.length !== 10) newErrors.mobile = "Enter a valid 10-digit mobile number";

        // SalestrakCredential validation
        if (!formData.userID) newErrors.userID = "User ID is required";
        else if (!validateUser(formData.userID)) newErrors.userID = "Invalid User Name";

        if (!original.password) {
            if (!formData.password) newErrors.password = "Password is required";
            else if (!validatePassword(formData.password)) newErrors.password = "Should be Min 8 Characters";

            if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm Password is required";
            else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Password didn't Match";
        }

        // OtherDetails validation
        if (!formData.zone) newErrors.zone = "Zone is required";
        if (!formData.region) newErrors.region = "Region is required";
        if (!formData.area) newErrors.area = "Area is required";
        if (!formData.teritory) newErrors.teritory = "Territory is required";
        if (!formData.user.length > 0) newErrors.user = "User is required";
        if (!formData.supplied_Type) newErrors.supplied_Type = "Supplied Type is required";
        if (!formData.supplied_By) newErrors.supplied_By = "Supplied By is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.city) newErrors.city = "City is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /*------------ payload for submit and edit ------------*/
    let payload = {
        stk_type_id: formData.type,
        stk_code: formData.code || 0,
        stk_name: formData.name,
        stk_add: formData.Address,
        stk_cont: formData.contactPerson,
        stk_pin: formData.pin || 0,
        stk_tel: formData.phone || 0,
        stk_mob: formData.mobile,
        stk_email: formData.email,
        state_id: formData.state,
        city_id: formData.city,
        //city_name,
        stk_cat_id: formData.category || 0,
        stk_matrix_id: formData.matrixGroup || 0,
        zone_id: formData.zone,
        reg_id: formData.region,
        area_id: formData.area,
        ter_id: formData.teritory,
        stk_login: formData.userID,
        stk_pwd: formData.password,
        sup_id: formData.supplied_By || 0,
        sup_type_id: formData.supplied_Type || 0,
        stk_stat: formData.blockStatus,
        user: formData.user ? formData.user.map(u => u.id).join(",") : "",
        password: formData.password ? formData.password : original.password,
        confpassword: formData.confirmPassword,
    }

    /*------------ form submit ------------*/
    const handleFormSubmit = async () => {
        try {
            setloading(true);
            payload.original_user = "";
            const res = await axios.post("/create_stockist", payload)
            //console.log("insert res", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Created Stockist")
                setFormData(INITIAL_FORM_STATE)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "");
            } else {
                console.error(error);
                showAlert.error("Failed to Update")
            }
        } finally {
            setloading(false);
            closeConfirmationDialog();
        }
    }

    /*------------ form edit ------------*/
    const onEdit = async () => {
        try {
            setloading(true);
            if (decodedId) {
                payload.id = String(decodedId);
                payload.original_name = original.name;
                payload.original_user = original.userID;
                payload.original_password = original.password;
            }
            const res = await axios.post("/update_stockist", payload)
            //console.log("insert res", res);
            if (res?.data?.success) {
                showAlert.success("Successfully Updated Stockist")
                navigate(`/masters/stockist`)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "");
            } else {
                console.error(error);
                showAlert.error("Failed to Update")
            }
        } finally {
            setloading(false);
            closeConfirmationDialog();
            setFormData(INITIAL_FORM_STATE)
            getEditData(decodedId);
        }
    }

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData(INITIAL_FORM_STATE)
            return;
        }
        getEditData(decodedId);
    }, [decodedId]);

    return (
        <Box>
            <Grid container spacing={2}>
                {/* left block */}
                <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
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
                                setErrors={setErrors}
                                original={original} />
                        </Box>
                    </Box>
                </Grid>
                {/* right block */}
                <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                    <Box sx={{ flex: 1 }}>
                        {/* other Details */}
                        <Box sx={boxStyle}>
                            <OtherDetails
                                formData={formData}
                                handleChangeForm={handleChangeForm}
                                errors={errors}
                                defaultUserId={defaultUserId} />
                        </Box>
                        {/* submit */}
                        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "flex-start", md: "flex-end" }, mt: 3 }}>
                            <Button startIcon={<ImDownload3 style={{ height: "15px" }} />}
                                variant='contained' color="primary" onClick={() => showSubmitConfirmation()}>
                                {decodedId ? "Update" : "Create"}
                            </Button>
                        </Box>
                    </Box>
                </Grid>
            </Grid>
            <ConfirmationDialog
                open={confirmationDialog.open}
                onClose={closeConfirmationDialog}
                onConfirm={confirmationDialog.onConfirm}
                title={confirmationDialog.title}
                message={confirmationDialog.message}
                confirmText={confirmationDialog.confirmText}
                cancelText={confirmationDialog.cancelText}
                loading={loading}
                confirmColor={confirmationDialog.confirmColor}
            />
        </Box>
    )
}

export default AddStockist