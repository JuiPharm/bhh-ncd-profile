# BHH NCD Profile User Guide

This guide describes how to operate the **BHH NCD Profile** chronic patient monitoring system.

---

## 1. Initial Login
1. Open the application URL.
2. Sign in using the default admin credentials:
   - **Email**: `admin@bhh.local`
   - **Password**: `Admin123!`
3. **Important**: Change this default password immediately after logging in by visiting the **Users** tab (Admin role required) and clicking **Reset Pass** next to the administrator row.

---

## 2. Registering a Patient (HN Rules)
HN (Hospital Number) format verification is strictly enforced:
- Must start with `07`.
- Must contain exactly 10 digits.
- The interface automatically formats the input while typing (e.g., `0712345678` formats to `07-12-345678`).
- Invalid HN values are rejected by the validation schema, blocking database submissions.

---

## 3. Searching the Registry
On the **Patients** page, you can search patient registries:
- Enter an HN (e.g., `07-21-014465`), partial name, or phone number in the search bar.
- Use the **Diagnosis Registry** filter dropdown to view only patients with a specific chronic NCD condition (e.g., `DM` or `HT`).

---

## 4. Batch Clinical Labs Entry
To log new observation records:
1. Open the patient's detail profile page.
2. Select the **Clinical Labs** tab.
3. Choose the **Observation Date** and enter any notes.
4. Input the values (SBP, DBP, Weight, BMI, HbA1c, LDL, Glucose, Uric Acid, Creatinine).
   - *Tip*: Enter **Height (cm)** and **Weight (kg)** to automatically calculate the patient's **BMI**.
5. Leaving a field blank excludes it from saving; only populated fields are created in the database.
6. Click **Save Observations**. The system automatically creates separate database rows with matching clinical units:
   - SBP / DBP: `mmHg`
   - Weight: `kg`
   - BMI: `kg/m2`
   - HbA1c: `%`
   - LDL / Glucose / Uric Acid / Creatinine: `mg/dL`

---

## 5. Setting and Checking Goal Statuses
On the **Goal Targets** tab, you can set NCD treatment goals:
- Use presets (e.g., `HbA1c < 7 %`, `SBP < 140 mmHg`) or configure custom conditions (e.g. `Weight <= 75 kg`).
- The system automatically compares the patient's latest clinical observation against active goals and reports:
  - **Achieved**: The latest value matches the target operator comparison.
  - **Not achieved**: The latest value violates the target comparison.
  - **No recent data**: The patient has no record matching that observation type.

---

## 6. Secure Profile Sharing (PDPA)
For sharing a patient's clinical summary:
1. Open the patient's profile and go to the **Share Profile** tab.
2. Click **Generate Share Link**.
3. Review the Thai PDPA privacy disclaimer with the patient.
4. Check the **Consent Provided** check box to record patient consent in the `patient_consents` table.
5. Select link expiry days (1, 7, or 30 days) and click **Confirm and Generate**.
6. Copy the **Share Link** and the **Security PIN**.
7. **Security Warning**: Send the link and the PIN through separate channels (e.g. SMS for PIN, Line for Link) to ensure secure patient-specific verification.
8. The shared link opens a read-only screen that displays only that patient's health parameters, with no access to other registries.
