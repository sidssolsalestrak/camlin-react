import { useCallback } from "react";
import api from "../../services/api";
import useToast from "../../utils/useToast";

export function useSubmitCustomer({ form, clinics, brandData = [], competitorBrands = [], competitorRows = [] }) {
  const toast = useToast();

  // ── Shared validation & payload builder ──────────────────────────────────
  const validateAndBuild = () => {

    // ── 1. LOCATION VALIDATION ───────────────────────────────────────────────
    if (!form.customerLatitude || form.customerLatitude == 0) {
      toast.error("Please Add Location By Clicking Location Icon!");
      return null;
    }

    // ── 2. DUPLICATE REP VALIDATION ──────────────────────────────────────────
    if (form.cusType === "1") {
      const repIds = clinics.map(c => c.repIncharge).filter(id => id && id !== "0");
      if (repIds.length !== new Set(repIds).size) {
        toast.error("Rep Incharge in multiple Contact Info can't be same.. Please compare Contact Info details!");
        return null;
      }
    }

    if (form.cusType === "2") {
      const posIds = clinics.map(c => c.repInchargePOS).filter(id => id && id !== "0");
      if (posIds.length !== new Set(posIds).size) {
        toast.error("Account Owner (KAM) in multiple Contact Info can't be same.. Please compare Contact Info details!");
        return null;
      }
    }

    // ── 3. FILTER CLINICS ────────────────────────────────────────────────────
    const filteredClinics = clinics.filter(c =>
      form.cusType === "1"
        ? c.repIncharge && c.repIncharge !== "0"
        : c.repInchargePOS && c.repInchargePOS !== "0"
    );

    // ── 4. CLINIC COUNT VALIDATION ───────────────────────────────────────────
    if (filteredClinics.length === 0) {
      toast.error(
        form.cusType === "2"
          ? "Please select Branch Details"
          : "Please select atleast one clinical details"
      );
      return null;
    }

    // ── 5. BEAT VALIDATION ───────────────────────────────────────────────────
    const noBeat = filteredClinics.some(c => !c.beat || c.beat === "0");
    if (noBeat) {
      toast.error("Please add Beat to the Clinical");
      return null;
    }

    // ── 6. DISTRIBUTOR VALIDATION ────────────────────────────────────────────
    if (!clinics[0]?.stkId || clinics[0].stkId === "0") {
      toast.error("Please Select Distributor");
      return null;
    }

    // ── 7. BRANDS ────────────────────────────────────────────────────────────
    const brandSubCatID = brandData.map(b => b.subCatId);
    const brandFocus = brandData.map(b => Number(b.focus) || 0);
    const brandRemainder = brandData.map(b => Number(b.reminder) || 0);

    // ── 8. COMPETITOR PRODUCT ARRAYS (matches doctorUpdate backend fields) ───
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

    // ── 9. CLINICS PAYLOAD ───────────────────────────────────────────────────
    const customerClinic = filteredClinics.map(c => ({
      customeClinicId: c.clinicId || 0,   // ← ADD THIS
      customeClinicName: c.clinicName || "",
      customeClinicAddress: c.address || "",
      customeClinicCity: c.city || "",
      customeClinicZipCode: c.zipCode || "",
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

    // ── 10. SHARED DOCTOR DETAILS ────────────────────────────────────────────
    const doctorDetails = {
      cusType: form.cusType || "2",
      customerRetType: form.retailerType || "1",
      customerPractiseType: form.practiseType || "0",
      pharmaType: form.pharmaType || "0",
      reg_id: form.region || "0",

      customeFirstName: form.firstName || "",
      customeLastName: form.lastName || "",
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

      // Competitor product arrays
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
      } else if (res.data.status === 300) {
        toast.error(res.data.message || "Submission failed.");
      } else {
        toast.error(res.data.message || "Something went wrong.");
      }

    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err?.response?.data?.message || err.message || "An error occurred during submission.");
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