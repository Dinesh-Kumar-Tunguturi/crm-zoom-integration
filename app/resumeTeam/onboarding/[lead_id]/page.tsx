// // // app/resumeTeam/onboarding/[lead_id]/page.tsx
// // "use client";

// // import { useState } from "react";
// // import { Button } from "@/components/ui/button";
// // import OnboardingDialog from "./OnboardingDialog";

// // export default function OnboardingPage() {
// //   const [showDialog, setShowDialog] = useState(false);

// //   return (
// //     <div className="container mx-auto p-6">
// //       <h1 className="text-2xl font-bold mb-6">Onboarding Management</h1>
      
// //       <Button
// //         onClick={() => setShowDialog(true)}
// //         className="bg-purple-600 hover:bg-purple-700"
// //       >
// //         Open Onboarding Dialog
// //       </Button>

// //       <OnboardingDialog
// //         open={showDialog}
// //         onOpenChange={setShowDialog}
// //         onSuccess={() => {
// //           // Refresh data or show success message
// //           console.log("Onboarding completed successfully!");
// //         }}
// //       />
// //     </div>
// //   );
// // }


// // app/resumeTeam/onboarding/[lead_id]/OnboardingForm.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { DashboardLayout } from "@/components/layout/dashboard-layout";
// import { supabase } from "@/utils/supabase/client";
// import { ArrowLeft, Save } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// // Helper functions
// const csvFromArray = (arr: string[] | null | undefined): string => {
//   if (!arr || !Array.isArray(arr)) return "";
//   return arr.filter(Boolean).join(", ");
// };

// const csvToArray = (csv: string): string[] => {
//   if (!csv) return [];
//   return csv
//     .split(",")
//     .map((item) => item.trim())
//     .filter(Boolean);
// };

// interface OnboardingData {
//   id?: string;
//   full_name?: string;
//   personal_email?: string;
//   company_email?: string;
//   callable_phone?: string;
//   job_role_preferences?: string[];
//   location_preferences?: string[];
//   salary_range?: string;
//   work_auth_details?: string;
//   needs_sponsorship?: boolean | null;
//   full_address?: string;
//   linkedin_url?: string;
//   date_of_birth?: string;
//   whatsapp_number?: string;
//   github_url?: string;
//   visa_type?: string;
//   created_at?: string;
//   lead_id?: string;
// }

// interface SalesClosureData {
//   id?: string;
//   lead_id?: string;
//   onboarded_date?: string;
//   company_application_email?: string;
//   email?: string;
// }

// export default function OnboardingForm() {
//   const params = useParams();
//   const router = useRouter();
//   const lead_id = params.lead_id as string;

//   // Form state
//   const [loading, setLoading] = useState(false);
//   const [formLoading, setFormLoading] = useState(true);
//   const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
//   const [salesData, setSalesData] = useState<SalesClosureData | null>(null);
  
//   // Form fields
//   const [obFullName, setObFullName] = useState("");
//   const [obCompanyEmail, setObCompanyEmail] = useState("");
//   const [obPersonalEmail, setObPersonalEmail] = useState("");
//   const [obCallablePhone, setObCallablePhone] = useState("");
//   const [obJobRolesText, setObJobRolesText] = useState("");
//   const [obLocationsText, setObLocationsText] = useState("");
//   const [obSalaryRange, setObSalaryRange] = useState("");
//   const [obWorkAuth, setObWorkAuth] = useState("");
//   const [obNeedsSponsorship, setObNeedsSponsorship] = useState<boolean | null>(null);
//   const [obFullAddress, setObFullAddress] = useState("");
//   const [obLinkedInUrl, setObLinkedInUrl] = useState("");
//   const [obDob, setObDob] = useState("");
//   const [obDate, setObDate] = useState("");
  
//   // Additional fields from your list
//   const [obWhatsappNumber, setObWhatsappNumber] = useState("");
//   const [obGithubUrl, setObGithubUrl] = useState("");
//   const [obVisaType, setObVisaType] = useState("");
//   const [obExperience, setObExperience] = useState("0");
//   const [obExcludeCompanies, setObExcludeCompanies] = useState("NA");
//   const [obNoOfApplications, setObNoOfApplications] = useState("20");

//   // Fetch data on component mount
//   useEffect(() => {
//     if (lead_id) {
//       loadData();
//     }
//   }, [lead_id]);

//   // const loadData = async () => {
//   //   setFormLoading(true);
//   //   try {
//   //     // Fetch from client_onborading_details
//   //     const { data: onboarding, error: onboardingError } = await supabase
//   //       .from("client_onborading_details")
//   //       .select("*")
//   //       .eq("lead_id", lead_id)
//   //       .order("created_at", { ascending: false })
//   //       .limit(1)
//   //       .maybeSingle();

//   //     if (onboardingError) {
//   //       console.error("Error fetching onboarding data:", onboardingError);
//   //     }

//   //     // Fetch from sales_closure
//   //     const { data: sales, error: salesError } = await supabase
//   //       .from("sales_closure")
//   //       .select("id, lead_id, onboarded_date, company_application_email, email")
//   //       .eq("lead_id", lead_id)
//   //       .order("closed_at", { ascending: false })
//   //       .limit(1)
//   //       .maybeSingle();

//   //     if (salesError) {
//   //       console.error("Error fetching sales data:", salesError);
//   //     }

//   //     setOnboardingData(onboarding || null);
//   //     setSalesData(sales || null);

//   //     // Pre-fill form
//   //     if (onboarding) {
//   //       setObFullName(onboarding.full_name || "");
//   //       setObCompanyEmail(onboarding.company_email || "");
//   //       setObPersonalEmail(onboarding.personal_email || "");
//   //       setObCallablePhone(onboarding.callable_phone || "");
//   //       setObJobRolesText(csvFromArray(onboarding.job_role_preferences));
//   //       setObLocationsText(csvFromArray(onboarding.location_preferences));
//   //       setObSalaryRange(onboarding.salary_range || "");
//   //       setObWorkAuth(onboarding.work_auth_details || "");
//   //       setObNeedsSponsorship(onboarding.needs_sponsorship || null);
//   //       setObFullAddress(onboarding.full_address || "");
//   //       setObLinkedInUrl(onboarding.linkedin_url || "");
//   //       setObDob(onboarding.date_of_birth || "");
//   //       setObWhatsappNumber(onboarding.whatsapp_number || "");
//   //       setObGithubUrl(onboarding.github_url || "");
//   //       setObVisaType(onboarding.visatypes || "");
//   //     }

//   //     // Pre-fill sales data
//   //     if (sales) {
//   //       setObDate(sales.onboarded_date || "");
//   //       // If company email is not in onboarding but is in sales, use it
//   //       if (!onboarding?.company_email && sales.company_application_email) {
//   //         setObCompanyEmail(sales.company_application_email);
//   //       }
//   //       if (!onboarding?.personal_email && sales.email) {
//   //         setObPersonalEmail(sales.email);
//   //       }
//   //     }

//   //   } catch (error) {
//   //     console.error("Error loading data:", error);
//   //     alert("Failed to load data. Please try again.");
//   //   } finally {
//   //     setFormLoading(false);
//   //   }
//   // };

//   // const handleSave = async () => {
//   //   if (!lead_id) {
//   //     alert("No lead ID found");
//   //     return;
//   //   }

//   //   if (!obDate) {
//   //     alert("Please choose an Onboarded Date");
//   //     return;
//   //   }

//   //   setLoading(true);

//   //   try {
//   //     // 1. Update or create client_onborading_details
//   //     const onboardingPayload = {
//   //       full_name: obFullName || null,
//   //       company_email: obCompanyEmail?.trim() || null,
//   //       personal_email: obPersonalEmail || null,
//   //       callable_phone: obCallablePhone || null,
//   //       job_role_preferences: csvToArray(obJobRolesText),
//   //       location_preferences: csvToArray(obLocationsText),
//   //       salary_range: obSalaryRange || null,
//   //       work_auth_details: obWorkAuth || null,
//   //       needs_sponsorship: obNeedsSponsorship,
//   //       full_address: obFullAddress || null,
//   //       linkedin_url: obLinkedInUrl || null,
//   //       date_of_birth: obDob || null,
//   //       whatsapp_number: obWhatsappNumber || null,
//   //       github_url: obGithubUrl || null,
//   //       visatypes: obVisaType || null,
//   //       lead_id: lead_id,
//   //     };

//   //     if (onboardingData?.id) {
//   //       // Update existing
//   //       const { error } = await supabase
//   //         .from("client_onborading_details")
//   //         .update(onboardingPayload)
//   //         .eq("id", onboardingData.id);
        
//   //       if (error) throw error;
//   //     } else {
//   //       // Create new
//   //       const { error } = await supabase
//   //         .from("client_onborading_details")
//   //         .insert(onboardingPayload);
        
//   //       if (error) throw error;
//   //     }

//   //     // 2. Update sales_closure with onboarded date and company email
//   //     if (salesData?.id) {
//   //       const { error: salesError } = await supabase
//   //         .from("sales_closure")
//   //         .update({
//   //           onboarded_date: obDate,
//   //           company_application_email: obCompanyEmail?.trim() || null,
//   //         })
//   //         .eq("id", salesData.id);
        
//   //       if (salesError) throw salesError;
//   //     }

//   //     // 3. Send to pending_clients API
//   //     const pendingClientPayload = {
//   //       full_name: obFullName || "",
//   //       company_email: obCompanyEmail?.trim() || "",
//   //       personal_email: obPersonalEmail || "",
//   //       whatsapp_number: obWhatsappNumber || null,
//   //       callable_phone: obCallablePhone || null,
//   //       job_role_preferences: csvToArray(obJobRolesText),
//   //       location_preferences: csvToArray(obLocationsText),
//   //       salary_range: obSalaryRange || null,
//   //       work_auth_details: obWorkAuth || null,
//   //       visa_type: obVisaType || null,
//   //       sponsorship: obNeedsSponsorship,
//   //       applywizz_id: lead_id,
//   //       resume_url: null,
//   //       resume_path: null,
//   //       start_date: null,
//   //       end_date: null,
//   //       no_of_applications: obNoOfApplications || "20",
//   //       badge_value: null,
//   //       add_ons_info: [],
//   //       github_url: obGithubUrl || null,
//   //       linked_in_url: obLinkedInUrl || null,
//   //       is_over_18: null,
//   //       eligible_to_work_in_us: null,
//   //       authorized_without_visa: null,
//   //       require_future_sponsorship: null,
//   //       can_perform_essential_functions: null,
//   //       worked_for_company_before: null,
//   //       discharged_for_policy_violation: null,
//   //       referred_by_agency: null,
//   //       highest_education: null,
//   //       university_name: null,
//   //       cumulative_gpa: null,
//   //       desired_start_date: null,
//   //       willing_to_relocate: null,
//   //       can_work_3_days_in_office: null,
//   //       role: null,
//   //       experience: obExperience || "0",
//   //       work_preferences: null,
//   //       alternate_job_roles: null,
//   //       exclude_companies: obExcludeCompanies || "NA",
//   //       convicted_of_felony: null,
//   //       felony_explanation: null,
//   //       pending_investigation: null,
//   //       willing_background_check: null,
//   //       willing_drug_screen: null,
//   //       failed_or_refused_drug_test: null,
//   //       uses_substances_affecting_duties: null,
//   //       substances_description: null,
//   //       can_provide_legal_docs: null,
//   //       gender: null,
//   //       is_hispanic_latino: null,
//   //       race_ethnicity: null,
//   //       veteran_status: null,
//   //       disability_status: null,
//   //       has_relatives_in_company: null,
//   //       relatives_details: null,
//   //       state_of_residence: null,
//   //       zip_or_country: null,
//   //       main_subject: null,
//   //       graduation_year: null,
//   //       client_form_fill_date: new Date().toISOString(),
//   //       cover_letter_path: null,
//   //       full_address: obFullAddress || null,
//   //       date_of_birth: obDob || null,
//   //       primary_phone: obCallablePhone || null,
//   //       created_at: new Date().toISOString(),
//   //     };

//   //     const response = await fetch("/api/pending-clients/upsert", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify(pendingClientPayload),
//   //     });

//   //     if (!response.ok) {
//   //       const errorData = await response.json();
//   //       throw new Error(errorData.message || "Failed to save to pending clients");
//   //     }

//   //     // Success
//   //     alert("Data saved successfully!");
//   //     router.back(); // Go back to previous page

//   //   } catch (error: any) {
//   //     console.error("Error saving data:", error);
//   //     alert(error.message || "Failed to save data");
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

// // Update the loadData function to pre-fill ALL form state
// const loadData = async () => {
//   setFormLoading(true);
//   try {
//     // Fetch from client_onborading_details with ALL fields
//     const { data: onboarding, error: onboardingError } = await supabase
//       .from("client_onborading_details")
//       .select("*")
//       .eq("lead_id", lead_id)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (onboardingError) {
//       console.error("Error fetching onboarding data:", onboardingError);
//     }

//     // Fetch from sales_closure
//     const { data: sales, error: salesError } = await supabase
//       .from("sales_closure")
//       .select(`
//         id,
//         lead_id,
//         onboarded_date,
//         company_application_email,
//         email,
//         badge_value,
//         subscription_cycle
//       `)
//       .eq("lead_id", lead_id)
//       .order("closed_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (salesError) {
//       console.error("Error fetching sales data:", salesError);
//     }

//     setOnboardingData(onboarding || null);
//     setSalesData(sales || null);

//     // Pre-fill form with ALL fields from client_onborading_details
//     if (onboarding) {
//       // Basic fields
//       setObFullName(onboarding.full_name || "");
//       setObCompanyEmail(onboarding.company_email || "");
//       setObPersonalEmail(onboarding.personal_email || "");
//       setObCallablePhone(onboarding.callable_phone || "");
//       setObJobRolesText(csvFromArray(onboarding.job_role_preferences));
//       setObLocationsText(csvFromArray(onboarding.location_preferences));
//       setObSalaryRange(onboarding.salary_range || "");
//       setObWorkAuth(onboarding.work_auth_details || "");
//       setObNeedsSponsorship(onboarding.needs_sponsorship || null);
//       setObFullAddress(onboarding.full_address || "");
//       setObLinkedInUrl(onboarding.linkedin_url || "");
//       setObDob(onboarding.date_of_birth || "");
//       setObWhatsappNumber(onboarding.whatsapp_number || "");
//       setObGithubUrl(onboarding.github_url || "");
//       setObVisaType(onboarding.visatypes || "");
      
//       // Additional fields - you need to add these state variables
//       setObExperience(onboarding.experience || "0");
//       setObExcludeCompanies(onboarding.exclude_companies || "NA");
      
//       // You should add state for all these fields and set them here:
//       // setIsOver18(onboarding.is_over_18 || null);
//       // setEligibleToWorkInUS(onboarding.eligible_to_work_in_us || null);
//       // setAuthorizedWithoutVisa(onboarding.authorized_without_visa || null);
//       // ... etc for all other fields
//     }

//     // Pre-fill sales data
//     if (sales) {
//       setObDate(sales.onboarded_date || "");
//       // If company email is not in onboarding but is in sales, use it
//       if (!onboarding?.company_email && sales.company_application_email) {
//         setObCompanyEmail(sales.company_application_email);
//       }
//       if (!onboarding?.personal_email && sales.email) {
//         setObPersonalEmail(sales.email);
//       }
//     }

//   } catch (error) {
//     console.error("Error loading data:", error);
//     alert("Failed to load data. Please try again.");
//   } finally {
//     setFormLoading(false);
//   }
// };

//   // Update the handleSave function to fetch ALL fields from client_onborading_details
// const handleSave = async () => {
//   if (!lead_id) {
//     alert("No lead ID found");
//     return;
//   }

//   if (!obDate) {
//     alert("Please choose an Onboarded Date");
//     return;
//   }

//   setLoading(true);

//   try {
//     // 1. Fetch ALL data from client_onborading_details
//     const { data: fullOnboardingData, error: onboardingError } = await supabase
//       .from("client_onborading_details")
//       .select("*")
//       .eq("lead_id", lead_id)
//       .order("created_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (onboardingError) {
//       console.error("Error fetching full onboarding data:", onboardingError);
//     }

//     // 2. Fetch sales_closure data for badge_value, subscription_cycle, and add-ons
//     const { data: scData, error: scError } = await supabase
//       .from("sales_closure")
//       .select(`
//         badge_value,
//         subscription_cycle,
//         application_sale_value,
//         resume_sale_value,
//         portfolio_sale_value,
//         linkedin_sale_value,
//         github_sale_value,
//         courses_sale_value,
//         custom_sale_value,
//         job_board_value,
//         no_of_job_applications,
//         onboarded_date
//       `)
//       .eq("lead_id", lead_id)
//       .order("closed_at", { ascending: false })
//       .limit(1)
//       .maybeSingle();

//     if (scError) {
//       console.error("Error fetching sales closure data:", scError);
//     }

//     // 3. Fetch resume_progress for resume_path
//     const { data: rpData, error: rpError } = await supabase
//       .from("resume_progress")
//       .select("pdf_path")
//       .eq("lead_id", lead_id)
//       .maybeSingle();

//     if (rpError) {
//       console.error("Error fetching resume progress:", rpError);
//     }
//     const resumePath = rpData?.pdf_path || null;

//     // 4. Calculate start_date and end_date
//     const startDate = obDate; // Use the onboarded date from form
//     let endDate = null;
    
//     if (startDate && scData?.subscription_cycle) {
//       try {
//         const endDateObj = new Date(
//           new Date(startDate).getTime() +
//             scData.subscription_cycle * 24 * 60 * 60 * 1000
//         );
//         endDate = endDateObj.toISOString().split("T")[0];
//       } catch (error) {
//         console.error("Error calculating end date:", error);
//       }
//     }

//     // 5. Prepare add_ons_info based on sales_closure values
//     const allowedServices = [
//       { field: "application_sale_value", label: "applications" },
//       { field: "resume_sale_value", label: "resume" },
//       { field: "portfolio_sale_value", label: "portfolio" },
//       { field: "linkedin_sale_value", label: "linkedin" },
//       { field: "github_sale_value", label: "github" },
//       { field: "courses_sale_value", label: "courses" },
//       { field: "experience", label: "experience" },
//       { field: "badge_value", label: "badge" },
//       { field: "job_board_value", label: "job-links" },
//     ];

//     const scAny: any = scData;
//     const addOnsInfo = allowedServices
//       .filter((item) => {
//         const val = scAny?.[item.field];
//         return val !== null && val !== undefined && Number(val) > 0;
//       })
//       .map((item) => item.label);

//     // 6. Update or create client_onborading_details with current form values
//     const onboardingPayload = {
//       full_name: obFullName || null,
//       company_email: obCompanyEmail?.trim() || null,
//       personal_email: obPersonalEmail || null,
//       callable_phone: obCallablePhone || null,
//       job_role_preferences: csvToArray(obJobRolesText),
//       location_preferences: csvToArray(obLocationsText),
//       salary_range: obSalaryRange || null,
//       work_auth_details: obWorkAuth || null,
//       needs_sponsorship: obNeedsSponsorship,
//       full_address: obFullAddress || null,
//       linkedin_url: obLinkedInUrl || null,
//       date_of_birth: obDob || null,
//       whatsapp_number: obWhatsappNumber || null,
//       github_url: obGithubUrl || null,
//       visatypes: obVisaType || null,
//       lead_id: lead_id,
//       // Preserve all existing fields
//       ...(fullOnboardingData && {
//         is_over_18: fullOnboardingData.is_over_18,
//         eligible_to_work_in_us: fullOnboardingData.eligible_to_work_in_us,
//         authorized_without_visa: fullOnboardingData.authorized_without_visa,
//         require_future_sponsorship: fullOnboardingData.require_future_sponsorship,
//         can_perform_essential_functions: fullOnboardingData.can_perform_essential_functions,
//         worked_for_company_before: fullOnboardingData.worked_for_company_before,
//         discharged_for_policy_violation: fullOnboardingData.discharged_for_policy_violation,
//         referred_by_agency: fullOnboardingData.referred_by_agency,
//         highest_education: fullOnboardingData.highest_education,
//         university_name: fullOnboardingData.university_name,
//         cumulative_gpa: fullOnboardingData.cumulative_gpa,
//         desired_start_date: fullOnboardingData.desired_start_date,
//         willing_to_relocate: fullOnboardingData.willing_to_relocate,
//         can_work_3_days_in_office: fullOnboardingData.can_work_3_days_in_office,
//         role: fullOnboardingData.role,
//         experience: fullOnboardingData.experience || "0",
//         work_preferences: fullOnboardingData.work_preferences,
//         alternate_job_roles: fullOnboardingData.alternate_job_roles,
//         exclude_companies: fullOnboardingData.exclude_companies || "NA",
//         convicted_of_felony: fullOnboardingData.convicted_of_felony,
//         felony_explanation: fullOnboardingData.felony_explanation,
//         pending_investigation: fullOnboardingData.pending_investigation,
//         willing_background_check: fullOnboardingData.willing_background_check,
//         willing_drug_screen: fullOnboardingData.willing_drug_screen,
//         failed_or_refused_drug_test: fullOnboardingData.failed_or_refused_drug_test,
//         uses_substances_affecting_duties: fullOnboardingData.uses_substances_affecting_duties,
//         substances_description: fullOnboardingData.substances_description,
//         can_provide_legal_docs: fullOnboardingData.can_provide_legal_docs,
//         gender: fullOnboardingData.gender,
//         is_hispanic_latino: fullOnboardingData.is_hispanic_latino,
//         race_ethnicity: fullOnboardingData.race_ethnicity,
//         veteran_status: fullOnboardingData.veteran_status,
//         disability_status: fullOnboardingData.disability_status,
//         has_relatives_in_company: fullOnboardingData.has_relatives_in_company,
//         relatives_details: fullOnboardingData.relatives_details,
//         state_of_residence: fullOnboardingData.state_of_residence,
//         zip_or_country: fullOnboardingData.zip_or_country,
//         main_subject: fullOnboardingData.main_subject,
//         graduation_year: fullOnboardingData.graduation_year,
//         cover_letter_path: fullOnboardingData.cover_letter_path,
//       }),
//     };

//     if (onboardingData?.id) {
//       // Update existing
//       const { error } = await supabase
//         .from("client_onborading_details")
//         .update(onboardingPayload)
//         .eq("id", onboardingData.id);
      
//       if (error) throw error;
//     } else {
//       // Create new
//       const { error } = await supabase
//         .from("client_onborading_details")
//         .insert(onboardingPayload);
      
//       if (error) throw error;
//     }

//     // 7. Update sales_closure with onboarded date and company email
//     if (salesData?.id) {
//       const { error: salesError } = await supabase
//         .from("sales_closure")
//         .update({
//           onboarded_date: obDate,
//           company_application_email: obCompanyEmail?.trim() || null,
//         })
//         .eq("id", salesData.id);
      
//       if (salesError) throw salesError;
//     }

//     // 8. Send to pending_clients API with ALL data from client_onborading_details
//     const pendingClientPayload = {
//       // Basic info from form
//       full_name: obFullName || "",
//       company_email: obCompanyEmail?.trim() || "",
//       personal_email: obPersonalEmail || "",
//       whatsapp_number: obWhatsappNumber || null,
//       callable_phone: obCallablePhone || null,
//       job_role_preferences: csvToArray(obJobRolesText),
//       location_preferences: csvToArray(obLocationsText),
//       salary_range: obSalaryRange || null,
//       work_auth_details: obWorkAuth || null,
//       visa_type: obVisaType || null,
//       sponsorship: obNeedsSponsorship,
//       applywizz_id: lead_id,
      
//       // From sales_closure
//       badge_value: scData?.badge_value || null,
//       no_of_applications: scData?.no_of_job_applications?.toString()  || "20",
      
//       // From resume_progress
//       resume_url: resumePath || null,
//       resume_path: resumePath || null,
      
//       // Calculated dates
//       start_date: startDate || null,
//       end_date: endDate || null,
      
//       // Add-ons info
//       add_ons_info: addOnsInfo,
      
//       // URLs
//       github_url: obGithubUrl || null,
//       linked_in_url: obLinkedInUrl || null,
      
//       // ALL fields from client_onborading_details (if they exist)
//       is_over_18: fullOnboardingData?.is_over_18 || null,
//       eligible_to_work_in_us: fullOnboardingData?.eligible_to_work_in_us || null,
//       authorized_without_visa: fullOnboardingData?.authorized_without_visa || null,
//       require_future_sponsorship: fullOnboardingData?.require_future_sponsorship || null,
//       can_perform_essential_functions: fullOnboardingData?.can_perform_essential_functions || null,
//       worked_for_company_before: fullOnboardingData?.worked_for_company_before || null,
//       discharged_for_policy_violation: fullOnboardingData?.discharged_for_policy_violation || null,
//       referred_by_agency: fullOnboardingData?.referred_by_agency || null,
//       willing_to_relocate: fullOnboardingData?.willing_to_relocate || null,
//       can_work_3_days_in_office: fullOnboardingData?.can_work_3_days_in_office || null,
//       convicted_of_felony: fullOnboardingData?.convicted_of_felony || null,
//       pending_investigation: fullOnboardingData?.pending_investigation || null,
//       willing_background_check: fullOnboardingData?.willing_background_check || null,
//       willing_drug_screen: fullOnboardingData?.willing_drug_screen || null,
//       failed_or_refused_drug_test: fullOnboardingData?.failed_or_refused_drug_test || null,
//       uses_substances_affecting_duties: fullOnboardingData?.uses_substances_affecting_duties || null,
//       can_provide_legal_docs: fullOnboardingData?.can_provide_legal_docs || null,
//       has_relatives_in_company: fullOnboardingData?.has_relatives_in_company || null,
      
//       // Text fields from client_onborading_details
//       highest_education: fullOnboardingData?.highest_education || null,
//       university_name: fullOnboardingData?.university_name || null,
//       cumulative_gpa: fullOnboardingData?.cumulative_gpa || null,
//       desired_start_date: fullOnboardingData?.desired_start_date || null,
//       role: fullOnboardingData?.role || null,
//       experience: fullOnboardingData?.experience || "0",
//       work_preferences: fullOnboardingData?.work_preferences || null,
//       alternate_job_roles: fullOnboardingData?.alternate_job_roles || null,
//       exclude_companies: fullOnboardingData?.exclude_companies || "NA",
//       felony_explanation: fullOnboardingData?.felony_explanation || null,
//       substances_description: fullOnboardingData?.substances_description || null,
//       gender: fullOnboardingData?.gender || null,
//       is_hispanic_latino: fullOnboardingData?.is_hispanic_latino || null,
//       race_ethnicity: fullOnboardingData?.race_ethnicity || null,
//       veteran_status: fullOnboardingData?.veteran_status || null,
//       disability_status: fullOnboardingData?.disability_status || null,
//       relatives_details: fullOnboardingData?.relatives_details || null,
//       state_of_residence: fullOnboardingData?.state_of_residence || null,
//       zip_or_country: fullOnboardingData?.zip_or_country || null,
//       main_subject: fullOnboardingData?.main_subject || null,
//       graduation_year: fullOnboardingData?.graduation_year || null,
//       cover_letter_path: fullOnboardingData?.cover_letter_path || null,
      
//       // Other fields
//       client_form_fill_date: new Date().toISOString(),
//       full_address: obFullAddress || fullOnboardingData?.full_address || null,
//       date_of_birth: obDob || fullOnboardingData?.date_of_birth || null,
//       primary_phone: obCallablePhone || fullOnboardingData?.callable_phone || null,
//       created_at: new Date().toISOString(),
//     };

// //     console.log("Sending COMPLETE data to pending_clients:", pendingClientPayload);

// //     const response = await fetch("/api/pending-clients/upsert", {
// //       method: "POST",
// //       headers: {
// //         "Content-Type": "application/json",
// //       },
// //       body: JSON.stringify(pendingClientPayload),
// //     });

// //     if (!response.ok) {
// //       const errorData = await response.json();
// //       throw new Error(errorData.message || "Failed to save to pending clients");
// //     }

// //     // Success
// //     alert("Data saved successfully to all tables!");
// //     router.back(); // Go back to previous page

// //   } catch (error: any) {
// //     console.error("Error saving data:", error);
// //     alert(error.message || "Failed to save data");
// //   } finally {
// //     setLoading(false);
// //   }
// // };


//  console.log("📤 Sending payload to /api/pending-clients/upsert:", JSON.stringify(pendingClientPayload, null, 2));

//     const response = await fetch("/api/pending-clients/upsert", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(pendingClientPayload),
//     });

//     const responseData = await response.json();
//     console.log("📥 API Response:", responseData);

//     if (!response.ok) {
//       // Log detailed error information
//       console.error("❌ API Error Details:", {
//         status: response.status,
//         statusText: response.statusText,
//         errorData: responseData,
//         payload: pendingClientPayload,
//       });
      
//       // Extract detailed error message
//       let errorMessage = "Failed to save to pending clients";
//       if (responseData.error) {
//         errorMessage = responseData.error;
//       }
//       if (responseData.details) {
//         if (Array.isArray(responseData.details)) {
//           errorMessage = responseData.details.map((err: any) => 
//             `${err.field}: ${err.message}`
//           ).join(", ");
//         } else {
//           errorMessage += ` - ${JSON.stringify(responseData.details)}`;
//         }
//       }
//       if (responseData.validationErrors) {
//         errorMessage = "Validation Errors: " + responseData.validationErrors.map((err: any) => 
//           `${err.field}: ${err.message}`
//         ).join(", ");
//       }
      
//       throw new Error(errorMessage);
//     }

//     // Success
//     alert("Data saved successfully to all tables!");
//     console.log("✅ Successfully saved data");
//     router.back(); // Go back to previous page

//   } catch (error: any) {
//     console.error("🔥 Error saving data:", {
//       message: error.message,
//       stack: error.stack,
//       error: error,
//     });
//     alert(`Error: ${error.message}`);
//   } finally {
//     setLoading(false);
//   }
// };

//   const formatDateForInput = (dateString: string) => {
//     if (!dateString) return "";
//     try {
//       const date = new Date(dateString);
//       if (isNaN(date.getTime())) return "";
//       return date.toISOString().split("T")[0];
//     } catch {
//       return "";
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="container mx-auto py-6 space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={() => router.back()}
//               className="h-8 w-8"
//             >
//               <ArrowLeft className="h-4 w-4" />
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight">
//                 Onboard & Edit — {lead_id}
//               </h1>
//               <p className="text-muted-foreground">
//                 Update the latest onboarding details and set the Onboarded Date.
//               </p>
//             </div>
//           </div>
          
//           <Button
//             onClick={handleSave}
//             disabled={loading || formLoading || !obDate}
//             className="gap-2"
//           >
//             <Save className="h-4 w-4" />
//             {loading ? "Saving..." : "Save & Onboard"}
//           </Button>
//         </div>

//         {/* Form Content */}
//         {formLoading ? (
//           <Card>
//             <CardContent className="flex items-center justify-center p-12">
//               <div className="text-center">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//                 <p className="text-muted-foreground">Loading onboarding data...</p>
//               </div>
//             </CardContent>
//           </Card>
//         ) : (
//           <div className="space-y-6">
//             {/* Main Form Card */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Client Information</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Row 1 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="fullName">Full Name *</Label>
//                     <Input
//                       id="fullName"
//                       value={obFullName}
//                       onChange={(e) => setObFullName(e.target.value)}
//                       placeholder="Enter full name"
//                       required
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="companyEmail">Company Email *</Label>
//                     <Input
//                       id="companyEmail"
//                       type="email"
//                       value={obCompanyEmail}
//                       onChange={(e) => setObCompanyEmail(e.target.value)}
//                       placeholder="company@example.com"
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Row 2 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="callablePhone">Callable Phone</Label>
//                     <Input
//                       id="callablePhone"
//                       value={obCallablePhone}
//                       onChange={(e) => setObCallablePhone(e.target.value)}
//                       placeholder="+1234567890"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="onboardedDate">Onboarded Date *</Label>
//                     <Input
//                       id="onboardedDate"
//                       type="date"
//                       value={formatDateForInput(obDate)}
//                       onChange={(e) => setObDate(e.target.value)}
//                       required
//                     />
//                   </div>
//                 </div>

//                 {/* Row 3 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="jobRoles">Job Role Preferences (comma separated)</Label>
//                     <Textarea
//                       id="jobRoles"
//                       rows={3}
//                       value={obJobRolesText}
//                       onChange={(e) => setObJobRolesText(e.target.value)}
//                       placeholder="Java Full Stack, Frontend Developer, Backend Engineer"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="locations">Location Preferences (comma separated)</Label>
//                     <Textarea
//                       id="locations"
//                       rows={3}
//                       value={obLocationsText}
//                       onChange={(e) => setObLocationsText(e.target.value)}
//                       placeholder="Remote, New York, San Francisco"
//                     />
//                   </div>
//                 </div>

//                 {/* Row 4 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="salaryRange">Salary Range</Label>
//                     <Input
//                       id="salaryRange"
//                       value={obSalaryRange}
//                       onChange={(e) => setObSalaryRange(e.target.value)}
//                       placeholder="e.g., $80,000 - $100,000"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="workAuth">Work Auth Details</Label>
//                     <Textarea
//                       id="workAuth"
//                       rows={2}
//                       value={obWorkAuth}
//                       onChange={(e) => setObWorkAuth(e.target.value)}
//                       placeholder="Over 18: yes, Eligible in US: yes, Authorized w/o visa"
//                     />
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Additional Information Card */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Additional Information</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {/* Row 5 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="sponsorship">Needs Sponsorship</Label>
//                     <Select
//                       value={
//                         obNeedsSponsorship === null
//                           ? "__unset__"
//                           : obNeedsSponsorship
//                           ? "yes"
//                           : "no"
//                       }
//                       onValueChange={(v) => {
//                         if (v === "__unset__") setObNeedsSponsorship(null);
//                         else setObNeedsSponsorship(v === "yes");
//                       }}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select..." />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="__unset__">—</SelectItem>
//                         <SelectItem value="yes">Yes</SelectItem>
//                         <SelectItem value="no">No</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="dob">Date of Birth</Label>
//                     <Input
//                       id="dob"
//                       type="date"
//                       value={formatDateForInput(obDob)}
//                       onChange={(e) => setObDob(e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 {/* Row 6 */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="fullAddress">Full Address</Label>
//                     <Textarea
//                       id="fullAddress"
//                       rows={3}
//                       value={obFullAddress}
//                       onChange={(e) => setObFullAddress(e.target.value)}
//                       placeholder="Street, City, State, ZIP Code"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="linkedinUrl">LinkedIn URL (eg:https://www.linkedin.com/in/mark-zuckerberg-618bba58)</Label>
//                     <Input
//                       id="linkedinUrl"
//                       type="url"
//                       value={obLinkedInUrl}
//                       onChange={(e) => setObLinkedInUrl(e.target.value)}
//                       placeholder="https://www.linkedin.com/in/username"
//                     />
//                   </div>
//                 </div>

//                 {/* Additional Fields */}
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
//                     <Input
//                       id="whatsappNumber"
//                       value={obWhatsappNumber}
//                       onChange={(e) => setObWhatsappNumber(e.target.value)}
//                       placeholder="+1234567890"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="githubUrl">GitHub URL (eg:https://github.com/dheerajtiwari/demogithubprofile)</Label>
//                     <Input
//                       id="githubUrl"
//                       type="url"
//                       value={obGithubUrl}
//                       onChange={(e) => setObGithubUrl(e.target.value)}
//                       placeholder="https://github.com/username"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="visaType">Visa Type</Label>
//                     <Input
//                       id="visaType"
//                       value={obVisaType}
//                       onChange={(e) => setObVisaType(e.target.value)}
//                       placeholder="H1B, L1, etc."
//                     />
//                   </div>
//                 </div>

//                 {/* Personal Email */}
//                 <div className="space-y-2">
//                   <Label htmlFor="personalEmail">Personal Email</Label>
//                   <Input
//                     id="personalEmail"
//                     type="email"
//                     value={obPersonalEmail}
//                     onChange={(e) => setObPersonalEmail(e.target.value)}
//                     placeholder="personal@example.com"
//                   />
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Hidden fields with defaults */}
//             <div className="hidden">
//               <Input
//                 type="hidden"
//                 value={obExperience}
//                 onChange={(e) => setObExperience(e.target.value)}
//               />
//               <Input
//                 type="hidden"
//                 value={obExcludeCompanies}
//                 onChange={(e) => setObExcludeCompanies(e.target.value)}
//               />
//               <Input
//                 type="hidden"
//                 value={obNoOfApplications}
//                 onChange={(e) => setObNoOfApplications(e.target.value)}
//               />
//             </div>
//           </div>
//         )}

//         {/* Footer Actions */}
//         <div className="flex items-center justify-between pt-6 border-t">
//           <Button
//             variant="outline"
//             onClick={() => router.back()}
//             disabled={loading || formLoading}
//           >
//             Cancel
//           </Button>
//           <div className="flex items-center gap-4">
//             <Button
//               variant="secondary"
//               onClick={loadData}
//               disabled={loading || formLoading}
//             >
//               Reload Data
//             </Button>
//             <Button
//               onClick={handleSave}
//               disabled={loading || formLoading || !obDate}
//               className="gap-2 bg-purple-600 hover:bg-purple-700"
//             >
//               <Save className="h-4 w-4" />
//               {loading ? "Saving..." : "Save & Onboard"}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }










  // // app/resumeTeam/onboarding/[lead_id]/page.tsx
// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import OnboardingDialog from "./OnboardingDialog";

// export default function OnboardingPage() {
//   const [showDialog, setShowDialog] = useState(false);

//   return (
//     <div className="container mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-6">Onboarding Management</h1>
      
//       <Button
//         onClick={() => setShowDialog(true)}
//         className="bg-purple-600 hover:bg-purple-700"
//       >
//         Open Onboarding Dialog
//       </Button>

//       <OnboardingDialog
//         open={showDialog}
//         onOpenChange={setShowDialog}
//         onSuccess={() => {
//           // Refresh data or show success message
//           console.log("Onboarding completed successfully!");
//         }}
//       />
//     </div>
//   );
// }


// app/resumeTeam/onboarding/[lead_id]/OnboardingForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { supabase } from "@/utils/supabase/client";
import { ArrowLeft, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper functions
const csvFromArray = (arr: string[] | null | undefined): string => {
  if (!arr || !Array.isArray(arr)) return "";
  return arr.filter(Boolean).join(", ");
};

const csvToArray = (csv: string): string[] => {
  if (!csv) return [];
  return csv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

interface OnboardingData {
  id?: string;
  full_name?: string;
  personal_email?: string;
  company_email?: string;
  callable_phone?: string;
  job_role_preferences?: string[];
  location_preferences?: string[];
  salary_range?: string;
  work_auth_details?: string;
  needs_sponsorship?: boolean | null;
  full_address?: string;
  linkedin_url?: string;
  date_of_birth?: string;
  whatsapp_number?: string;
  github_url?: string;
  visa_type?: string;
  created_at?: string;
  lead_id?: string;
}

interface SalesClosureData {
  id?: string;
  lead_id?: string;
  onboarded_date?: string;
  company_application_email?: string;
  email?: string;
}

export default function OnboardingForm() {
  const params = useParams();
  const router = useRouter();
  const lead_id = params.lead_id as string;

  // Form state
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [salesData, setSalesData] = useState<SalesClosureData | null>(null);
  
  // Form fields
  const [obFullName, setObFullName] = useState("");
  const [obCompanyEmail, setObCompanyEmail] = useState("");
  const [obPersonalEmail, setObPersonalEmail] = useState("");
  const [obCallablePhone, setObCallablePhone] = useState("");
  const [obJobRolesText, setObJobRolesText] = useState("");
  const [obLocationsText, setObLocationsText] = useState("");
  const [obSalaryRange, setObSalaryRange] = useState("");
  const [obWorkAuth, setObWorkAuth] = useState("");
  const [obNeedsSponsorship, setObNeedsSponsorship] = useState<boolean | null>(null);
  const [obFullAddress, setObFullAddress] = useState("");
  const [obLinkedInUrl, setObLinkedInUrl] = useState("");
  const [obDob, setObDob] = useState("");
  const [obDate, setObDate] = useState("");
  
  // Additional fields from your list
  const [obWhatsappNumber, setObWhatsappNumber] = useState("");
  const [obGithubUrl, setObGithubUrl] = useState("");
  const [obVisaType, setObVisaType] = useState("");
  const [obExperience, setObExperience] = useState("0");
  const [obExcludeCompanies, setObExcludeCompanies] = useState("NA");
  const [obNoOfApplications, setObNoOfApplications] = useState("20");

  // Fetch data on component mount
  useEffect(() => {
    if (lead_id) {
      loadData();
    }
  }, [lead_id]);

  // const loadData = async () => {
  //   setFormLoading(true);
  //   try {
  //     // Fetch from client_onborading_details
  //     const { data: onboarding, error: onboardingError } = await supabase
  //       .from("client_onborading_details")
  //       .select("*")
  //       .eq("lead_id", lead_id)
  //       .order("created_at", { ascending: false })
  //       .limit(1)
  //       .maybeSingle();

  //     if (onboardingError) {
  //       console.error("Error fetching onboarding data:", onboardingError);
  //     }

  //     // Fetch from sales_closure
  //     const { data: sales, error: salesError } = await supabase
  //       .from("sales_closure")
  //       .select("id, lead_id, onboarded_date, company_application_email, email")
  //       .eq("lead_id", lead_id)
  //       .order("closed_at", { ascending: false })
  //       .limit(1)
  //       .maybeSingle();

  //     if (salesError) {
  //       console.error("Error fetching sales data:", salesError);
  //     }

  //     setOnboardingData(onboarding || null);
  //     setSalesData(sales || null);

  //     // Pre-fill form
  //     if (onboarding) {
  //       setObFullName(onboarding.full_name || "");
  //       setObCompanyEmail(onboarding.company_email || "");
  //       setObPersonalEmail(onboarding.personal_email || "");
  //       setObCallablePhone(onboarding.callable_phone || "");
  //       setObJobRolesText(csvFromArray(onboarding.job_role_preferences));
  //       setObLocationsText(csvFromArray(onboarding.location_preferences));
  //       setObSalaryRange(onboarding.salary_range || "");
  //       setObWorkAuth(onboarding.work_auth_details || "");
  //       setObNeedsSponsorship(onboarding.needs_sponsorship || null);
  //       setObFullAddress(onboarding.full_address || "");
  //       setObLinkedInUrl(onboarding.linkedin_url || "");
  //       setObDob(onboarding.date_of_birth || "");
  //       setObWhatsappNumber(onboarding.whatsapp_number || "");
  //       setObGithubUrl(onboarding.github_url || "");
  //       setObVisaType(onboarding.visatypes || "");
  //     }

  //     // Pre-fill sales data
  //     if (sales) {
  //       setObDate(sales.onboarded_date || "");
  //       // If company email is not in onboarding but is in sales, use it
  //       if (!onboarding?.company_email && sales.company_application_email) {
  //         setObCompanyEmail(sales.company_application_email);
  //       }
  //       if (!onboarding?.personal_email && sales.email) {
  //         setObPersonalEmail(sales.email);
  //       }
  //     }

  //   } catch (error) {
  //     console.error("Error loading data:", error);
  //     alert("Failed to load data. Please try again.");
  //   } finally {
  //     setFormLoading(false);
  //   }
  // };

  // const handleSave = async () => {
  //   if (!lead_id) {
  //     alert("No lead ID found");
  //     return;
  //   }

  //   if (!obDate) {
  //     alert("Please choose an Onboarded Date");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     // 1. Update or create client_onborading_details
  //     const onboardingPayload = {
  //       full_name: obFullName || null,
  //       company_email: obCompanyEmail?.trim() || null,
  //       personal_email: obPersonalEmail || null,
  //       callable_phone: obCallablePhone || null,
  //       job_role_preferences: csvToArray(obJobRolesText),
  //       location_preferences: csvToArray(obLocationsText),
  //       salary_range: obSalaryRange || null,
  //       work_auth_details: obWorkAuth || null,
  //       needs_sponsorship: obNeedsSponsorship,
  //       full_address: obFullAddress || null,
  //       linkedin_url: obLinkedInUrl || null,
  //       date_of_birth: obDob || null,
  //       whatsapp_number: obWhatsappNumber || null,
  //       github_url: obGithubUrl || null,
  //       visatypes: obVisaType || null,
  //       lead_id: lead_id,
  //     };

  //     if (onboardingData?.id) {
  //       // Update existing
  //       const { error } = await supabase
  //         .from("client_onborading_details")
  //         .update(onboardingPayload)
  //         .eq("id", onboardingData.id);
        
  //       if (error) throw error;
  //     } else {
  //       // Create new
  //       const { error } = await supabase
  //         .from("client_onborading_details")
  //         .insert(onboardingPayload);
        
  //       if (error) throw error;
  //     }

  //     // 2. Update sales_closure with onboarded date and company email
  //     if (salesData?.id) {
  //       const { error: salesError } = await supabase
  //         .from("sales_closure")
  //         .update({
  //           onboarded_date: obDate,
  //           company_application_email: obCompanyEmail?.trim() || null,
  //         })
  //         .eq("id", salesData.id);
        
  //       if (salesError) throw salesError;
  //     }

  //     // 3. Send to pending_clients API
  //     const pendingClientPayload = {
  //       full_name: obFullName || "",
  //       company_email: obCompanyEmail?.trim() || "",
  //       personal_email: obPersonalEmail || "",
  //       whatsapp_number: obWhatsappNumber || null,
  //       callable_phone: obCallablePhone || null,
  //       job_role_preferences: csvToArray(obJobRolesText),
  //       location_preferences: csvToArray(obLocationsText),
  //       salary_range: obSalaryRange || null,
  //       work_auth_details: obWorkAuth || null,
  //       visa_type: obVisaType || null,
  //       sponsorship: obNeedsSponsorship,
  //       applywizz_id: lead_id,
  //       resume_url: null,
  //       resume_path: null,
  //       start_date: null,
  //       end_date: null,
  //       no_of_applications: obNoOfApplications || "20",
  //       badge_value: null,
  //       add_ons_info: [],
  //       github_url: obGithubUrl || null,
  //       linked_in_url: obLinkedInUrl || null,
  //       is_over_18: null,
  //       eligible_to_work_in_us: null,
  //       authorized_without_visa: null,
  //       require_future_sponsorship: null,
  //       can_perform_essential_functions: null,
  //       worked_for_company_before: null,
  //       discharged_for_policy_violation: null,
  //       referred_by_agency: null,
  //       highest_education: null,
  //       university_name: null,
  //       cumulative_gpa: null,
  //       desired_start_date: null,
  //       willing_to_relocate: null,
  //       can_work_3_days_in_office: null,
  //       role: null,
  //       experience: obExperience || "0",
  //       work_preferences: null,
  //       alternate_job_roles: null,
  //       exclude_companies: obExcludeCompanies || "NA",
  //       convicted_of_felony: null,
  //       felony_explanation: null,
  //       pending_investigation: null,
  //       willing_background_check: null,
  //       willing_drug_screen: null,
  //       failed_or_refused_drug_test: null,
  //       uses_substances_affecting_duties: null,
  //       substances_description: null,
  //       can_provide_legal_docs: null,
  //       gender: null,
  //       is_hispanic_latino: null,
  //       race_ethnicity: null,
  //       veteran_status: null,
  //       disability_status: null,
  //       has_relatives_in_company: null,
  //       relatives_details: null,
  //       state_of_residence: null,
  //       zip_or_country: null,
  //       main_subject: null,
  //       graduation_year: null,
  //       client_form_fill_date: new Date().toISOString(),
  //       cover_letter_path: null,
  //       full_address: obFullAddress || null,
  //       date_of_birth: obDob || null,
  //       primary_phone: obCallablePhone || null,
  //       created_at: new Date().toISOString(),
  //     };

  //     const response = await fetch("/api/pending-clients/upsert", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(pendingClientPayload),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.message || "Failed to save to pending clients");
  //     }

  //     // Success
  //     alert("Data saved successfully!");
  //     router.back(); // Go back to previous page

  //   } catch (error: any) {
  //     console.error("Error saving data:", error);
  //     alert(error.message || "Failed to save data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

// Update the loadData function to pre-fill ALL form state
const loadData = async () => {
  setFormLoading(true);
  try {
    // Fetch from client_onborading_details with ALL fields
    const { data: onboarding, error: onboardingError } = await supabase
      .from("client_onborading_details")
      .select("*")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (onboardingError) {
      console.error("Error fetching onboarding data:", onboardingError);
    }

    // Fetch from sales_closure
    const { data: sales, error: salesError } = await supabase
      .from("sales_closure")
      .select(`
        id,
        lead_id,
        onboarded_date,
        company_application_email,
        email,
        badge_value,
        subscription_cycle
      `)
      .eq("lead_id", lead_id)
      .order("closed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (salesError) {
      console.error("Error fetching sales data:", salesError);
    }

    setOnboardingData(onboarding || null);
    setSalesData(sales || null);

    // Pre-fill form with ALL fields from client_onborading_details
    if (onboarding) {
      // Basic fields
      setObFullName(onboarding.full_name || "");
      setObCompanyEmail(onboarding.company_email || "");
      setObPersonalEmail(onboarding.personal_email || "");
      setObCallablePhone(onboarding.callable_phone || "");
      setObJobRolesText(csvFromArray(onboarding.job_role_preferences));
      setObLocationsText(csvFromArray(onboarding.location_preferences));
      setObSalaryRange(onboarding.salary_range || "");
      setObWorkAuth(onboarding.work_auth_details || "");
      setObNeedsSponsorship(onboarding.needs_sponsorship || null);
      setObFullAddress(onboarding.full_address || "");
      setObLinkedInUrl(onboarding.linkedin_url || "");
      setObDob(onboarding.date_of_birth || "");
      setObWhatsappNumber(onboarding.whatsapp_number || "");
      setObGithubUrl(onboarding.github_url || "");
      setObVisaType(onboarding.visatypes || "");
      
      // Additional fields - you need to add these state variables
      setObExperience(onboarding.experience || "0");
      setObExcludeCompanies(onboarding.exclude_companies || "NA");
      
      // You should add state for all these fields and set them here:
      // setIsOver18(onboarding.is_over_18 || null);
      // setEligibleToWorkInUS(onboarding.eligible_to_work_in_us || null);
      // setAuthorizedWithoutVisa(onboarding.authorized_without_visa || null);
      // ... etc for all other fields
    }

    // Pre-fill sales data
    if (sales) {
      setObDate(sales.onboarded_date || "");
      // If company email is not in onboarding but is in sales, use it
      if (!onboarding?.company_email && sales.company_application_email) {
        setObCompanyEmail(sales.company_application_email);
      }
      if (!onboarding?.personal_email && sales.email) {
        setObPersonalEmail(sales.email);
      }
    }

  } catch (error) {
    console.error("Error loading data:", error);
    alert("Failed to load data. Please try again.");
  } finally {
    setFormLoading(false);
  }
};

  // Update the handleSave function to fetch ALL fields from client_onborading_details
const handleSave = async () => {
  if (!lead_id) {
    alert("No lead ID found");
    return;
  }

  if (!obDate) {
    alert("Please choose an Onboarded Date");
    return;
  }

  setLoading(true);

  try {
    // 1. Fetch ALL data from client_onborading_details
    const { data: fullOnboardingData, error: onboardingError } = await supabase
      .from("client_onborading_details")
      .select("*")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (onboardingError) {
      console.error("Error fetching full onboarding data:", onboardingError);
    }

    // 2. Fetch sales_closure data for badge_value, subscription_cycle, and add-ons
    const { data: scData, error: scError } = await supabase
      .from("sales_closure")
      .select(`
        badge_value,
        subscription_cycle,
        application_sale_value,
        resume_sale_value,
        portfolio_sale_value,
        linkedin_sale_value,
        github_sale_value,
        courses_sale_value,
        custom_sale_value,
        job_board_value,
        no_of_job_applications,
        onboarded_date
      `)
      .eq("lead_id", lead_id)
      .order("closed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scError) {
      console.error("Error fetching sales closure data:", scError);
    }

    // 3. Fetch resume_progress for resume_path
    // const { data: rpData, error: rpError } = await supabase
    //   .from("resume_progress")
    //   .select("pdf_path")
    //   .eq("lead_id", lead_id)
    //   .maybeSingle();

    const { data: rpData, error: rpError } = await supabase
  .from("resume_progress")
  .select("pdf_path")
  .eq("lead_id", lead_id)
  .maybeSingle();

// extract latest uploaded resume (last element in the array)
let latestResumePath = null;
if (rpData?.pdf_path && Array.isArray(rpData.pdf_path)) {
  latestResumePath = rpData.pdf_path[rpData.pdf_path.length - 1];
}

console.log("📄 Latest Resume Path:", latestResumePath);


    if (rpError) {
      console.error("Error fetching resume progress:", rpError);
    }
    // const resumePath = rpData?.pdf_path || null;
const resumePath = latestResumePath || null;

    // 4. Calculate start_date and end_date
    const startDate = obDate; // Use the onboarded date from form
    let endDate = null;
    
    if (startDate && scData?.subscription_cycle) {
      try {
        const endDateObj = new Date(
          new Date(startDate).getTime() +
            scData.subscription_cycle * 24 * 60 * 60 * 1000
        );
        endDate = endDateObj.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error calculating end date:", error);
      }
    }

    // 5. Prepare add_ons_info based on sales_closure values
    const allowedServices = [
      { field: "application_sale_value", label: "applications" },
      { field: "resume_sale_value", label: "resume" },
      { field: "portfolio_sale_value", label: "portfolio" },
      { field: "linkedin_sale_value", label: "linkedin" },
      { field: "github_sale_value", label: "github" },
      { field: "courses_sale_value", label: "courses" },
      { field: "experience", label: "experience" },
      { field: "badge_value", label: "badge" },
      { field: "job_board_value", label: "job-links" },
    ];

    const scAny: any = scData;
    const addOnsInfo = allowedServices
      .filter((item) => {
        const val = scAny?.[item.field];
        return val !== null && val !== undefined && Number(val) > 0;
      })
      .map((item) => item.label);

    // 6. Update or create client_onborading_details with current form values
    const onboardingPayload = {
      full_name: obFullName || null,
      company_email: obCompanyEmail?.trim() || null,
      personal_email: obPersonalEmail || null,
      callable_phone: obCallablePhone || null,
      job_role_preferences: csvToArray(obJobRolesText),
      location_preferences: csvToArray(obLocationsText),
      salary_range: obSalaryRange || null,
      work_auth_details: obWorkAuth || null,
      needs_sponsorship: obNeedsSponsorship,
      full_address: obFullAddress || null,
      linkedin_url: obLinkedInUrl || null,
      date_of_birth: obDob || null,
      whatsapp_number: obWhatsappNumber || null,
      github_url: obGithubUrl || null,
      visatypes: obVisaType || null,
      lead_id: lead_id,
      // Preserve all existing fields
      ...(fullOnboardingData && {
        is_over_18: fullOnboardingData.is_over_18,
        eligible_to_work_in_us: fullOnboardingData.eligible_to_work_in_us,
        authorized_without_visa: fullOnboardingData.authorized_without_visa,
        require_future_sponsorship: fullOnboardingData.require_future_sponsorship,
        can_perform_essential_functions: fullOnboardingData.can_perform_essential_functions,
        worked_for_company_before: fullOnboardingData.worked_for_company_before,
        discharged_for_policy_violation: fullOnboardingData.discharged_for_policy_violation,
        referred_by_agency: fullOnboardingData.referred_by_agency,
        highest_education: fullOnboardingData.highest_education,
        university_name: fullOnboardingData.university_name,
        cumulative_gpa: fullOnboardingData.cumulative_gpa,
        desired_start_date: fullOnboardingData.desired_start_date,
        willing_to_relocate: fullOnboardingData.willing_to_relocate,
        can_work_3_days_in_office: fullOnboardingData.can_work_3_days_in_office,
        role: fullOnboardingData.role,
        experience: fullOnboardingData.experience || "0",
        work_preferences: fullOnboardingData.work_preferences,
        alternate_job_roles: fullOnboardingData.alternate_job_roles,
        exclude_companies: fullOnboardingData.exclude_companies || "NA",
        convicted_of_felony: fullOnboardingData.convicted_of_felony,
        felony_explanation: fullOnboardingData.felony_explanation,
        pending_investigation: fullOnboardingData.pending_investigation,
        willing_background_check: fullOnboardingData.willing_background_check,
        willing_drug_screen: fullOnboardingData.willing_drug_screen,
        failed_or_refused_drug_test: fullOnboardingData.failed_or_refused_drug_test,
        uses_substances_affecting_duties: fullOnboardingData.uses_substances_affecting_duties,
        substances_description: fullOnboardingData.substances_description,
        can_provide_legal_docs: fullOnboardingData.can_provide_legal_docs,
        gender: fullOnboardingData.gender,
        is_hispanic_latino: fullOnboardingData.is_hispanic_latino,
        race_ethnicity: fullOnboardingData.race_ethnicity,
        veteran_status: fullOnboardingData.veteran_status,
        disability_status: fullOnboardingData.disability_status,
        has_relatives_in_company: fullOnboardingData.has_relatives_in_company,
        relatives_details: fullOnboardingData.relatives_details,
        state_of_residence: fullOnboardingData.state_of_residence,
        zip_or_country: fullOnboardingData.zip_or_country,
        main_subject: fullOnboardingData.main_subject,
        graduation_year: fullOnboardingData.graduation_year,
        cover_letter_path: fullOnboardingData.cover_letter_path,
      }),
    };

   

    // 8. Send to pending_clients API with ALL data from client_onborading_details
    const pendingClientPayload = {
      // Basic info from form
      full_name: obFullName || "",
      company_email: obCompanyEmail?.trim() || "",
      personal_email: obPersonalEmail || "",
      whatsapp_number: obWhatsappNumber || null,
      callable_phone: obCallablePhone || null,
      job_role_preferences: csvToArray(obJobRolesText),
      location_preferences: csvToArray(obLocationsText),
      salary_range: obSalaryRange || null,
      work_auth_details: obWorkAuth || null,
      visa_type: obVisaType || null,
      sponsorship: obNeedsSponsorship,
      applywizz_id: lead_id,
      
      // From sales_closure
      badge_value: scData?.badge_value || null,
      no_of_applications: scData?.no_of_job_applications?.toString()  || "20",
      
      // From resume_progress
      resume_url: resumePath || null,
      resume_path: resumePath || null,
      
      // Calculated dates
      start_date: startDate || null,
      end_date: endDate || null,
      
      // Add-ons info
      add_ons_info: addOnsInfo,
      
      // URLs
      github_url: obGithubUrl || null,
      linked_in_url: obLinkedInUrl || null,
      
      // ALL fields from client_onborading_details (if they exist)
      is_over_18: fullOnboardingData?.is_over_18 || null,
      eligible_to_work_in_us: fullOnboardingData?.eligible_to_work_in_us || null,
      authorized_without_visa: fullOnboardingData?.authorized_without_visa || null,
      require_future_sponsorship: fullOnboardingData?.require_future_sponsorship || null,
      can_perform_essential_functions: fullOnboardingData?.can_perform_essential_functions || null,
      worked_for_company_before: fullOnboardingData?.worked_for_company_before || null,
      discharged_for_policy_violation: fullOnboardingData?.discharged_for_policy_violation || null,
      referred_by_agency: fullOnboardingData?.referred_by_agency || null,
      willing_to_relocate: fullOnboardingData?.willing_to_relocate || null,
      can_work_3_days_in_office: fullOnboardingData?.can_work_3_days_in_office || null,
      convicted_of_felony: fullOnboardingData?.convicted_of_felony || null,
      pending_investigation: fullOnboardingData?.pending_investigation || null,
      willing_background_check: fullOnboardingData?.willing_background_check || null,
      willing_drug_screen: fullOnboardingData?.willing_drug_screen || null,
      failed_or_refused_drug_test: fullOnboardingData?.failed_or_refused_drug_test || null,
      uses_substances_affecting_duties: fullOnboardingData?.uses_substances_affecting_duties || null,
      can_provide_legal_docs: fullOnboardingData?.can_provide_legal_docs || null,
      has_relatives_in_company: fullOnboardingData?.has_relatives_in_company || null,
      
      // Text fields from client_onborading_details
      highest_education: fullOnboardingData?.highest_education || null,
      university_name: fullOnboardingData?.university_name || null,
      cumulative_gpa: fullOnboardingData?.cumulative_gpa || null,
      desired_start_date: fullOnboardingData?.desired_start_date || null,
      role: fullOnboardingData?.role || null,
      experience: fullOnboardingData?.experience || "0",
      work_preferences: fullOnboardingData?.work_preferences || null,
      alternate_job_roles: fullOnboardingData?.alternate_job_roles || null,
      exclude_companies: fullOnboardingData?.exclude_companies || "NA",
      felony_explanation: fullOnboardingData?.felony_explanation || null,
      substances_description: fullOnboardingData?.substances_description || null,
      gender: fullOnboardingData?.gender || null,
      is_hispanic_latino: fullOnboardingData?.is_hispanic_latino || null,
      race_ethnicity: fullOnboardingData?.race_ethnicity || null,
      veteran_status: fullOnboardingData?.veteran_status || null,
      disability_status: fullOnboardingData?.disability_status || null,
      relatives_details: fullOnboardingData?.relatives_details || null,
      state_of_residence: fullOnboardingData?.state_of_residence || null,
      zip_or_country: fullOnboardingData?.zip_or_country || null,
      main_subject: fullOnboardingData?.main_subject || null,
      graduation_year: fullOnboardingData?.graduation_year || null,
      cover_letter_path: fullOnboardingData?.cover_letter_path || null,
      
      // Other fields
      client_form_fill_date: new Date().toISOString(),
      full_address: obFullAddress || fullOnboardingData?.full_address || null,
      date_of_birth: obDob || fullOnboardingData?.date_of_birth || null,
      primary_phone: obCallablePhone || fullOnboardingData?.callable_phone || null,
      created_at: new Date().toISOString(),
    };

//     console.log("Sending COMPLETE data to pending_clients:", pendingClientPayload);

//     const response = await fetch("/api/pending-clients/upsert", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(pendingClientPayload),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || "Failed to save to pending clients");
//     }

//     // Success
//     alert("Data saved successfully to all tables!");
//     router.back(); // Go back to previous page

//   } catch (error: any) {
//     console.error("Error saving data:", error);
//     alert(error.message || "Failed to save data");
//   } finally {
//     setLoading(false);
//   }
// };


 console.log("📤 Sending payload to /api/pending-clients/upsert:", JSON.stringify(pendingClientPayload, null, 2));

    const response = await fetch("/api/pending-clients/upsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pendingClientPayload),
    });

    const responseData = await response.json();
    console.log("📥 API Response:", responseData);

    if (!response.ok) {
      // Log detailed error information
      console.error("❌ API Error Details:", {
        status: response.status,
        statusText: response.statusText,
        errorData: responseData,
        payload: pendingClientPayload,
      });
      
      // Extract detailed error message
      let errorMessage = "Failed to save to pending clients";
      if (responseData.error) {
        errorMessage = responseData.error;
      }
      if (responseData.details) {
        if (Array.isArray(responseData.details)) {
          errorMessage = responseData.details.map((err: any) => 
            `${err.field}: ${err.message}`
          ).join(", ");
        } else {
          errorMessage += ` - ${JSON.stringify(responseData.details)}`;
        }
      }
      if (responseData.validationErrors) {
        errorMessage = "Validation Errors: " + responseData.validationErrors.map((err: any) => 
          `${err.field}: ${err.message}`
        ).join(", ");
      }
      
      throw new Error(errorMessage);
    }

     if (onboardingData?.id) {
      // Update existing
      const { error } = await supabase
        .from("client_onborading_details")
        .update(onboardingPayload)
        .eq("id", onboardingData.id);
      
      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from("client_onborading_details")
        .insert(onboardingPayload);
      
      if (error) throw error;
    }

    // 7. Update sales_closure with onboarded date and company email
    if (salesData?.id) {
      const { error: salesError } = await supabase
        .from("sales_closure")
        .update({
          onboarded_date: obDate,
          company_application_email: obCompanyEmail?.trim() || null,
        })
        .eq("id", salesData.id);
      
      if (salesError) throw salesError;
    }

    // Success
    alert("Data saved successfully to all tables!");
    console.log("✅ Successfully saved data");
    router.back(); // Go back to previous page

  } catch (error: any) {
    console.error("🔥 Error saving data:", {
      message: error.message,
      stack: error.stack,
      error: error,
    });
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Onboard & Edit — {lead_id}
              </h1>
              <p className="text-muted-foreground">
                Update the latest onboarding details and set the Onboarded Date.
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={loading || formLoading || !obDate}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Saving..." : "Save & Onboard"}
          </Button>
        </div>

        {/* Form Content */}
        {formLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading onboarding data...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Main Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={obFullName}
                      onChange={(e) => setObFullName(e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Company Email *</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={obCompanyEmail}
                      onChange={(e) => setObCompanyEmail(e.target.value)}
                      placeholder="company@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="callablePhone">Callable Phone</Label>
                    <Input
                      id="callablePhone"
                      value={obCallablePhone}
                      onChange={(e) => setObCallablePhone(e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="onboardedDate">Onboarded Date *</Label>
                    <Input
                      id="onboardedDate"
                      type="date"
                      value={formatDateForInput(obDate)}
                      onChange={(e) => setObDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="jobRoles">Job Role Preferences (comma separated)</Label>
                    <Textarea
                      id="jobRoles"
                      rows={3}
                      value={obJobRolesText}
                      onChange={(e) => setObJobRolesText(e.target.value)}
                      placeholder="Java Full Stack, Frontend Developer, Backend Engineer"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locations">Location Preferences (comma separated)</Label>
                    <Textarea
                      id="locations"
                      rows={3}
                      value={obLocationsText}
                      onChange={(e) => setObLocationsText(e.target.value)}
                      placeholder="Remote, New York, San Francisco"
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salaryRange">Salary Range</Label>
                    <Input
                      id="salaryRange"
                      value={obSalaryRange}
                      onChange={(e) => setObSalaryRange(e.target.value)}
                      placeholder="e.g., $80,000 - $100,000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workAuth">Work Auth Details</Label>
                    <Textarea
                      id="workAuth"
                      rows={2}
                      value={obWorkAuth}
                      onChange={(e) => setObWorkAuth(e.target.value)}
                      placeholder="Over 18: yes, Eligible in US: yes, Authorized w/o visa"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Row 5 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sponsorship">Needs Sponsorship</Label>
                    <Select
                      value={
                        obNeedsSponsorship === null
                          ? "__unset__"
                          : obNeedsSponsorship
                          ? "yes"
                          : "no"
                      }
                      onValueChange={(v) => {
                        if (v === "__unset__") setObNeedsSponsorship(null);
                        else setObNeedsSponsorship(v === "yes");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unset__">—</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formatDateForInput(obDob)}
                      onChange={(e) => setObDob(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 6 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullAddress">Full Address</Label>
                    <Textarea
                      id="fullAddress"
                      rows={3}
                      value={obFullAddress}
                      onChange={(e) => setObFullAddress(e.target.value)}
                      placeholder="Street, City, State, ZIP Code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL (eg:https://www.linkedin.com/in/mark-zuckerberg-618bba58)</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={obLinkedInUrl}
                      onChange={(e) => setObLinkedInUrl(e.target.value)}
                      placeholder="https://www.linkedin.com/in/username"
                    />
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                    <Input
                      id="whatsappNumber"
                      value={obWhatsappNumber}
                      onChange={(e) => setObWhatsappNumber(e.target.value)}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub URL (eg:https://github.com/dheerajtiwari/demogithubprofile)</Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      value={obGithubUrl}
                      onChange={(e) => setObGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visaType">Visa Type</Label>
                    <Input
                      id="visaType"
                      value={obVisaType}
                      onChange={(e) => setObVisaType(e.target.value)}
                      placeholder="H1B, L1, etc."
                    />
                  </div>
                </div>

                {/* Personal Email */}
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={obPersonalEmail}
                    onChange={(e) => setObPersonalEmail(e.target.value)}
                    placeholder="personal@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hidden fields with defaults */}
            <div className="hidden">
              <Input
                type="hidden"
                value={obExperience}
                onChange={(e) => setObExperience(e.target.value)}
              />
              <Input
                type="hidden"
                value={obExcludeCompanies}
                onChange={(e) => setObExcludeCompanies(e.target.value)}
              />
              <Input
                type="hidden"
                value={obNoOfApplications}
                onChange={(e) => setObNoOfApplications(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={loading || formLoading}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={loadData}
              disabled={loading || formLoading}
            >
              Reload Data
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || formLoading || !obDate}
              className="gap-2 bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save & Onboard"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
