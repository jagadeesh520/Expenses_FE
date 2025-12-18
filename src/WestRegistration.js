// src/SPICONRegistration.js
// SPICON 2026 — Dynamic Registration Form (FULL VERSION)
// Bootstrap 5 + React + Fully Dynamic Logic
import React, { useState } from "react";
// Assuming useNavigate is available in the component's scope (requires import)
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants"; 
import logo from "./Assests/logo.PNG";
import WestGooglePayQR from "./Assests/west_googlepay.png";
import WestPhonePayQR from "./Assests/west_phonepay.png";


export default function SPICONRegistration() {
  // Initialize useNavigate hook
  const navigate = useNavigate(); 
  
  const initial = {
    email: "",
    title: "",
    fullName: "",
    surname: "",
    dtcAttended: "",
    dtcWhen: "",
    dtcWhere: "",
    mobile: "",
    district: "",
    iceuEgf: "",
    paymentMode: "",
    recommenderName: "",
    recommenderContact: "",
    groupType: "",
    gender: "",
    age: "",
    spouseAttending: "",
    spouseName: "",
    childBelow10Count: "0",
    childBelow10Names: "",
    child10to14Count: "0",
    child10to14Names: "",
    totalFamilyMembers: "",
    delegatesOther: "",
    amountPaid: "",
    paymentMode2: "",
    dateOfPayment: "",
    transactionId: "",
    arrivalDay: "",
    arrivalTime: "",
    maritalStatus: "", // Added maritalStatus to initial state
  };

  const [form, setForm] = useState(initial);
  const [screenshot, setScreenshot] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  
  // --- Define the Region for API Submission ---
  const REGION_NAME = "West Rayalaseema";

  const handle = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!form.fullName || !form.mobile || !form.groupType || !form.amountPaid) {
      setMessage("Please fill all mandatory fields.");
      setMessageType("error");
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (screenshot) fd.append("paymentScreenshot", screenshot);

    // IMPORTANT: Hardcode the region here for the backend
    fd.append("region", REGION_NAME);
    
    setLoading(true);

    try {
      const res = await fetch(
        API_ENDPOINTS.REGISTER_CUSTOMER,
        {
          method: "POST",
          body: fd,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      // Redirect to the success page, passing only region and email via state
      navigate('/registration-success', { 
        state: { 
          region: REGION_NAME,
          email: form.email,
          fullName: form.fullName
        } 
      });

    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
      setLoading(false); // Only reset loading on error
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Note: setLoading(false) is intentionally removed here, as navigation unmounts the component on success.
  };

  return (
    <div className="container py-4">

      {/* SUCCESS / ERROR MESSAGE (Only for API errors) */}
      {message && (
        <div
          className={`alert text-center ${
            messageType === "success" ? "alert-success" : "alert-danger"
          }`}
          role="alert"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      {/* SPICON HEADER SECTION */}
      <div className="text-center mb-4">
        <img
          src={logo}
          alt="SPICON Logo"
          style={{ width: "120px", marginBottom: "15px" }}
        />

        <h2 className="fw-bold mb-2">
          WEST RAYALASEEMA SPICON-2026 REGISTRATION FORM
        </h2>

        <p className="mb-1">
          <strong>Dates:</strong> 11<sup>th</sup> to 14<sup>th</sup> January 2026
        </p>
        <p className="mb-1">
          <strong>Venue:</strong> Seventh-day Adventist High School,
        </p>
        <p className="mb-3">
          Duggannagaripalli, Vemula Mandal (Near Vempalli),<br />
          Kadapa District (Y.S.R. Dist.)
        </p>

        <hr />

        <h5 className="fw-bold mt-3">Who can attend?</h5>
        <ul className="text-start mx-auto" style={{ maxWidth: "800px" }}>
          <li>Students with Born-again experience, D.T. Camp attended and with recommendation by Senior advisor/district staff</li>
          <li>Graduates involving in student ministry and with recommendation by Egf secretary/ap Egf staff.</li>
          <li>Only authenticated registrations will be added to the SPICON-2026 Delegates WhatsApp group.</li>
        </ul>

        <p className="fw-bold mt-2">This is a sign that your registration is confirmed.</p>

        <p className="mt-3">
          <strong>Last date for registration:</strong><br />
          20/12/2025 – 11:59 PM
        </p>

        <p className="text-danger fw-bold">NOTE: Spot registrations will not be allowed under any circumstances.</p>

        <hr />

        <h5 className="fw-bold">Registration Details</h5>
        <ul className="text-start mx-auto" style={{ maxWidth: "800px" }}>
          <li>Students & Unemployed – ₹500</li>
          <li>Employed – ₹1300</li>
          <li>Families – ₹2500</li>
          <li>Children above 15 years – ₹500</li>
          <li>Volunteers – ₹250</li>
        </ul>
        <p><span className="fw-bold">NOTE:</span></p>
        <div>1.Children above 15 years old must be registered separately</div>
        <div>2.Pensioners and Business people are treated as employees.</div>
        <div>3.Students attending under volunteer's kota should reach the venue by 8am on 10/01/26 and leave the campus after the completion of physical works in venue.</div>
 

        <p className="fw-bold mt-3">For any queries, please contact:</p>

        <p>
          <strong>Bro. R. Sudhakar (Tadipatri)</strong><br />
          9866621304
        </p>

        <p className="mt-3">
          Yours in Christ,<br />
          <strong>Bro. Sudhakar</strong><br />
          Registrar
        </p>

        <hr className="mb-4" />
      </div>

      {/* FORM START */}
      <form className="row g-3" onSubmit={handleSubmit}>

        {/* EMAIL */}
        <div className="col-12 col-md-6">
          <label htmlFor="email" className="form-label">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-control"
            value={form.email}
            onChange={handle}
            required
          />
        </div>

        {/* TITLE */}
        <div className="col-12 col-md-6">
          <label htmlFor="title" className="form-label">Title (గౌరవ సంబోధన)</label>
          <select
            id="title"
            name="title"
            className="form-select"
            value={form.title}
            onChange={handle}
          >
            <option value="">Choose</option>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Miss">Miss</option>
            <option value="Pastor">Pastor</option>
            <option value="Dr">Dr</option>
          </select>
        </div>

        {/* FULL NAME */}
        <div className="col-12 col-md-6">
          <label htmlFor="fullName" className="form-label">Enter Full Name *</label>
          <input
            id="fullName"
            name="fullName"
            className="form-control"
            value={form.fullName}
            onChange={handle}
            required
          />
        </div>

        {/* SURNAME */}
        <div className="col-12 col-md-6">
          <label htmlFor="surname" className="form-label">Surname *</label>
          <input
            id="surname"
            name="surname"
            className="form-control"
            value={form.surname}
            onChange={handle}
            required
          />
        </div>

                    {/* GENDER */}
            <div className="col-12 col-md-6">
              <label htmlFor="gender" className="form-label">Gender *</label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handle}
                required
              >
                <option value="">Choose</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                
              </select>
            </div>

            {/* AGE */}
            <div className="col-12 col-md-6">
              <label htmlFor="age" className="form-label">Your Age *</label>
              <input
                id="age"
                name="age"
                type="number"
                min="1"
                className="form-control"
                value={form.age}
                onChange={handle}
                required
              />
            </div>            

        {/* DTC ATTENDED */}
        <div className="col-12 col-md-6">
          <label htmlFor="dtcAttended" className="form-label">Have you attended DT Camp? *</label>
          <select
            id="dtcAttended"
            name="dtcAttended"
            className="form-select"
            value={form.dtcAttended}
            onChange={handle}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* CONDITIONAL BLOCK FOR DTC */}
        {form.dtcAttended === "Yes" && (
          <>
            <div className="col-12 col-md-6">
              <label htmlFor="dtcWhen" className="form-label">When did you attend your first DT Camp?  *</label>
              <input
                id="dtcWhen"
                name="dtcWhen"
                className="form-control"
                value={form.dtcWhen}
                onChange={handle}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="dtcWhere" className="form-label">Where did you attend first  DT Camp?  *</label>
              <input
                id="dtcWhere"
                name="dtcWhere"
                className="form-control"
                value={form.dtcWhere}
                onChange={handle}
                required
              />
            </div>
          </>
        )}

        {/* MOBILE */}
        <div className="col-12 col-md-6">
          <label htmlFor="mobile" className="form-label">Mobile Number *</label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            className="form-control"
            value={form.mobile}
            onChange={handle}
            required
            placeholder="e.g. 98XXXXXXXX"
          />
        </div>

        {/* DISTRICT */}
        <div className="col-12 col-md-6">
          <label htmlFor="district" className="form-label">District *</label>
          <select
            id="district"
            name="district"
            className="form-select"
            value={form.district}
            onChange={handle}
            required
          >
            <option value="">Select</option>
            <option value="Anantapur">Anantapur</option>
            <option value="Sri Sathya Sai">Sri Sathya Sai</option>
            <option value="YSR Kadapa">YSR Kadapa</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ICEU / EGF */}
        <div className="col-12 col-md-6">
          <label htmlFor="iceuEgf" className="form-label">Which ICEU / EGF do you belong to? *</label>
          <select
            id="iceuEgf"
            name="iceuEgf"
            className="form-select"
            value={form.iceuEgf}
            onChange={handle}
            required
          >
            <option value="">Choose</option>
            <option value="Anantapur East Zone">Anantapur East Zone</option>
            <option value="Anantapur West Zone">Anantapur West Zone</option>
            <option value="Anantapur JNTU Zone">Anantapur JNTU Zone</option>
            <option value="Atp West Zone">Atp West Zone</option>
            <option value="Badvel">Badvel</option>
            <option value="Bukkarayasamudram">Bukkarayasamudram</option>
            <option value="Dharmavaram">Dharmavaram</option>
            <option value="Gooty">Gooty</option>
            <option value="Guntakal">Guntakal</option>
            <option value="Hindupur">Hindupur</option>
            <option value="IIIT Idupulapaya">IIIT Idupulapaya</option>
            <option value="Jammalamadugu">Jammalamadugu</option>
            <option value="Kadapa">Kadapa</option>
            <option value="Kadiri">Kadiri</option>
            <option value="Kalyandurg">Kalyandurg</option>
            <option value="Kamalapuram">Kamalapuram</option>
            <option value="Lepakshi">Lepakshi</option>
            <option value="Madakasira">Madakasira</option>
            <option value="Mydukur">Mydukur</option>
            <option value="Pamidi">Pamidi</option>
            <option value="Penukonda">Penukonda</option>
            <option value="Proddatur">Proddatur</option>
            <option value="Pulivendula">Pulivendula</option>
            <option value="Puttaparthi">Puttaparthi</option>
            <option value="Rayadurg">Rayadurg</option>
            <option value="Rolla">Rolla</option>
            <option value="Tadpatri">Tadpatri</option>
            <option value="Uravakonda">Uravakonda</option>
            <option value="Vempalli">Vempalli</option>
            <option value="Yerraguntla">Yerraguntla</option>
            <option value="Yogi Vemana University Campus">Yogi Vemana University Campus</option>
            <option value="Sri Krishnadevaraya University (SKU)">Sri Krishnadevaraya University (SKU)</option>
            <option value="Central University (CU)">Central University (CU)</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* RECOMMENDATION */}
        <div className="col-12 col-md-6">
          <label htmlFor="recommendedByRole" className="form-label">Recommended By *</label>
          <select
            id="recommendedByRole"
            name="recommendedByRole"
            className="form-select"
            value={form.recommendedByRole}
            onChange={handle}
            required
          >
            <option value="">Choose</option>
            <option value="EGF Secretary">EGF Secretary</option>
            <option value="Senior Advisor">Senior Advisor</option>
            <option value="Staff Worker">Staff Worker</option>
            <option value="District Coordinator">District Coordinator</option>
            <option value="Regional Coordinator">Regional Coordinator</option>
          </select>
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="recommenderContact" className="form-label">Recommended Person’s Contact  *</label>
          <input
            id="recommenderContact"
            name="recommenderContact"
            className="form-control"
            value={form.recommenderContact}
            onChange={handle}
            required
          />
        </div>

        {/* GROUP TYPE */}
        <div className="col-12 col-md-6">
          <label htmlFor="groupType" className="form-label">Which group do you belong to? *</label>
          <select
            id="groupType"
            name="groupType"
            className="form-select"
            value={form.groupType}
            onChange={handle}
            required
          >
            <option value="">Select</option>
            <option value="Family">Family</option>
            <option value="Single Graduate (Employed)">Single Graduate (Employed)</option>
            <option value="Single Graduate (Unemployed)">Single Graduate (Unemployed)</option>
            <option value="Graduates' children (15+)">Graduates' children (15+)</option>
            <option value="Students">Students</option>
            <option value="Volunteers">Volunteers</option>
          </select>
        </div>
        
                      {/* MARITAL STATUS */}
        <div className="col-12 col-md-6">
         <label htmlFor="maritalStatus" className="form-label">Marital Status *</label>
         <select
          id="maritalStatus"
          name="maritalStatus"
          className="form-select"
          value={form.maritalStatus}
          onChange={handle}
          required
        >
         <option value="">Select</option>
         <option value="Married - Attending with Family">Married - Attending with Family</option>
         <option value="Married - Single">Married - Single</option>
         <option value="Unmarried">Unmarried</option>
         </select>
        </div>

        {/* FAMILY GROUP CONDITIONAL BLOCK */}
        {form.groupType === "Family" && (
          <>

            {/* SPOUSE */}
            <div className="col-12 col-md-6">
              <label htmlFor="spouseAttending" className="form-label">Is your spouse attending SPICON-2026?</label>
              <select
                id="spouseAttending"
                name="spouseAttending"
                className="form-select"
                value={form.spouseAttending}
                onChange={handle}
              >
                <option value="">Select</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {form.spouseAttending === "Yes" && (
              <div className="col-12 col-md-6">
                <label htmlFor="spouseName" className="form-label">Spouse Name</label>
                <input
                  id="spouseName"
                  name="spouseName"
                  className="form-control"
                  value={form.spouseName}
                  onChange={handle}
                />
              </div>
            )}

            {/* CHILDREN BELOW 10 */}
            <div className="col-12 col-md-6">
              <label htmlFor="childBelow10Count" className="form-label">No. of children less than 10 years old attending conference SPICON -2026</label>
              <input
                id="childBelow10Count"
                name="childBelow10Count"
                className="form-control"
                value={form.childBelow10Count}
                onChange={handle}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="childBelow10Names" className="form-label">Names of children less than 10 years old attending conference SPICON -2026</label>
              <input
                id="childBelow10Names"
                name="childBelow10Names"
                className="form-control"
                value={form.childBelow10Names}
                onChange={handle}
              />
            </div>

            {/* CHILDREN 10–14 */}
            <div className="col-12 col-md-6">
              <label htmlFor="child10to14Count" className="form-label">No. of Children 10–14 years old attending conference SPICON -2026</label>
              <input
                id="child10to14Count"
                name="child10to14Count"
                className="form-control"
                value={form.child10to14Count}
                onChange={handle}
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="child10to14Names" className="form-label">Names of children 10–14 years old attending conference SPICON -2026</label>
              <input
                id="child10to14Names"
                name="child10to14Names"
                className="form-control"
                value={form.child10to14Names}
                onChange={handle}
              />
            </div>

            {/* TOTAL FAMILY COUNT */}
            <div className="col-12">
              <label htmlFor="totalFamilyMembers" className="form-label">Total family members attending (Including children’s)  *</label>
              <input
                id="totalFamilyMembers"
                name="totalFamilyMembers"
                className="form-control"
                value={form.totalFamilyMembers}
                onChange={handle}
                required
              />
            </div>

            {/* OTHER DELEGATES */}
            <div className="col-12">
              <label htmlFor="delegatesOther" className="form-label">Names of others (Servant Girls/Helpers)</label>
              <textarea
                id="delegatesOther"
                name="delegatesOther"
                className="form-control"
                value={form.delegatesOther}
                onChange={handle}
              ></textarea>
            </div>
          </>
        )}
        
        {/* --- EXISTING ACCOUNT DETAILS SECTION --- */}
        <div className="col-12 mt-4">
         <hr className="mb-3" />
         <h5 className="fw-bold mb-3">Account Details</h5>

        <div className="p-3" style={{ background: "#f8f9fa", borderRadius: "5px" }}>
         <p className="mb-2"><strong>Account Holder Name :</strong> Mr. Jagatap Jagan</p>
         <p className="mb-2"><strong>Account No :</strong> 44676705721</p>
         <p className="mb-2"><strong>IFSC Code :</strong> SBIN0012674</p>
         <p className="mb-2"><strong>UPI ID :</strong> 7396541571-3@ybl </p>
        <p className="mb-2"><strong>PhonePe / Google Pay Number :</strong><br/> 73965 41571 </p>

        {/* QR CODE IMAGES ROW */}
        <div className="row justify-content-center align-items-center mt-3 gx-4">
          <div className="col-6 col-sm-4 col-md-2 text-center">
           <img
            src={WestGooglePayQR}
            alt="Google Pay QR"
            style={{ maxWidth: "150px", width: "100%", height: "auto", objectFit: "contain" }}
          />
          <p className="text-center mt-2 fw-bold">Google Pay</p>
        </div>

        <div className="col-6 col-sm-4 col-md-2 text-center">
          <img
            src={WestPhonePayQR}
            alt="PhonePe QR"
            style={{ maxWidth: "150px", width: "100%", height: "auto", objectFit: "contain" }}
          />
          <p className="text-center mt-2 fw-bold">PhonePe</p>
        </div>
      </div>
    </div>

  <hr className="mt-4" />
</div>
{/* --- END OF ACCOUNT DETAILS SECTION --- */}
    

        <p className="text-danger fw-bold mt-3">
  NOTE: Minimum 50% of the total amount must be paid for the registration to be accepted.
</p>
                {/* PAYMENT DETAILS */}
        <div className="col-12 col-md-6">
          <label htmlFor="amountPaid" className="form-label">Amount Paid *</label>
          <input
            id="amountPaid"
            name="amountPaid"
            type="number"
            min="0"
            className="form-control"
            value={form.amountPaid}
            onChange={handle}
            required
          />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="paymentMode2" className="form-label">Mode of Payment *</label>
          <select
            id="paymentMode2"
            name="paymentMode2"
            className="form-select"
            value={form.paymentMode2}
            onChange={handle}
          >
            <option value="">Select</option>
            <option value="Net Banking">Net Banking</option>
            <option value="Google Pay">Google Pay</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* DATE OF PAYMENT */}
        <div className="col-12 col-md-6">
          <label htmlFor="dateOfPayment">Date of Payment *</label>
          <input
            id="dateOfPayment"
            type="date"
            name="dateOfPayment"
            className="form-control"
            value={form.dateOfPayment}
            onChange={handle}
            required
          />
        </div>

        {/* TRANSACTION ID */}
        <div className="col-12 col-md-6">
          <label htmlFor="transactionId">Transaction ID *</label>
          <input
            id="transactionId"
            name="transactionId"
            className="form-control"
            value={form.transactionId}
            onChange={handle}
            required
          />
        </div>

        {/* SCREENSHOT UPLOAD */}
        <div className="col-12">
          <label htmlFor="screenshot" className="form-label">Upload Payment Screenshot *</label>
          <input
            id="screenshot"
            type="file"
            className="form-control"
            accept="image/*"
            required
            onChange={(e) => setScreenshot(e.target.files[0])}
          />
        </div>


        {/* ARRIVAL TIME */}
        <div className="col-12 col-md-6">
          <label htmlFor="arrivalTime" className="form-label">Your Arrival time on 11/01/26  *</label>
          <select
            id="arrivalTime"
            name="arrivalTime"
            className="form-select"
            value={form.arrivalTime}
            onChange={handle}
            required
          >
            <option value="">Select</option>
            <option value="Morning">Morning</option>
            <option value="Afternoon">Afternoon</option>
            <option value="Evening">Evening</option>
          </select>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="col-12 text-center">
          <button className="btn btn-primary px-5" disabled={loading}>
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </div>
      </form>

      {/* FULL SCREEN LOADER */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="spinner-border text-primary"
            role="status"
            style={{ width: "4rem", height: "4rem" }}
          ></div>
        </div>
      )}
    </div>
  );
}
