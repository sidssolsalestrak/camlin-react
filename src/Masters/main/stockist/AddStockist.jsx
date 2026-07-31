import React, { useEffect, useState } from 'react'
import axios from "../../../services/api";
import { Box, Button, Grid } from '@mui/material';
import StockDetails from './StockDetails';
import SalestrakCredential from './SalestrakCredential';
import OtherDetails from './OtherDetails';
import { ImDownload3 } from "react-icons/im";
import useToast from "../../../utils/useToast";
import ConfirmationDialog from "../../../utils/confirmDialog";
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getMasterPanel } from "../../../services/masterPanelService";

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
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const showAlert = useToast();
    const [loading, setloading] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE)
    const [defaultUserId, setDefaultUserId] = useState(null);
    const [masterPanel, setMasterPanel] = useState({});
    const [accStat, setAccStat] = useState(null);

    // label derived from masterPanel with fallback
    const stkLabel = masterPanel["STKS"] || "Stockist";
    const userLabel = masterPanel["USER"] || "Users";
    const zoneLabel = masterPanel["ZONE"] || "Zone";
    const regionLabel = masterPanel["REGN"] || "Region";
    const areaLabel = masterPanel["AREA"] || "Area";
    const territoryLabel = masterPanel["TERR"] || "Territory";

    useEffect(() => {
        const loadMasterPanel = async () => {
            const data = await getMasterPanel();
            setMasterPanel(data);
        };
        loadMasterPanel();
    }, []);

    useEffect(() => {
        try {
            const accStat = localStorage.getItem("acc_stat");
            setAccStat(accStat);
            console.log("Acc Stat", accStat)
        } catch (err) {
            console.log(err);
        }
    }, []);

    /*---------- original cat code and name for edit---------*/
    const [original, setoriginal] = useState({
        userID: "",
        password: "",
    })
    const [errors, setErrors] = useState({});
    /*---------- decode params ---------*/
    const decodedId = id ? atob(id) : null;
    const isReactivate = searchParams.get('reactivate') === '1';

    /*------------ handle form change ------------*/
    const handleChangeForm = (field, value) => {
        //allow only numbers
        const numRegex = /^[0-9]*$/;

        //allow only numbers
        if (["pin", "phone", "mobile"].includes(field)) {
            if (!numRegex.test(value)) return; // stop if alphabets or special char entered
        }

        setFormData((prev) => ({
            ...prev,
            [field]: value
        }))

        // Clear error for this field on change
        const hasValue = typeof value === "string" ? value.trim() !== "" : Array.isArray(value) ? value.length > 0 : !!value;

        if (errors[field] && hasValue) {
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
            title: isReactivate ? `Reactivate ${stkLabel}` : `${decodedId ? "Edit" : "Add"} ${stkLabel}`,
            message: isReactivate
                ? `Are you sure you want to reactivate this ${stkLabel}?`
                : `Are you sure you want to ${decodedId ? "Edit" : "Add"} this record?`,
            confirmText: isReactivate ? "Reactivate" : (decodedId ? "Update" : "Add"),
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
                code: data.stk_code || "",
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
            const emailRegex = /^[^\s@A-Z]+@[^\s@A-Z]+\.[^\s@A-Z]+$/;
            return emailRegex.test(value);
        };

        const validateUser = (value) => {
            const regex = /^[a-zA-Z0-9_]*$/;
            return regex.test(value);
        };

        const validatePassword = (value) => {
            const regex = /^(?=(?:.*[a-z]){2,})(?=(?:.*[A-Z]){2,})(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;
            return regex.test(value);
        };

        // StockDetails validation
        if (!formData.type) newErrors.type = "The Type field is required.";
        if (!formData.code || formData.code.trim() === "") newErrors.code = `${stkLabel} Code is required`;
        if (!formData.name || formData.name.trim() === "") newErrors.name = `The ${stkLabel} Name field is required.`;

        if (!formData.email || formData.email.trim() === "") newErrors.email = "The Email field is required.";
        else if (!validateEmail(formData.email)) newErrors.email = "Invalid email format";

        if (!formData.mobile) newErrors.mobile = "The Mobile No field is required.";
        else if (formData.mobile.length !== 10) newErrors.mobile = "Enter a valid 10-digit mobile number";

        // SalestrakCredential validation
        if (!formData.userID || formData.userID.trim() === "") newErrors.userID = `The ${userLabel} ID field is required.`;

        if (!original.password) {
            if (!formData.password) newErrors.password = "The Password field is required.";
            else if (!validatePassword(formData.password)) newErrors.password = "Min 8 chars, 2 lowercase, 2 uppercase, 1 digit, 1 special character";

            if (!formData.confirmPassword) newErrors.confirmPassword = "The Confirm Password field is required.";
            else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Password didn't Match";
        }

        // OtherDetails validation
        if (!formData.zone) newErrors.zone = `The ${zoneLabel} field is required.`;
        if (!formData.region) newErrors.region = `The ${regionLabel} field is required.`;
        if (!formData.area) newErrors.area = `The ${areaLabel} field is required.`;
        if (!formData.teritory) newErrors.teritory = `The ${territoryLabel} field is required.`;
        if (!formData.user.length > 0) newErrors.user = `The ${userLabel} field is required.`;
        if (!formData.supplied_Type) newErrors.supplied_Type = "The Supplied Type field is required.";
        if (!formData.supplied_By) newErrors.supplied_By = "The Supplied By field is required.";
        if (!formData.state) newErrors.state = "The State field is required.";
        if (!formData.city) newErrors.city = "The City field is required.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /*------------ payload for submit and edit ------------*/
    let payload = {
        stk_type_id: formData.type,
        stk_code: (formData.code || "").toString().trim() || 0,
        stk_name: (formData.name || "").trim(),
        stk_add: (formData.Address || "").trim(),
        stk_cont: (formData.contactPerson || "").trim(),
        stk_pin: (formData.pin || "").toString().trim() || 0,
        stk_tel: (formData.phone || "").toString().trim() || 0,
        stk_mob: (formData.mobile || "").toString().trim(),
        stk_email: (formData.email || "").trim(),
        state_id: formData.state,
        city_id: formData.city,
        stk_cat_id: formData.category || 0,
        stk_matrix_id: formData.matrixGroup || 0,
        zone_id: formData.zone,
        reg_id: formData.region,
        area_id: formData.area,
        ter_id: formData.teritory,
        stk_login: (formData.userID || "").trim(),
        stk_pwd: formData.password,
        sup_id: formData.supplied_By || 0,
        sup_type_id: formData.supplied_Type || 0,
        stk_stat: formData.blockStatus,
        user: formData.user ? formData.user.map(u => u.id).join(",") : "",
        password: formData.password ? formData.password.trim() : original.password,
        confpassword: formData.confirmPassword,
        reactivate: isReactivate,
    }

    /*------------ form submit ------------*/
    const handleFormSubmit = async () => {
        try {
            setloading(true);
            payload.original_user = "";
            const res = await axios.post("/create_stockist", payload)
            //console.log("insert res", res);
            if (res?.data?.success) {
                showAlert.success(`${stkLabel} added successfully`)
                setFormData(INITIAL_FORM_STATE)
            }
        } catch (error) {
            if (error?.response?.status === 400) {
                let val = error?.response?.data || "";
                showAlert.error(val?.message || "");
            } else {
                console.error(error);
                showAlert.error("Failed to add")
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
                payload.original_code = original.code;
            }
            const res = await axios.post("/update_stockist", payload)
            if (res?.data?.success) {
                showAlert.success(`${stkLabel} Updated successfully`)
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
        }
    }

    /*---------- Handle edit params ---------*/
    useEffect(() => {
        if (!decodedId) {
            setFormData(INITIAL_FORM_STATE)
            setDefaultUserId(null)
            setErrors({})
            return;
        }
        getEditData(decodedId);
        setErrors({})
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
                                original={original}
                                userLabel={userLabel} />
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
                            {(!decodedId && [0, 1, 2].includes(Number(accStat))) && (
                                <Button
                                    startIcon={<ImDownload3 style={{ height: "15px" }} />}
                                    onClick={() => showSubmitConfirmation()}
                                    sx={{ mt: 2 }} color="primary" variant='contained'>
                                    Create
                                </Button>
                            )}
                            {(decodedId && [0, 2].includes(Number(accStat))) && (
                                <Button
                                    startIcon={<ImDownload3 style={{ height: "15px" }} />}
                                    onClick={() => showSubmitConfirmation()} sx={{ mt: 2 }}
                                    color="primary" variant='contained'>
                                    Update
                                </Button>
                            )}
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