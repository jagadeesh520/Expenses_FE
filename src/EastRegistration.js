// src/EastRegistration.js (DESIGN-RESTORED)
import React, { useState } from "react";
import logo from "./Assests/logo.PNG";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import EastRayaUPI from "./Assests/eastrayalaseemaupi.png";

export default function EastRegistration() {
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
    maritalStatus: "",
  };

  const [form, setForm] = useState(initial);
  const [screenshot, setScreenshot] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

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

    // IMPORTANT: Identifier for East Region
    fd.append("region", "East Rayalaseema");

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
      navigate("/registration-success", {
        state: {
          region: "East Rayalaseema",
          email: form.email,
          fullName: form.fullName
        },
      });
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // navigation unmounts component, so no setLoading(false) here on success
  };

  return (
    <div className="container py-4">
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => navigate("/")}
      >
        &larr; Back to Home
      </button>

      {/* SUCCESS / ERROR MESSAGE */}
      {message && (
        <div
          className={`alert text-center ${
            messageType === "success" ? "alert-success" : "alert-danger"
          }`}
          role="alert"
        >
          {message}
        </div>
      )}

      {/* SPICON HEADER SECTION - EAST */}
      <div className="text-center mb-4">
        <img
          src={logo}
          alt="SPICON Logo"
          style={{ width: "120px", marginBottom: "15px" }}
        />

        <h2 className="fw-bold mb-2">
          EAST RAYALASEEMA SPICON-2026 REGISTRATION FORM
        </h2>

        {/* Venue placeholders kept as user did not provide specific venue info yet */}
        <p className="mb-1">
          <strong>Dates:</strong> 10<sup>th</sup> 5pm to 13<sup>th</sup> 1:00pm
          January 2026
        </p>
        <p className="mb-1">
          <strong>Venue:</strong> Wisdom CBSE High school,
        </p>
        <p className="mb-3">
          koduru,
          <br />
          Annamayya District
        </p>

        <hr />

        <h5 className="fw-bold mt-3">Who can attend?</h5>
        <ul className="text-start mx-auto" style={{ maxWidth: "800px" }}>
          <li>
            Students with Born-again experience, D.T. Camp attended and with
            recommendation.
          </li>
          <li>Graduates involving in student ministry and with recommendation.</li>
          <li>
            Only authenticated registrations will be added to the SPICON-2026
            East Rayalseema Delegates WhatsApp group.
          </li>
        </ul>

        <p className="fw-bold mt-2">This is a sign that your registration is confirmed.</p>

        <p className="mt-3">
          <strong>Last date for registration:</strong>
          <br />
          Dec 22, 2025 – 11:59 PM
        </p>

        <p className="text-danger fw-bold">
          NOTE: Spot registrations will not be allowed under any circumstances.
        </p>

        <hr />

        <h5 className="fw-bold">Registration Details</h5>
        <ul className="text-start mx-auto" style={{ maxWidth: "800px" }}>
          <li>Students – ₹500</li>
          <li>Unemployed Graduate – ₹500</li>
          <li>Employed Graduate – ₹1300</li>
          <li>Graduate Family(Single Employed) – ₹2000</li>
          <li>Graduate Family(Doubled Employed) – ₹2500</li>
          <li>Children above 15 years – ₹500</li>
          <li>Volunteers – ₹200</li>
        </ul>
        <p>
          <span className="fw-bold">NOTE:</span>
        </p>
        <div>1. Children above 15 years old must be registered separately</div>
        <div>2. Pensioners and Business people are treated as employees.</div>
        <div>
          3. Students attending under volunteers’ kota should reach the venue by
          8am on 10/01/26 and leave the campus after the completion of physical
          works in venue.
        </div>

        <p className="fw-bold mt-3">For any queries, please contact:</p>

        <p>
          <strong>M.MAHESH, Madanapalle</strong>
          <br />
          9491383584
        </p>

        <hr className="mb-4" />
      </div>

      {/* FORM START */}
      <form className="row g-3" onSubmit={handleSubmit}>
        {/* EMAIL */}
        <div className="col-12 col-md-6">
          <label htmlFor="email" className="form-label">
            Email *
          </label>
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
          <label htmlFor="title" className="form-label">
            Title (గౌరవ సంబోధన)
          </label>
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
          <label htmlFor="fullName" className="form-label">
            Enter Full Name *
          </label>
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
          <label htmlFor="surname" className="form-label">
            Surname *
          </label>
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
          <label htmlFor="gender" className="form-label">
            Gender *
          </label>
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
            <option value="Other">Other</option>
          </select>
        </div>

        {/* AGE */}
        <div className="col-12 col-md-6">
          <label htmlFor="age" className="form-label">
            Your Age *
          </label>
          <input
            id="age"
            name="age"
            type="number"
            className="form-control"
            min="1"
            value={form.age}
            onChange={handle}
            required
          />
        </div>

        {/* DTC ATTENDED */}
        <div className="col-12 col-md-6">
          <label htmlFor="dtcAttended" className="form-label">
            Have you attended DT Camp? *
          </label>
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
              <label htmlFor="dtcWhen" className="form-label">
                When did you attend your first DT Camp? *
              </label>
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
              <label htmlFor="dtcWhere" className="form-label">
                Where did you attend first DT Camp? *
              </label>
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
          <label htmlFor="mobile" className="form-label">
            Mobile Number *
          </label>
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
          <label htmlFor="district" className="form-label">
            District *
          </label>
          <select
            id="district"
            name="district"
            className="form-select"
            value={form.district}
            onChange={handle}
            required
          >
            <option value="">Select</option>
            <option value="Annamayya">Annamayya</option>
            <option value="Chittoor">Chittoor</option>
            <option value="Tirupati">Tirupati</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* ICEU / EGF */}
        <div className="col-12 col-md-6">
          <label htmlFor="iceuEgf" className="form-label">
            Which ICEU / EGF do you belong to? *
          </label>
          <select
            id="iceuEgf"
            name="iceuEgf"
            className="form-select"
            value={form.iceuEgf}
            onChange={handle}
            required
          >
            <option value="">Choose</option>
            <option value="Koduru">Koduru</option>
            <option value="Rajampeta">Rajampeta</option>
            <option value="Madanapalle">Madanapalle</option>
            <option value="Rayachoti">Rayachoti</option>
            <option value="Kalikiri">Kalikiri</option>
            <option value="Pileru">Pileru</option>
            <option value="Chittoor">Chittoor</option>
            <option value="Punganoor">Punganoor</option>
            <option value="Palamaneru">Palamaneru</option>
            <option value="Kuppam">Kuppam</option>
            <option value="V.Kota">V.Kota</option>
            <option value="Tirupati">Tirupati</option>
            <option value="Renigunta">Renigunta</option>
            <option value="Sattivedu">Sattivedu</option>
            <option value="Srikalahasthi">Srikalahasthi</option>
            <option value="Naidupeta">Naidupeta</option>
            <option value="Sullurpeta">Sullurpeta</option>
            <option value="Gudur">Gudur</option>
            <option value="Venkatagiri">Venkatagiri</option>
            <option value="Pakala">Pakala</option>
            <option value="Puttoor">Puttoor</option>
            <option value="IIT-Tirupati">IIT-Tirupati</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* RECOMMENDATION */}
        <div className="col-12 col-md-6">
          <label htmlFor="recommendedByRole" className="form-label">
            Recommended By *
          </label>
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
          <label htmlFor="recommenderContact" className="form-label">
            Recommended Person’s Contact *
          </label>
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
          <label htmlFor="groupType" className="form-label">
            Which group do you belong to? *
          </label>
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
            <option value="Single Graduate (Employed)">
              Single Graduate (Employed)
            </option>
            <option value="Single Graduate (Unemployed)">
              Single Graduate (Unemployed)
            </option>
            <option value="Graduates' children (15+)">
              Graduates' children (15+)
            </option>
            <option value="Students">Students</option>
            <option value="Volunteers">Volunteers</option>
          </select>
        </div>

        {/* MARITAL STATUS */}
        <div className="col-12 col-md-6">
          <label htmlFor="maritalStatus" className="form-label">
            Marital Status *
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            className="form-select"
            value={form.maritalStatus}
            onChange={handle}
            required
          >
            <option value="">Select</option>
            <option value="Married - Attending with Family">
              Married - Attending with Family
            </option>
            <option value="Married - Single">Married - Single</option>
            <option value="Unmarried">Unmarried</option>
          </select>
        </div>

        {/* FAMILY GROUP CONDITIONAL BLOCK */}
        {form.groupType === "Family" && (
          <>
            {/* SPOUSE */}
            <div className="col-12 col-md-6">
              <label htmlFor="spouseAttending" className="form-label">
                Is your spouse attending SPICON-2026?
              </label>
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
                <label htmlFor="spouseName" className="form-label">
                  Spouse Name
                </label>
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
              <label className="form-label">
                No. of children less than 10 years old attending conference SPICON -2026
              </label>
              <input
                name="childBelow10Count"
                className="form-control"
                value={form.childBelow10Count}
                onChange={handle}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">
                Names of children less than 10 years old attending conference SPICON -2026
              </label>
              <input
                name="childBelow10Names"
                className="form-control"
                value={form.childBelow10Names}
                onChange={handle}
              />
            </div>

            {/* CHILDREN 10–14 */}
            <div className="col-12 col-md-6">
              <label className="form-label">
                No. of Children 10–14 years old attending conference SPICON -2026
              </label>
              <input
                name="child10to14Count"
                className="form-control"
                value={form.child10to14Count}
                onChange={handle}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">
                Names of children 10–14 years old attending conference SPICON -2026
              </label>
              <input
                name="child10to14Names"
                className="form-control"
                value={form.child10to14Names}
                onChange={handle}
              />
            </div>

            {/* TOTAL FAMILY COUNT */}
            <div className="col-12">
              <label htmlFor="totalFamilyMembers" className="form-label">
                Total family members attending (Including children’s) *
              </label>
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
              <label className="form-label">Names of others (Servant Girls/Helpers)</label>
              <textarea
                name="delegatesOther"
                className="form-control"
                value={form.delegatesOther}
                onChange={handle}
              ></textarea>
            </div>
          </>
        )}

        <div className="col-12 mt-4">
          <hr className="mb-3" />
          <h5 className="fw-bold mb-3">Account Details (EAST)</h5>

          <div className="p-3" style={{ background: "#f8f9fa", borderRadius: "5px" }}>
            <p className="mb-2">
              <strong>Account Holder Name :</strong> Janga Sumalatha
            </p>
            <p className="mb-2">
              <strong>Account No :</strong> 62112258352
            </p>
            <p className="mb-2">
              <strong>IFSC Code :</strong> SBIN0021040
            </p>
            <p className="mb-2">
              <strong>Branch Name :</strong> SBI-NAIDUPET
            </p>
            <p className="mb-2">
              <strong>Phone Pay Number :</strong> 9885108525
            </p>

            {/* UPI Scanner Image */}
            <div className="text-center mt-3">
              <img
                src={EastRayaUPI}
                alt="UPI Scanner"
                style={{ width: "200px", borderRadius: "10px" }}
              />
              <p className="mt-2">Scan this UPI QR to make the payment</p>
            </div>
          </div>

          <hr className="mt-4" />
        </div>

        <p className="text-danger fw-bold mt-3">
          NOTE: Minimum 50% of the total amount must be paid for the registration to be accepted.
        </p>

        {/* PAYMENT DETAILS */}
        <div className="col-12 col-md-6">
          <label htmlFor="amountPaid" className="form-label">
            Amount Paid *
          </label>
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
          <label htmlFor="paymentMode2" className="form-label">
            Mode of Payment *
          </label>
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
          <label className="form-label">Upload Payment Screenshot *</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            required
            onChange={(e) => setScreenshot(e.target.files[0])}
          />
        </div>

        {/* ARRIVAL TIME */}
        <div className="col-12 col-md-6">
          <label htmlFor="arrivalTime" className="form-label">
            Your Arrival time on 10/01/26 *
          </label>
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
            {loading ? "Submitting..." : "Submit Registration "}
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
