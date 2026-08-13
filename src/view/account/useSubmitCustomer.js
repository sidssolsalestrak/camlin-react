import { useCallback } from "react";
import api from "../../services/api";
import useToast from "../../utils/useToast";

const validateEmail = (email) => {
  const filter =
    /^([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  return filter.test(email);
};

const validateMobile = (mobile) => {
  return mobile && mobile.length === 10;
};

export function useSubmitCustomer({ form, clinics, brandData = [], competitorBrands = [], competitorRows = [], setFieldErrors, setForm }) {
  const toast = useToast();
  console.log("form which is Passes to submit",form)
  console.log("clinics which is pass to submit",clinics)
  console.log("potentiality which is pass to submit",brandData)
  console.log("competitor brands passing",competitorBrands)
  // ── Shared validation & payload builder ──────────────────────────────────
  const validateAndBuild = () => {
    const newErrors = {};
    const toastMessages = [];
    let hasError = false;

    if(!form.cusType){
      newErrors.cusType = "Account Type is Required";
      hasError=true
    }
    if(!form.retailerType){
     newErrors.retailerType = "Type is Required";
     hasError=true
    }
    if(!form.potentiality){
      newErrors.potentiality ="Potentiality Class is Required";
      hasError=true
    }


    // ── 1. FIRST NAME ─────────────────────────────────────────────────────
    if (!form.firstName || !form.firstName.trim()) {
      newErrors.firstName = "Store Name is required";
      hasError = true;
    }

    // ── 2. REGION ─────────────────────────────────────────────────────────
    if (!form.region || form.region === "0" || form.region === "") {
      newErrors.region = "Region is required";
      hasError = true;
    }

    // ── 3. DISTRIBUTOR ────────────────────────────────────────────────────
    if (!clinics[0]?.stkId || clinics[0].stkId === "0") {
      newErrors.stkId = "Distributor is required";
      hasError = true;
    }

   // ── 4. MOBILE ─────────────────────────────────────────────────────────
    if (form.sendSms === "1" && (!form.mobile || !form.mobile.trim())) {
      newErrors.mobile = "Mobile No is required";
      hasError = true;
    } else if (form.mobile && form.mobile.trim() && !validateMobile(form.mobile)) {
      newErrors.mobile = "Please enter valid Mobile No";
      hasError = true;
    } else {
      newErrors.mobile = "";
    }

    // ── 5. EMAIL ──────────────────────────────────────────────────────────
    if (form.sendEmail === "1" && (!form.email || !form.email.trim())) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (form.email && form.email.trim() && !validateEmail(form.email)) {
      newErrors.email = "Please enter valid Email address";
      hasError = true;
    } else {
      newErrors.email = "";
    }

    // ── 5b. LOCATION ─────────────────────────────────────────────────────
    const lat = Number(form.customerLatitude);
    const lng = Number(form.customerLongitude);
    if (!form.customerLatitude || !form.customerLongitude || !lat || !lng) {
      // toastMessages.push("Please Add Location By Clicking Location Icon!!");
      newErrors.location="Please Add Location By Clicking Location Icon!!"
      hasError = true;
    }

    // ── 6. DUPLICATE REP VALIDATION ───────────────────────────────────────
    if (form.cusType === "1") {
      const repIds = clinics.map(c => c.repIncharge).filter(id => id && id !== "0");
      if (repIds.length !== new Set(repIds).size) {
        toastMessages.push("Rep Incharge in multiple Contact Info can't be same.. Please compare Contact Info details!");
        hasError = true;
      }
    }

    if (form.cusType === "2") {
      const posIds = clinics.map(c => c.repInchargePOS).filter(id => id && id !== "0");
      if (posIds.length !== new Set(posIds).size) {
        toastMessages.push("Account Owner (KAM) in multiple Contact Info can't be same.. Please compare Contact Info details!");
        hasError = true;
      }
    }

    // ── 7. FILTER CLINICS ─────────────────────────────────────────────────
    const filteredClinics = clinics.filter(c =>
      form.cusType === "1"
        ? c.repIncharge && c.repIncharge !== "0"
        : c.repInchargePOS && c.repInchargePOS !== "0"
    );

    // ── 8. CLINIC COUNT VALIDATION ────────────────────────────────────────
    // if (filteredClinics.length === 0) {
    //   toastMessages.push(
    //     form.cusType === "2"
    //       ? "Please select Branch Details"
    //       : "Please select atleast one clinical details"
    //   );
    //   hasError = true;
    // }

    const noAccountOwner = clinics.some(c =>
  form.cusType === "2"
    ? (!c.repInchargePOS || c.repInchargePOS === "0")
    : (!c.repIncharge || c.repIncharge === "0")
);
if (noAccountOwner) {
  newErrors.repIncharge = form.cusType === "2"
    ? "Account Owner is Required"
    : "Rep Incharge is Required";
  hasError = true;
}

    // ── 9. BEAT VALIDATION ────────────────────────────────────────────────
    const noBeat = filteredClinics.some(c => !c.beat || c.beat === "0");
    if (noBeat) {
      newErrors.beat="Beat is Required";
      hasError = true;
    }
    const noBranch= filteredClinics.some(c=> !c.clinicName || c.clinicName.trim()==="");
    if(noBranch){
      newErrors.clinicName="Branch Name is Required";
      hasError = true;
    }

    // ── 10. CLINIC CONTACT NO VALIDATION ──────────────────────────────────
    // Indexed by clinic position so each accordion only shows its own error.
    const contactNumErrors = {};
    let hasContactNumError = false;
    clinics.forEach((c, i) => {
      const no = c.contactNo;
      if (no && no.length !== 10) {
        contactNumErrors[i] = "Please enter valid 10-digit Contact No";
        hasContactNumError = true;
      }
    });
    if (hasContactNumError) {
      hasError = true;
    }
    newErrors.contactNum = contactNumErrors;

    // ── SET ALL ERRORS + SHOW ALL MESSAGES, THEN RETURN ONCE ─────────────
    setFieldErrors((prev) => ({ ...prev, ...newErrors }));

    if (newErrors.mobile) setForm((f) => ({ ...f, sendSms: "0" }));
    if (newErrors.email) setForm((f) => ({ ...f, sendEmail: "0" }));

    if (hasError) {
      toastMessages.forEach((msg) => toast.error(msg));
      toast.error("Please fix all mandatory fields");
      return null;
    }

    // ── 11. BRANDS ─────────────────────────────────────────────────────────
    const brandSubCatID = brandData.map(b => b.subCatId);
    const brandFocus = brandData.map(b => Number(b.focus) || 0);
    const brandRemainder = brandData.map(b => Number(b.reminder) || 0);

    // ── 12. COMPETITOR PRODUCT ARRAYS ─────────────────────────────────────
    const competitor_subcat_id = competitorRows.map(r => r.subcat_id || 0);
    const competitor_prod_id = competitorRows.map(r => r.pid || 0);
    const competitor_prod_qty = competitorRows.map(r => r.prod_qty || 0);
    const competitor_comp_id1 = competitorRows.map(r => r.comp_id_1 || 0);
    const competitor_comp_qty1 = competitorRows.map(r => r.comp_id_1_qty || 0);
    const competitor_comp_id2 = competitorRows.map(r => r.comp_id_2 || 0);
    const competitor_comp_qty2 = competitorRows.map(r => r.comp_id_2_qty || 0);
    const competitor_comp_id3 = competitorRows.map(r => r.comp_id_3 || 0);
    const competitor_comp_qty3 = competitorRows.map(r => r.comp_id_3_qty || 0);
    const competitor_oth = competitorRows.map(r => r.other_name || "");
    const competitor_othqty = competitorRows.map(r => r.oth_qty || 0);

    // ── 13. CLINICS PAYLOAD ────────────────────────────────────────────────
    const customerClinic = filteredClinics.map(c => ({
      customeClinicId: c.clinicId || 0,
      customeClinicName: c.clinicName || "",
      customeClinicAddress: c.address || "",
      customeClinicCity: c.city || "",
      customeClinicZipCode: c.zipCode || 0,
      customeClinicContactName: c.contactName || "",
      customeClinicContactNo: c.contactNo || "",
      customeClinicHospitalAttched: c.hospitalAttached || "0",
      customeClinicPharmacyAttached: c.pharmacyAttached || "0",
      customerClinicMeetingDays: c.meetingDays || [],
      customeClinicTime: c.meetingTime || "",
      customerClinicRepIncharge: form.cusType === "1"
        ? (c.repIncharge || "0")
        : (c.repInchargePOS || "0"),
      customerClinicBeat: c.beat || "0",
      customeStkId: c.stkId || "0",
      phChain: c.phChain || "0",
    }));

    // ── 14. FULL NAME ───────────────────────────────────────────────────────
    const full_name = form.lastName && form.lastName.trim()
      ? `${(form.firstName || "").trim()} ${form.lastName.trim()}`
      : (form.firstName || "").trim();

    // ── 15. SHARED DOCTOR DETAILS ──────────────────────────────────────────
    const doctorDetails = {
      cusType: form.cusType || "2",
      customerRetType: form.retailerType || "1",
      customerPractiseType: form.practiseType || "0",
      pharmaType: form.pharmaType || "0",
      reg_id: form.region || "0",

      customeFirstName: form.firstName || "",
      customeLastName: form.lastName || "",
      full_name,
      customeTitleQualification: form.titleQualification || "",
      customerGender: form.gender || "1",
      customerAgeGroup: form.agegroup || "1",

      customerMobile: form.mobile || "",
      customerSendSms: form.sendSms || "0",
      customerEmail: form.email || "",
      customerSendEmail: form.sendEmail || "0",

      customerPotentiality: form.potentiality || "0",
      customerFrequency: form.frequency || "0",
      customeLoyalty: form.loyalty || "0",
      customeLoyaltyType: form.loyaltyType || "0",
      customerKOL: form.keyOpinionLeader || "1",
      adoption: form.adoption || "0",

      customeCompetitorPref: form.competitorPref || "",
      customeMarketingTools: Array.isArray(form.marketingTools) ? form.marketingTools : [],
      hobbies: form.hobbies || "",
      customeRemarks: form.remarks || "",

      customerDOB: form.dob || "",
      dob_stat: form.dobNA ? 1 : 0,
      customerAniversaryDate: form.anniversary || "",
      wedding_stat: form.anniversaryNA ? 1 : 0,
      phChain: clinics[0]?.phChain || "0",

      customerLatitude: form.customerLatitude || 0,
      customerLongitude: form.customerLongitude || 0,

      brandSubCatID,
      brandFocus,
      brandRemainder,
      competitorBrands,

      competitor_subcat_id,
      competitor_prod_id,
      competitor_prod_qty,
      competitor_comp_id1,
      competitor_comp_qty1,
      competitor_comp_id2,
      competitor_comp_qty2,
      competitor_comp_id3,
      competitor_comp_qty3,
      competitor_oth,
      competitor_othqty,

      customerClinic,
    };

    return doctorDetails;
};

  // ── ADD ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    try {
      const doctorDetails = validateAndBuild();
      if (!doctorDetails) return;

      doctorDetails.type_flag = 1; // Add request

      console.log("doctorDetails (add):", doctorDetails);

      const res = await api.post("/doctorSubmit", { doctorDetails });

      if (res.data.status === 200) {
        toast.success("Request to Add new, Generated successfully!!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (res.data.status === 300) {
        toast.error(res.data.message || "Submission failed.");
      } else {
        toast.error(res.data.message || "Something went wrong.");
      }

    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred during submission.");
    }
  }, [form, clinics, brandData, competitorBrands, competitorRows]);

  // ── UPDATE ───────────────────────────────────────────────────────────────
  const handleUpdate = useCallback(async (cusId, tempId = 0) => {
    try {
      const doctorDetails = validateAndBuild();
      if (!doctorDetails) return;

      doctorDetails.type_flag = 2;        // Update request
      doctorDetails.cus_id = cusId || 0;
      doctorDetails.temp_id = tempId || 0;

      console.log("doctorDetails (update):", doctorDetails);

      const res = await api.post("/doctorUpdate", { doctorDetails });

      if (res.data.status === 200) {
        toast.success("Update Request Generated successfully!!");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (res.data.status === 300) {
        toast.error(res.data.message || "Update failed.");
      } else {
        toast.error(res.data.message || "Something went wrong.");
      }

    } catch (err) {
      console.error("Update error:", err);
      toast.error(err?.response?.data?.message || err.message || "An error occurred during update.");
    }
  }, [form, clinics, brandData, competitorBrands, competitorRows]);

  return { handleSubmit, handleUpdate };
}