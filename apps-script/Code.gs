// =========================================================================
// BHH NCD PROFILE - Google Apps Script Backend (Code.gs)
// =========================================================================

// Spreadsheet schemas mapping sheet name to columns
const SHEET_SCHEMAS = {
  patients: [
    'id', 'hn', 'first_name', 'last_name', 'dob', 'gender', 'blood_group',
    'phone', 'line_id', 'address', 'emergency_contact', 'primary_physician',
    'created_at', 'updated_at'
  ],
  diagnoses: [
    'id', 'patient_id', 'icd10', 'diagnosis_name', 'diagnosis_detail',
    'active', 'diagnosed_date', 'created_at', 'updated_at'
  ],
  medications: [
    'id', 'patient_id', 'generic_name', 'brand_name', 'strength', 'dosage',
    'frequency', 'indication', 'start_date', 'stop_date', 'active',
    'created_at', 'updated_at'
  ],
  allergies: [
    'id', 'patient_id', 'allergen', 'reaction', 'severity',
    'created_at', 'updated_at'
  ],
  goals: [
    'id', 'patient_id', 'goal_type', 'target_operator', 'target_value',
    'target_unit', 'active', 'created_at', 'updated_at'
  ],
  observations: [
    'id', 'patient_id', 'observation_type', 'value', 'unit',
    'observation_date', 'notes', 'created_at', 'updated_at'
  ],
  visits: [
    'id', 'patient_id', 'visit_date', 'provider', 'visit_type', 'notes',
    'created_at', 'updated_at'
  ],
  benefits: [
    'id', 'patient_id', 'benefit_type', 'annual_limit', 'used_amount',
    'valid_from', 'valid_to', 'created_at', 'updated_at'
  ],
  vaccines: [
    'id', 'patient_id', 'vaccine_name', 'vaccination_date', 'next_due_date',
    'notes', 'created_at', 'updated_at'
  ],
  users: [
    'id', 'email', 'name', 'password_hash', 'role', 'active',
    'created_at', 'updated_at'
  ],
  audit_logs: [
    'id', 'user', 'action', 'table_name', 'record_id', 'timestamp'
  ],
  _lists: [
    'list_name', 'value', 'label', 'sort_order', 'active'
  ],
  patient_share_tokens: [
    'id', 'patient_id', 'token_hash', 'pin_hash', 'scope', 'expires_at',
    'revoked', 'created_by', 'created_at', 'last_access_at', 'access_count'
  ],
  patient_consents: [
    'id', 'patient_id', 'consent_type', 'consent_status',
    'consent_text_version', 'given_by', 'given_at', 'expired_at', 'notes'
  ],
  profile_access_logs: [
    'id', 'patient_id', 'share_token_id', 'accessed_at',
    'ip_hint', 'user_agent', 'result'
  ]
};

// CORS configuration wrapper
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: true, message: message, status: status });
}

// doGet handles read actions
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      return errorResponse("SHEET_ID not set in Script Properties. Run setup first.", 500);
    }
    
    const db = SpreadsheetApp.openById(sheetId);
    
    // Public share actions bypass authentication check
    if (action === "share.getPatientProfile") {
      return handleGetSharedProfile(e, db);
    }

    // Authenticated API request validation
    const sessionToken = e.parameter.session_token;
    const currentUser = validateSession(sessionToken, db);
    if (!currentUser) {
      return errorResponse("Unauthorized session", 401);
    }

    switch (action) {
      case "auth.me":
        return jsonResponse({ success: true, user: currentUser });
        
      case "patients.list":
        return handleListPatients(e, db);
        
      case "patients.get":
        return handleGetPatient(e, db);
        
      case "dashboard.summary":
        return handleDashboardSummary(db);
        
      case "reports.patientSummary":
        return handlePatientReport(e, db);
        
      default:
        return errorResponse("Unknown read action: " + action, 404);
    }
  } catch (error) {
    return errorResponse(error.toString(), 500);
  }
}

// doPost handles write actions
function doPost(e) {
  try {
    if (!e.postData || !e.postData.contents) {
      return errorResponse("No request body provided");
    }
    
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    
    // Handle installer setup action
    if (action === "setup.install") {
      return handleSetupInstall(payload);
    }
    
    if (!sheetId) {
      return errorResponse("SHEET_ID script property is missing. Deploy requires setup.install first.", 500);
    }
    
    const db = SpreadsheetApp.openById(sheetId);
    
    // Login bypasses session check
    if (action === "auth.login") {
      return handleLogin(payload, db);
    }

    // Validate active session
    const currentUser = validateSession(payload.session_token, db);
    if (!currentUser) {
      return errorResponse("Unauthorized session", 401);
    }

    // Check user roles for modify operations
    const userRole = currentUser.role;
    const isViewer = userRole === 'viewer';
    
    if (isViewer && action !== "auth.me") {
      return errorResponse("Permission denied for viewer role", 403);
    }

    switch (action) {
      // Patients
      case "patients.create":
        return handleCreatePatient(payload, db, currentUser);
      case "patients.update":
        return handleUpdatePatient(payload, db, currentUser);
      case "patients.delete":
        if (userRole !== 'admin') return errorResponse("Requires Admin role", 403);
        return handleDeleteRecord('patients', payload.id, db, currentUser);
        
      // Observations
      case "observations.bulkCreate":
        return handleBulkCreate('observations', payload.rows, db, currentUser);
      case "observations.delete":
        return handleDeleteRecord('observations', payload.id, db, currentUser);
        
      // Diagnoses
      case "diagnoses.bulkCreate":
        return handleBulkCreate('diagnoses', payload.rows, db, currentUser);
      case "diagnoses.delete":
        return handleDeleteRecord('diagnoses', payload.id, db, currentUser);
        
      // Medications
      case "medications.bulkCreate":
        return handleBulkCreate('medications', payload.rows, db, currentUser);
      case "medications.delete":
        return handleDeleteRecord('medications', payload.id, db, currentUser);
        
      // Allergies
      case "allergies.bulkCreate":
        return handleBulkCreate('allergies', payload.rows, db, currentUser);
      case "allergies.delete":
        return handleDeleteRecord('allergies', payload.id, db, currentUser);
        
      // Goals
      case "goals.bulkCreate":
        return handleBulkCreate('goals', payload.rows, db, currentUser);
      case "goals.delete":
        return handleDeleteRecord('goals', payload.id, db, currentUser);
        
      // Vaccines
      case "vaccines.bulkCreate":
        return handleBulkCreate('vaccines', payload.rows, db, currentUser);
      case "vaccines.delete":
        return handleDeleteRecord('vaccines', payload.id, db, currentUser);

      // Share Link Module
      case "share.create":
        return handleCreateShareLink(payload, db, currentUser);
      case "share.revoke":
        return handleRevokeShareLink(payload, db, currentUser);

      // Admin Management
      case "admin.auditLogs":
        if (userRole !== 'admin') return errorResponse("Requires Admin role", 403);
        return handleGetAuditLogs(db);
      case "admin.usersList":
        if (userRole !== 'admin') return errorResponse("Requires Admin role", 403);
        return handleGetUsers(db);
      case "admin.createUser":
        if (userRole !== 'admin') return errorResponse("Requires Admin role", 403);
        return handleCreateUser(payload, db, currentUser);
      case "admin.updateUser":
        if (userRole !== 'admin') return errorResponse("Requires Admin role", 403);
        return handleUpdateUser(payload, db, currentUser);
        
      default:
        return errorResponse("Unknown write action: " + action, 404);
    }
  } catch (error) {
    return errorResponse(error.toString(), 500);
  }
}

// Helper to validate HN format
function cleanAndFormatHN(hn) {
  if (!hn) return null;
  // Strip hyphens and spaces
  const clean = hn.toString().replace(/[-\s]/g, '');
  if (!/^07\d{8}$/.test(clean)) {
    return null; // Must start with 07 and contain exactly 10 digits
  }
  return '07-' + clean.substring(2, 4) + '-' + clean.substring(4, 10);
}

// Cryptographic hash function using SHA-256
function sha256(text) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  let hash = '';
  for (let i = 0; i < digest.length; i++) {
    let byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    let byteString = byteVal.toString(16);
    if (byteString.length == 1) byteString = '0' + byteString;
    hash += byteString;
  }
  return hash;
}

// Generate unique ID
function generateUUID() {
  return Utilities.getUuid();
}

// Low-level helper to convert Sheet to JSON Array
function getSheetData(db, sheetName) {
  const sheet = db.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    // Skip empty rows (where first column is empty or row is blank)
    if (values[i][0] === undefined || values[i][0] === null || String(values[i][0]).trim() === "") {
      continue;
    }
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}

// Authenticated session validation
function validateSession(token, db) {
  if (!token) return null;
  // Simple token format: userId:timestamp:signature
  const parts = token.split(':');
  if (parts.length !== 3) return null;
  
  const userId = parts[0];
  const expiresAt = parseInt(parts[1], 10);
  const signature = parts[2];
  
  if (Date.now() > expiresAt) return null; // Expired session
  
  // Recreate signature
  const salt = "BHH_SECURE_SALT_2026";
  const expectedSig = sha256(userId + ":" + expiresAt + ":" + salt);
  if (signature !== expectedSig) return null; // Modified token
  
  const users = getSheetData(db, 'users');
  const user = users.find(u => u.id === userId && u.active === true);
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

// Audit logger
function logAudit(db, user, action, tableName, recordId) {
  try {
    const sheet = db.getSheetByName('audit_logs');
    if (!sheet) return;
    const timestamp = new Date();
    const id = generateUUID();
    sheet.appendRow([id, user.email || 'system', action, tableName, recordId, timestamp]);
  } catch (err) {
    Logger.log("Audit log failed: " + err.toString());
  }
}

// Non-destructive Setup Installer
function handleSetupInstall(payload) {
  const setupKey = PropertiesService.getScriptProperties().getProperty('SETUP_KEY') || 'Admin123!';
  if (payload.setup_key !== setupKey) {
    return errorResponse("Invalid setup key");
  }
  
  let sheetId = payload.sheet_id;
  if (!sheetId) {
    // If not supplied, try to read the active sheet or property
    sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    if (!sheetId) {
      try {
        sheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
      } catch (err) {
        return errorResponse("No Sheet ID provided and no active sheet context found.");
      }
    }
  }
  
  const db = SpreadsheetApp.openById(sheetId);
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheetId);
  
  // Run loop to check and create sheets
  for (const sheetName in SHEET_SCHEMAS) {
    let sheet = db.getSheetByName(sheetName);
    const columns = SHEET_SCHEMAS[sheetName];
    
    if (!sheet) {
      // Create new sheet
      sheet = db.insertSheet(sheetName);
      sheet.appendRow(columns);
      // Freeze header row
      sheet.setFrozenRows(1);
    } else {
      // Non-destructive column sync
      const existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const missingColumns = columns.filter(col => !existingHeaders.includes(col));
      
      if (missingColumns.length > 0) {
        const lastCol = sheet.getLastColumn();
        const range = sheet.getRange(1, lastCol + 1, 1, missingColumns.length);
        range.setValues([missingColumns]);
      }
    }
    
    // Formatting specifics
    if (sheetName === 'patients') {
      // Format HN column (column 2) as text
      const hnColIndex = columns.indexOf('hn') + 1;
      if (hnColIndex > 0) {
        sheet.getRange(2, hnColIndex, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
      }
    }
  }
  
  // Create default admin user if users sheet is empty
  const userSheet = db.getSheetByName('users');
  const userValues = userSheet.getDataRange().getValues();
  if (userValues.length <= 1) {
    const adminId = generateUUID();
    const adminEmail = "admin@bhh.local";
    const passwordHash = sha256("Admin123!" + "admin@bhh.local"); // password salted with email
    const now = new Date();
    
    // Headers: id, email, name, password_hash, role, active, created_at, updated_at
    userSheet.appendRow([adminId, adminEmail, "Default Admin", passwordHash, "admin", true, now, now]);
  }
  
  // Populate dropdowns in _lists if empty
  const listsSheet = db.getSheetByName('_lists');
  if (listsSheet.getDataRange().getValues().length <= 1) {
    const initialLists = [
      ['_lists', 'list_name', 'value', 'label', 'sort_order', 'active'],
      ['gender', 'male', 'Male', 1, true],
      ['gender', 'female', 'Female', 2, true],
      ['gender', 'other', 'Other', 3, true],
      ['blood_group', 'A+', 'A Rh+', 1, true],
      ['blood_group', 'A-', 'A Rh-', 2, true],
      ['blood_group', 'B+', 'B Rh+', 3, true],
      ['blood_group', 'B-', 'B Rh-', 4, true],
      ['blood_group', 'O+', 'O Rh+', 5, true],
      ['blood_group', 'O-', 'O Rh-', 6, true],
      ['blood_group', 'AB+', 'AB Rh+', 7, true],
      ['blood_group', 'AB-', 'AB Rh-', 8, true],
      ['observation_type', 'SBP', 'Systolic BP', 1, true],
      ['observation_type', 'DBP', 'Diastolic BP', 2, true],
      ['observation_type', 'Weight', 'Body Weight', 3, true],
      ['observation_type', 'BMI', 'Body Mass Index', 4, true],
      ['observation_type', 'HbA1c', 'HbA1c', 5, true],
      ['observation_type', 'LDL', 'LDL Cholesterol', 6, true],
      ['observation_type', 'Glucose', 'POCT Glucose', 7, true],
      ['observation_type', 'Uric Acid', 'Uric Acid', 8, true],
      ['observation_type', 'Creatinine', 'Serum Creatinine', 9, true],
      ['allergy_severity', 'Unknown', 'Unknown', 1, true],
      ['allergy_severity', 'Mild', 'Mild', 2, true],
      ['allergy_severity', 'Moderate', 'Moderate', 3, true],
      ['allergy_severity', 'Severe', 'Severe', 4, true],
      ['role', 'admin', 'Administrator', 1, true],
      ['role', 'doctor', 'Doctor', 2, true],
      ['role', 'nurse', 'Nurse', 3, true],
      ['role', 'staff', 'Staff', 4, true],
      ['role', 'viewer', 'Viewer', 5, true]
    ];
    
    // Clear list sheet and write initial data
    listsSheet.clearContents();
    initialLists.forEach(row => listsSheet.appendRow(row));
  }
  
  logAudit(db, { email: 'system' }, 'setup.install', 'all', sheetId);
  
  return jsonResponse({ success: true, message: "Database schema configured successfully." });
}

// User Authentication (Login)
function handleLogin(payload, db) {
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';
  
  if (!email || !password) {
    return errorResponse("Email and Password are required");
  }
  
  const users = getSheetData(db, 'users');
  const user = users.find(u => u.email.toLowerCase() === email);
  
  if (!user || user.active === false) {
    return errorResponse("Invalid email or password");
  }
  
  // Salt password with email and verify hash
  const expectedHash = sha256(password + email);
  if (user.password_hash !== expectedHash) {
    return errorResponse("Invalid email or password");
  }
  
  // Create Session Token
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours expiry
  const salt = "BHH_SECURE_SALT_2026";
  const signature = sha256(user.id + ":" + expiresAt + ":" + salt);
  const sessionToken = user.id + ":" + expiresAt + ":" + signature;
  
  logAudit(db, user, 'auth.login', 'users', user.id);
  
  return jsonResponse({
    success: true,
    session_token: sessionToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}

// Patients List (Search and filter)
function handleListPatients(e, db) {
  const patients = getSheetData(db, 'patients');
  const diagnoses = getSheetData(db, 'diagnoses');
  
  const search = (e.parameter.search || '').toLowerCase().trim();
  const diagnosisFilter = (e.parameter.diagnosis || '').toLowerCase().trim();
  
  let filtered = patients;
  
  // Apply Search (HN, Name, Phone)
  if (search) {
    filtered = filtered.filter(p => {
      const hnMatch = p.hn && p.hn.toLowerCase().includes(search);
      const nameMatch = (p.first_name + ' ' + p.last_name).toLowerCase().includes(search);
      const phoneMatch = p.phone && p.phone.toLowerCase().includes(search);
      return hnMatch || nameMatch || phoneMatch;
    });
  }
  
  // Apply NCD diagnosis filter
  if (diagnosisFilter) {
    const patientIdsWithDiagnosis = new Set(
      diagnoses
        .filter(d => d.active === true && String(d.diagnosis_name || '').toLowerCase().includes(diagnosisFilter))
        .map(d => d.patient_id)
    );
    filtered = filtered.filter(p => patientIdsWithDiagnosis.has(p.id));
  }
  
  // Sort by name
  filtered.sort((a, b) => (a.first_name + ' ' + a.last_name).localeCompare(b.first_name + ' ' + b.last_name));
  
  return jsonResponse({ success: true, patients: filtered });
}

// Patient Detail Page Fetcher
function handleGetPatient(e, db) {
  const patientId = e.parameter.id;
  if (!patientId) return errorResponse("Patient ID is required");
  
  const patients = getSheetData(db, 'patients');
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return errorResponse("Patient not found", 404);
  
  // Fetch clinical modules
  const diagnoses = getSheetData(db, 'diagnoses').filter(d => d.patient_id === patientId);
  const medications = getSheetData(db, 'medications').filter(m => m.patient_id === patientId);
  const allergies = getSheetData(db, 'allergies').filter(a => a.patient_id === patientId);
  const goals = getSheetData(db, 'goals').filter(g => g.patient_id === patientId);
  const observations = getSheetData(db, 'observations').filter(o => o.patient_id === patientId);
  const vaccines = getSheetData(db, 'vaccines').filter(v => v.patient_id === patientId);
  const consents = getSheetData(db, 'patient_consents').filter(c => c.patient_id === patientId);
  const shareTokens = getSheetData(db, 'patient_share_tokens').filter(s => s.patient_id === patientId);
  const benefits = getSheetData(db, 'benefits').filter(b => b.patient_id === patientId);

  return jsonResponse({
    success: true,
    patient: patient,
    diagnoses: diagnoses,
    medications: medications,
    allergies: allergies,
    goals: goals,
    observations: observations,
    vaccines: vaccines,
    consents: consents,
    shareTokens: shareTokens.map(s => ({
      id: s.id,
      scope: s.scope,
      expires_at: s.expires_at,
      revoked: s.revoked,
      access_count: s.access_count,
      created_at: s.created_at,
      last_access_at: s.last_access_at
    })),
    benefits: benefits
  });
}

// Create Patient Record
function handleCreatePatient(payload, db, currentUser) {
  const hn = cleanAndFormatHN(payload.hn);
  if (!hn) {
    return errorResponse("Invalid Hospital Number (HN). Must start with 07 and contain 10 digits total.");
  }
  
  const sheet = db.getSheetByName('patients');
  const patients = getSheetData(db, 'patients');
  
  // Duplicate check
  if (patients.some(p => p.hn === hn)) {
    return errorResponse("Patient with this HN already exists");
  }
  
  const id = generateUUID();
  const now = new Date();
  
  // Header: id, hn, first_name, last_name, dob, gender, blood_group, phone, line_id, address, emergency_contact, primary_physician, created_at, updated_at
  const rowData = [
    id,
    hn,
    payload.first_name,
    payload.last_name,
    payload.dob, // YYYY-MM-DD
    payload.gender,
    payload.blood_group,
    payload.phone,
    payload.line_id,
    payload.address,
    payload.emergency_contact,
    payload.primary_physician,
    now,
    now
  ];
  
  sheet.appendRow(rowData);
  logAudit(db, currentUser, 'patients.create', 'patients', id);
  
  return jsonResponse({ success: true, id: id, hn: hn });
}

// Update Patient Record
function handleUpdatePatient(payload, db, currentUser) {
  const patientId = payload.id;
  if (!patientId) return errorResponse("Patient ID is required");
  
  const hn = cleanAndFormatHN(payload.hn);
  if (!hn) {
    return errorResponse("Invalid Hospital Number (HN).");
  }
  
  const sheet = db.getSheetByName('patients');
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === patientId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return errorResponse("Patient not found", 404);
  }
  
  // Make sure HN is unique if edited
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] !== patientId && values[i][1] === hn) {
      return errorResponse("Another patient with this HN already exists");
    }
  }
  
  const now = new Date();
  const updateData = { ...payload, hn: hn, updated_at: now };
  
  // Write updated columns to row
  for (let col = 1; col <= headers.length; col++) {
    const colName = headers[col - 1];
    if (colName !== 'id' && colName !== 'created_at' && updateData[colName] !== undefined) {
      sheet.getRange(rowIndex, col).setValue(updateData[colName]);
    }
  }
  
  // Always update updated_at
  const updatedAtCol = headers.indexOf('updated_at') + 1;
  if (updatedAtCol > 0) {
    sheet.getRange(rowIndex, updatedAtCol).setValue(now);
  }
  
  logAudit(db, currentUser, 'patients.update', 'patients', patientId);
  return jsonResponse({ success: true, id: patientId });
}

// Universal Record Deletion Helper (Soft delete or hard delete. Since clinic database, hard delete is simple unless specified)
function handleDeleteRecord(sheetName, recordId, db, currentUser) {
  if (!recordId) return errorResponse("Record ID is required");
  
  const sheet = db.getSheetByName(sheetName);
  if (!sheet) return errorResponse("Sheet not found");
  
  const range = sheet.getDataRange();
  const values = range.getValues();
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === recordId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return errorResponse("Record not found in " + sheetName, 404);
  }
  
  sheet.deleteRow(rowIndex);
  logAudit(db, currentUser, sheetName + '.delete', sheetName, recordId);
  
  return jsonResponse({ success: true, message: "Record deleted" });
}

// Universal Bulk Record Creator with transaction-like rollback on validation errors
function handleBulkCreate(sheetName, rows, db, currentUser) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return errorResponse("Rows array is empty or invalid");
  }
  
  const sheet = db.getSheetByName(sheetName);
  if (!sheet) return errorResponse("Sheet " + sheetName + " not found");
  
  const columns = SHEET_SCHEMAS[sheetName];
  const now = new Date();
  
  // 1. Validation Step
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.patient_id) {
      return errorResponse("Validation failed at index " + i + ": missing patient_id");
    }
    
    // Add specific checks per module
    if (sheetName === 'observations') {
      if (!row.observation_type || row.value === undefined || row.value === "") {
        return errorResponse("Validation failed at index " + i + ": missing observation_type or value");
      }
    } else if (sheetName === 'diagnoses') {
      if (!row.diagnosis_name) {
        return errorResponse("Validation failed at index " + i + ": missing diagnosis_name");
      }
    } else if (sheetName === 'medications') {
      if (!row.generic_name) {
        return errorResponse("Validation failed at index " + i + ": missing generic_name");
      }
    }
  }
  
  // 2. Creation Step
  const createdRecords = [];
  rows.forEach(row => {
    const id = generateUUID();
    const fullRow = {
      ...row,
      id: id,
      active: row.active === undefined ? true : row.active,
      created_at: now,
      updated_at: now
    };
    
    // Order values correctly for sheet append
    const orderedValues = columns.map(col => {
      const val = fullRow[col];
      return val === undefined ? "" : val;
    });
    
    sheet.appendRow(orderedValues);
    createdRecords.push({ id: id, ...row });
    logAudit(db, currentUser, sheetName + '.create', sheetName, id);
  });
  
  return jsonResponse({ success: true, records: createdRecords });
}

// PDPA Patient Profile Sharing - Create Link
function handleCreateShareLink(payload, db, currentUser) {
  const patientId = payload.patient_id;
  if (!patientId) return errorResponse("Patient ID is required");
  
  const now = new Date();
  
  // 1. Save patient consent record if present
  if (payload.consent) {
    const consentSheet = db.getSheetByName('patient_consents');
    const consentId = generateUUID();
    // Headers: id, patient_id, consent_type, consent_status, consent_text_version, given_by, given_at, expired_at, notes
    consentSheet.appendRow([
      consentId,
      patientId,
      payload.consent.consent_type || 'Patient Profile Sharing Consent',
      payload.consent.consent_status || 'Approved',
      payload.consent.consent_text_version || 'v1.0-TH',
      payload.consent.given_by || 'Patient',
      payload.consent.given_at ? new Date(payload.consent.given_at) : now,
      payload.consent.expired_at ? new Date(payload.consent.expired_at) : null,
      payload.consent.notes || ''
    ]);
    logAudit(db, currentUser, 'consents.create', 'patient_consents', consentId);
  }
  
  // 2. Generate random tokens and PIN
  const rawToken = generateUUID() + generateUUID(); // 64 char random token string
  const pinCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit PIN
  
  const tokenHash = sha256(rawToken);
  const pinHash = sha256(pinCode);
  
  const expiresDays = parseInt(payload.expires_days || 7, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresDays);
  
  const tokenId = generateUUID();
  const tokenSheet = db.getSheetByName('patient_share_tokens');
  
  // Headers: id, patient_id, token_hash, pin_hash, scope, expires_at, revoked, created_by, created_at, last_access_at, access_count
  tokenSheet.appendRow([
    tokenId,
    patientId,
    tokenHash,
    pinHash,
    payload.scope || 'read_profile',
    expiresAt,
    false,
    currentUser.email,
    now,
    "",
    0
  ]);
  
  logAudit(db, currentUser, 'share.create', 'patient_share_tokens', tokenId);
  
  return jsonResponse({
    success: true,
    token: rawToken,
    pin: pinCode,
    expires_at: expiresAt
  });
}

// PDPA Patient Profile Sharing - Fetch Shared Profile (Public Request)
function handleGetSharedProfile(e, db) {
  const rawToken = e.parameter.token;
  const pinCode = e.parameter.pin;
  const ipHint = e.parameter.ip_hint || '';
  const userAgent = e.parameter.user_agent || '';
  
  if (!rawToken || !pinCode) {
    return errorResponse("Missing token or PIN credentials");
  }
  
  const tokenHash = sha256(rawToken);
  const pinHash = sha256(pinCode);
  
  const tokens = getSheetData(db, 'patient_share_tokens');
  const tokenRecord = tokens.find(t => t.token_hash === tokenHash);
  
  const accessLogSheet = db.getSheetByName('profile_access_logs');
  const logId = generateUUID();
  const now = new Date();
  
  if (!tokenRecord) {
    // Log failure
    accessLogSheet.appendRow([logId, "", "", now, ipHint, userAgent, "FAILED_TOKEN_NOT_FOUND"]);
    return errorResponse("Invalid share link");
  }
  
  const patientId = tokenRecord.patient_id;
  
  if (tokenRecord.pin_hash !== pinHash) {
    accessLogSheet.appendRow([logId, patientId, tokenRecord.id, now, ipHint, userAgent, "FAILED_INVALID_PIN"]);
    return errorResponse("Incorrect PIN code", 401);
  }
  
  if (tokenRecord.revoked === true) {
    accessLogSheet.appendRow([logId, patientId, tokenRecord.id, now, ipHint, userAgent, "FAILED_REVOKED"]);
    return errorResponse("This link has been revoked", 410);
  }
  
  // Check Expiry Date
  const expiry = new Date(tokenRecord.expires_at);
  if (now > expiry) {
    accessLogSheet.appendRow([logId, patientId, tokenRecord.id, now, ipHint, userAgent, "FAILED_EXPIRED"]);
    return errorResponse("This link has expired", 410);
  }
  
  // Log Success access
  accessLogSheet.appendRow([logId, patientId, tokenRecord.id, now, ipHint, userAgent, "SUCCESS"]);
  
  // Update token access stats
  const sheet = db.getSheetByName('patient_share_tokens');
  const range = sheet.getDataRange();
  const values = range.getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === tokenRecord.id) {
      const accessCountCol = SHEET_SCHEMAS.patient_share_tokens.indexOf('access_count') + 1;
      const lastAccessCol = SHEET_SCHEMAS.patient_share_tokens.indexOf('last_access_at') + 1;
      
      const count = parseInt(values[i][accessCountCol - 1] || 0, 10) + 1;
      sheet.getRange(i + 1, accessCountCol).setValue(count);
      sheet.getRange(i + 1, lastAccessCol).setValue(now);
      break;
    }
  }
  
  // Gather clinical details of shared patient (read-only, minimal)
  const patients = getSheetData(db, 'patients');
  const fullPatient = patients.find(p => p.id === patientId);
  if (!fullPatient) return errorResponse("Patient record not found");
  
  // Exclude sensitive identifiers (LINE ID, address details, phone, emergency contact details)
  const sharedPatientInfo = {
    id: fullPatient.id,
    hn: fullPatient.hn,
    first_name: fullPatient.first_name,
    last_name: fullPatient.last_name,
    dob: fullPatient.dob,
    gender: fullPatient.gender,
    blood_group: fullPatient.blood_group,
    primary_physician: fullPatient.primary_physician
  };
  
  const diagnoses = getSheetData(db, 'diagnoses').filter(d => d.patient_id === patientId && d.active === true);
  const medications = getSheetData(db, 'medications').filter(m => m.patient_id === patientId && m.active === true);
  const allergies = getSheetData(db, 'allergies').filter(a => a.patient_id === patientId);
  const goals = getSheetData(db, 'goals').filter(g => g.patient_id === patientId && g.active === true);
  const observations = getSheetData(db, 'observations').filter(o => o.patient_id === patientId);
  const vaccines = getSheetData(db, 'vaccines').filter(v => v.patient_id === patientId);

  return jsonResponse({
    success: true,
    patient: sharedPatientInfo,
    diagnoses: diagnoses,
    medications: medications,
    allergies: allergies,
    goals: goals,
    observations: observations,
    vaccines: vaccines
  });
}

// PDPA Revoke Link
function handleRevokeShareLink(payload, db, currentUser) {
  const tokenId = payload.token_id;
  if (!tokenId) return errorResponse("Token ID is required");
  
  const sheet = db.getSheetByName('patient_share_tokens');
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === tokenId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return errorResponse("Token record not found");
  }
  
  const revokedCol = SHEET_SCHEMAS.patient_share_tokens.indexOf('revoked') + 1;
  sheet.getRange(rowIndex, revokedCol).setValue(true);
  
  logAudit(db, currentUser, 'share.revoke', 'patient_share_tokens', tokenId);
  return jsonResponse({ success: true, message: "Share link revoked successfully" });
}

// Dashboard statistics
function handleDashboardSummary(db) {
  try {
    const patients = getSheetData(db, 'patients');
    const diagnoses = getSheetData(db, 'diagnoses');
    const observations = getSheetData(db, 'observations');
    
    const totalPatients = patients.length;
    
    // Calculate NCD registries from active diagnoses
    const dmCount = new Set(diagnoses.filter(d => d.active === true && String(d.diagnosis_name || '').toLowerCase().includes('dm')).map(d => d.patient_id)).size;
    const htCount = new Set(diagnoses.filter(d => d.active === true && String(d.diagnosis_name || '').toLowerCase().includes('ht')).map(d => d.patient_id)).size;
    const lipidCount = new Set(diagnoses.filter(d => d.active === true && (String(d.diagnosis_name || '').toLowerCase().includes('dyslipidemia') || String(d.diagnosis_name || '').toLowerCase().includes('lipid'))).map(d => d.patient_id)).size;
    const ckdCount = new Set(diagnoses.filter(d => d.active === true && String(d.diagnosis_name || '').toLowerCase().includes('ckd')).map(d => d.patient_id)).size;
    
    // Group observations by patient to find latest values
    const latestObsByPatient = {};
    observations.forEach(obs => {
      const pid = obs.patient_id;
      const type = obs.observation_type;
      const date = new Date(obs.observation_date).getTime();
      
      if (!latestObsByPatient[pid]) latestObsByPatient[pid] = {};
      if (!latestObsByPatient[pid][type] || latestObsByPatient[pid][type].date < date) {
        latestObsByPatient[pid][type] = {
          value: parseFloat(obs.value),
          date: date
        };
      }
    });
    
    // Uncontrolled cases
    let uncontrolledBP = 0;
    let uncontrolledDM = 0;
    let abnormalLDL = 0;
    
    Object.keys(latestObsByPatient).forEach(pid => {
      const patientObs = latestObsByPatient[pid];
      
      // BP Uncontrolled (SBP >= 140 or DBP >= 90)
      const sbp = patientObs['SBP'] ? patientObs['SBP'].value : 0;
      const dbp = patientObs['DBP'] ? patientObs['DBP'].value : 0;
      if (sbp >= 140 || dbp >= 90) {
        uncontrolledBP++;
      }
      
      // DM Uncontrolled (HbA1c >= 7.0)
      const hba1c = patientObs['HbA1c'] ? patientObs['HbA1c'].value : 0;
      if (hba1c >= 7) {
        uncontrolledDM++;
      }
      
      // Abnormal LDL (LDL >= 100)
      const ldl = patientObs['LDL'] ? patientObs['LDL'].value : 0;
      if (ldl >= 100) {
        abnormalLDL++;
      }
    });
    
    // Monthly observations count for chart (last 6 months)
    const monthlyCounts = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    observations.forEach(obs => {
      if (!obs.observation_date) return;
      const d = new Date(obs.observation_date);
      if (isNaN(d.getTime())) return; // skip invalid dates
      const key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0');
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    });
    
    const monthlyChartData = Object.keys(monthlyCounts).sort().slice(-6).map(key => {
      const parts = key.split('-');
      const monthIndex = parseInt(parts[1], 10) - 1;
      const monthName = (monthIndex >= 0 && monthIndex < 12) ? monthNames[monthIndex] : "Unknown";
      const label = monthName + " " + parts[0].slice(-2);
      return { month: label, count: monthlyCounts[key] };
    });

    // Recent patients (with robust created_at date filtering)
    const recentPatients = patients
      .filter(p => p.created_at && !isNaN(new Date(p.created_at).getTime()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return jsonResponse({
      success: true,
      summary: {
        totalPatients,
        dmCount,
        htCount,
        lipidCount,
        ckdCount,
        uncontrolledBP,
        uncontrolledDM,
        abnormalLDL
      },
      monthlyObservations: monthlyChartData,
      recentPatients
    });
  } catch (error) {
    return jsonResponse({
      error: true,
      success: false,
      message: "Dashboard Error: " + error.toString(),
      status: 500
    });
  }
}

// Print-friendly Patient Summary Report
function handlePatientReport(e, db) {
  const patientId = e.parameter.id;
  if (!patientId) return errorResponse("Patient ID is required");
  
  const patients = getSheetData(db, 'patients');
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return errorResponse("Patient not found", 404);
  
  const diagnoses = getSheetData(db, 'diagnoses').filter(d => d.patient_id === patientId && d.active === true);
  const medications = getSheetData(db, 'medications').filter(m => m.patient_id === patientId && m.active === true);
  const allergies = getSheetData(db, 'allergies').filter(a => a.patient_id === patientId);
  const observations = getSheetData(db, 'observations').filter(o => o.patient_id === patientId);
  const vaccines = getSheetData(db, 'vaccines').filter(v => v.patient_id === patientId);
  
  return jsonResponse({
    success: true,
    patient,
    diagnoses,
    medications,
    allergies,
    observations,
    vaccines
  });
}

// Admin Audit Logs Fetcher
function handleGetAuditLogs(db) {
  const logs = getSheetData(db, 'audit_logs');
  // Sort descending
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return jsonResponse({ success: true, logs: logs.slice(0, 200) }); // return last 200 logs
}

// Admin Users List
function handleGetUsers(db) {
  const users = getSheetData(db, 'users');
  const responseUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    active: u.active,
    created_at: u.created_at,
    updated_at: u.updated_at
  }));
  return jsonResponse({ success: true, users: responseUsers });
}

// Admin Create Staff User
function handleCreateUser(payload, db, currentUser) {
  const email = (payload.email || '').trim().toLowerCase();
  const password = payload.password || '';
  const name = payload.name || '';
  const role = payload.role || 'viewer';
  
  if (!email || !password || !name) {
    return errorResponse("Missing email, password, or name");
  }
  
  const usersSheet = db.getSheetByName('users');
  const existingUsers = getSheetData(db, 'users');
  if (existingUsers.some(u => u.email.toLowerCase() === email)) {
    return errorResponse("User with this email already exists");
  }
  
  const id = generateUUID();
  const passwordHash = sha256(password + email);
  const now = new Date();
  
  usersSheet.appendRow([id, email, name, passwordHash, role, true, now, now]);
  logAudit(db, currentUser, 'users.create', 'users', id);
  
  return jsonResponse({ success: true, id: id });
}

// Admin Update User
function handleUpdateUser(payload, db, currentUser) {
  const userId = payload.id;
  if (!userId) return errorResponse("User ID is required");
  
  const usersSheet = db.getSheetByName('users');
  const values = usersSheet.getDataRange().getValues();
  const headers = values[0];
  
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === userId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return errorResponse("User not found", 404);
  }
  
  const now = new Date();
  
  // Write active and role
  const activeCol = headers.indexOf('active') + 1;
  const roleCol = headers.indexOf('role') + 1;
  const nameCol = headers.indexOf('name') + 1;
  const updatedAtCol = headers.indexOf('updated_at') + 1;
  
  if (payload.active !== undefined && activeCol > 0) {
    usersSheet.getRange(rowIndex, activeCol).setValue(payload.active);
  }
  if (payload.role !== undefined && roleCol > 0) {
    usersSheet.getRange(rowIndex, roleCol).setValue(payload.role);
  }
  if (payload.name !== undefined && nameCol > 0) {
    usersSheet.getRange(rowIndex, nameCol).setValue(payload.name);
  }
  
  // Password change if supplied
  if (payload.password) {
    const passwordHashCol = headers.indexOf('password_hash') + 1;
    const emailCol = headers.indexOf('email') + 1;
    const email = values[rowIndex - 1][emailCol - 1];
    const passwordHash = sha256(payload.password + email);
    usersSheet.getRange(rowIndex, passwordHashCol).setValue(passwordHash);
  }
  
  if (updatedAtCol > 0) {
    usersSheet.getRange(rowIndex, updatedAtCol).setValue(now);
  }
  
  logAudit(db, currentUser, 'users.update', 'users', userId);
  return jsonResponse({ success: true });
}
