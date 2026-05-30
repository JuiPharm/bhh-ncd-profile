# Google Sheets Setup Guide

This guide explains how to set up the Google Sheets database for the **BHH NCD Profile** application.

## Quick Install (Automatic)

You do **not** need to manually create all the tabs and columns. The system has an automated setup installer that handles sheet creation non-destructively.

1. Create a brand new Google Sheet under your Google Drive.
2. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
3. Follow the steps in [GOOGLE_APPS_SCRIPT_DEPLOY.md](GOOGLE_APPS_SCRIPT_DEPLOY.md) to set up the script backend.
4. Once deployed, the Web App's `setup.install` API call creates all necessary sheets, freezes headers, applies validation lists, formats the `patients.hn` column as plain text, and registers a default administrator user.

---

## Schema Overview

If you choose to inspect or pre-populate the spreadsheet, here are the table names and their column headers:

### 1. `patients`
Core patient demographic details.
- **Columns**: `id`, `hn`, `first_name`, `last_name`, `dob`, `gender`, `blood_group`, `phone`, `line_id`, `address`, `emergency_contact`, `primary_physician`, `created_at`, `updated_at`
- **Important**: The `hn` column must be formatted as **Plain Text** (`setNumberFormat('@')`) so leading zeros are preserved.

### 2. `diagnoses`
Registry of chronic diseases.
- **Columns**: `id`, `patient_id`, `icd10`, `diagnosis_name`, `diagnosis_detail`, `active`, `diagnosed_date`, `created_at`, `updated_at`

### 3. `medications`
Active prescriptions list.
- **Columns**: `id`, `patient_id`, `generic_name`, `brand_name`, `strength`, `dosage`, `frequency`, `indication`, `start_date`, `stop_date`, `active`, `created_at`, `updated_at`

### 4. `allergies`
Drug and food allergies.
- **Columns**: `id`, `patient_id`, `allergen`, `reaction`, `severity`, `created_at`, `updated_at`

### 5. `goals`
Target levels for vitals and measurements.
- **Columns**: `id`, `patient_id`, `goal_type`, `target_operator`, `target_value`, `target_unit`, `active`, `created_at`, `updated_at`

### 6. `observations`
Vitals logging (BP, weight, HbA1c, LDL, etc.).
- **Columns**: `id`, `patient_id`, `observation_type`, `value`, `unit`, `observation_date`, `notes`, `created_at`, `updated_at`

### 7. `users`
Clinic staff credentials.
- **Columns**: `id`, `email`, `name`, `password_hash`, `role`, `active`, `created_at`, `updated_at`
- **Security**: Plain text passwords are **never** stored. Passwords are saved as a SHA-256 hash.

### 8. `patient_share_tokens`
PDPA secure patient portal credentials.
- **Columns**: `id`, `patient_id`, `token_hash`, `pin_hash`, `scope`, `expires_at`, `revoked`, `created_by`, `created_at`, `last_access_at`, `access_count`

### 9. `patient_consents`
Patient consent ledger (Thai version).
- **Columns**: `id`, `patient_id`, `consent_type`, `consent_status`, `consent_text_version`, `given_by`, `given_at`, `expired_at`, `notes`

### 10. `profile_access_logs`
Access logs for patient-shared portals.
- **Columns**: `id`, `patient_id`, `share_token_id`, `accessed_at`, `ip_hint`, `user_agent`, `result`

### 11. `audit_logs`
Tracking updates and deletes.
- **Columns**: `id`, `user`, `action`, `table_name`, `record_id`, `timestamp`

### 12. `_lists`
Configuration dropdown listings.
- **Columns**: `list_name`, `value`, `label`, `sort_order`, `active`
