/**
 * Resumeefy Analytics Backend — Google Apps Script
 * -------------------------------------------------
 * Deploy as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone with the web app URL
 *
 * Recommended production architecture:
 *   Resumeefy Next.js -> server-side proxy -> this Apps Script
 *
 * The Apps Script owns the Google Sheet, analytics aggregation,
 * admin authentication, and dashboard data.
 *
 * IMPORTANT:
 * - Passwords are NEVER stored in plaintext.
 * - The initial password is admin123 only so the first login works.
 * - Change it immediately with changeAdminPassword().
 * - Use the web app URL as an environment variable in Resumeefy.
 */

const CONFIG = Object.freeze({
  APP_NAME: 'Resumeefy',
  VERSION: '2.0.0',
  INITIAL_ADMIN_USERNAME: 'admin',
  INITIAL_ADMIN_PASSWORD: 'admin123',
  SESSION_TTL_SECONDS: 6 * 60 * 60,
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_SECONDS: 15 * 60,
  HASH_ITERATIONS: 12000,
  MAX_EVENT_BATCH: 100,
  MAX_STRING_LENGTH: 5000,
  TIME_ZONE: Session.getScriptTimeZone() || 'Africa/Lagos'
});

const SHEETS = Object.freeze({
  SETTINGS: 'Settings',
  ADMINS: 'Admins',
  EVENTS: 'Analytics Events',
  SESSIONS: 'Sessions',
  USERS: 'Users',
  RESUMES: 'Resumes',
  INTERVIEWS: 'Interviews',
  PAYMENTS: 'Payments',
  LEADS: 'Leads',
  DAILY: 'Daily Analytics',
  ERRORS: 'Errors'
});

const HEADERS = {
  Settings: ['Key', 'Value', 'Description', 'Updated At'],
  Admins: ['Admin ID', 'Username', 'Password Hash', 'Password Salt', 'Role', 'Active', 'Created At', 'Last Login', 'Failed Attempts', 'Locked Until'],
  'Analytics Events': ['Event ID', 'Timestamp', 'Date', 'Time', 'Event', 'Category', 'Session ID', 'User ID', 'Anonymous ID', 'Page', 'Path', 'Referrer', 'Device', 'Browser', 'OS', 'Country', 'City', 'Language', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Properties JSON'],
  Sessions: ['Session ID', 'Started At', 'Last Seen At', 'Anonymous ID', 'User ID', 'Landing Page', 'Referrer', 'Device', 'Browser', 'OS', 'Country', 'City', 'Pages', 'Events', 'Duration Seconds', 'Converted', 'Conversion Event'],
  Users: ['User ID', 'Created At', 'Last Seen At', 'Email', 'Name', 'Plan', 'Status', 'Source', 'Country', 'City', 'First Page', 'Last Page', 'Resume Count', 'Interview Count', 'Assessment Count', 'Payment Count', 'Lifetime Value'],
  Resumes: ['Resume ID', 'Timestamp', 'User ID', 'Session ID', 'Action', 'Target Role', 'Target Country', 'Template', 'AI Generated', 'ATS Score', 'Quality Score', 'Job Match Score', 'Status'],
  Interviews: ['Interview ID', 'Timestamp', 'User ID', 'Session ID', 'Action', 'Role', 'Stage', 'Question Number', 'Score', 'STAR Score', 'Communication Score', 'Relevance Score', 'Specificity Score', 'Outcome'],
  Payments: ['Payment ID', 'Timestamp', 'User ID', 'Session ID', 'Provider', 'Reference', 'Product', 'Amount', 'Currency', 'Status', 'Country'],
  Leads: ['Lead ID', 'Timestamp', 'User ID', 'Session ID', 'Email', 'Name', 'Source', 'Page', 'Status', 'Notes'],
  'Daily Analytics': ['Date', 'Visitors', 'Sessions', 'Page Views', 'Signups', 'CV Starts', 'CV Generated', 'CV Tailored', 'Job Matches', 'Interviews Started', 'Interviews Completed', 'Assessments Completed', 'Payments', 'Revenue', 'Leads', 'Avg Session Seconds', 'Avg CV Quality', 'Avg ATS Score', 'Avg Interview Score', 'Conversion Rate'],
  Errors: ['Timestamp', 'Error ID', 'Source', 'Message', 'Stack', 'User ID', 'Session ID', 'Path', 'Metadata JSON']
};

/* =========================
   WEB APP ENTRY POINTS
   ========================= */

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'dashboard').toLowerCase();

    if (action === 'health') {
      return jsonOutput_({
        ok: true,
        app: CONFIG.APP_NAME,
        version: CONFIG.VERSION,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'config') {
      return jsonOutput_({
        ok: true,
        app: CONFIG.APP_NAME,
        version: CONFIG.VERSION,
        events: getEventNames_()
      });
    }

    // Direct browser access displays the protected dashboard.
    return HtmlService.createHtmlOutput(getDashboardHtml_())
      .setTitle('Resumeefy Analytics')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    logError_('doGet', err);
    return jsonOutput_({ ok: false, error: 'Service unavailable' });
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || 'event').toLowerCase();

    switch (action) {
      case 'setup':
        return jsonOutput_(setupSystem());
      case 'event':
        return jsonOutput_(recordEvent(body));
      case 'events':
        return jsonOutput_(recordEvents(body.events || []));
      case 'session':
        return jsonOutput_(recordSession(body));
      case 'user':
        return jsonOutput_(upsertUser(body));
      case 'resume':
        return jsonOutput_(recordResume(body));
      case 'interview':
        return jsonOutput_(recordInterview(body));
      case 'payment':
        return jsonOutput_(recordPayment(body));
      case 'lead':
        return jsonOutput_(recordLead(body));
      case 'error':
        return jsonOutput_(recordClientError(body));
      case 'login':
        return jsonOutput_(login(body.username, body.password));
      case 'dashboard':
        return jsonOutput_(getDashboard(body.token, body.range || '30d'));
      case 'logout':
        return jsonOutput_(logout(body.token));
      case 'change_password':
        return jsonOutput_(changeAdminPassword(body.token, body.currentPassword, body.newPassword));
      case 'admin_check':
        return jsonOutput_(verifySession_(body.token));
      default:
        return jsonOutput_({ ok: false, error: 'Unknown action' });
    }
  } catch (err) {
    logError_('doPost', err);
    return jsonOutput_({ ok: false, error: 'Request failed' });
  }
}

/* =========================
   ONE-TIME / AUTOMATIC SETUP
   ========================= */

function setupSystem() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Open the bound Google Sheet and run setupSystem once.');

    Object.keys(HEADERS).forEach(name => ensureSheet_(ss, name, HEADERS[name]));

    seedSettings_(ss);
    seedAdmin_(ss);
    installTriggers_();

    return {
      ok: true,
      message: 'Resumeefy analytics system is ready.',
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      sheets: Object.keys(HEADERS)
    };
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const existing = sheet.getRange(1, 1, 1, Math.max(headers.length, sheet.getLastColumn())).getValues()[0];
    headers.forEach((header, i) => {
      if (existing[i] !== header) sheet.getRange(1, i + 1).setValue(header);
    });
  }

  styleSheet_(sheet, headers.length);
  return sheet;
}

function styleSheet_(sheet, columnCount) {
  const header = sheet.getRange(1, 1, 1, columnCount);
  header
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#146CFF')
    .setVerticalAlignment('middle');
  header.setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 34);

  for (let i = 1; i <= columnCount; i++) {
    sheet.setColumnWidth(i, Math.min(260, Math.max(110, 120)));
  }

  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(1, 1, Math.max(2, sheet.getMaxRows()), columnCount).createFilter();
}

function seedSettings_(ss) {
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);
  const now = new Date();
  const defaults = [
    ['APP_NAME', CONFIG.APP_NAME, 'Application name', now],
    ['ANALYTICS_VERSION', CONFIG.VERSION, 'Analytics schema version', now],
    ['TIME_ZONE', CONFIG.TIME_ZONE, 'Analytics timezone', now],
    ['SESSION_TTL_SECONDS', CONFIG.SESSION_TTL_SECONDS, 'Admin session lifetime', now],
    ['INITIAL_SETUP_AT', now.toISOString(), 'Initial setup timestamp', now]
  ];

  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
    : [];

  defaults.forEach(row => {
    if (!existing.includes(row[0])) sheet.appendRow(row);
  });
}

function seedAdmin_(ss) {
  const sheet = ss.getSheetByName(SHEETS.ADMINS);
  const rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS[SHEETS.ADMINS].length).getValues()
    : [];

  const existing = rows.find(r => String(r[1]).toLowerCase() === CONFIG.INITIAL_ADMIN_USERNAME);

  if (!existing) {
    const salt = randomHex_(16);
    const hash = hashPassword_(CONFIG.INITIAL_ADMIN_PASSWORD, salt);
    sheet.appendRow([
      'adm_' + randomHex_(8),
      CONFIG.INITIAL_ADMIN_USERNAME,
      hash,
      salt,
      'superadmin',
      true,
      new Date(),
      '',
      0,
      ''
    ]);
  }
}

function installTriggers_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'refreshDailyAnalytics')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('refreshDailyAnalytics')
    .timeBased()
    .everyHours(1)
    .create();
}

/* =========================
   ANALYTICS COLLECTION
   ========================= */

function recordEvent(data) {
  return recordEvents([data]);
}

function recordEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return { ok: true, recorded: 0 };
  if (events.length > CONFIG.MAX_EVENT_BATCH) throw new Error('Too many events in one request.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS['Analytics Events']) || ensureSheet_(ss, SHEETS['Analytics Events'], HEADERS[SHEETS['Analytics Events']]);
  const now = new Date();

  const rows = events.map(raw => {
    const event = sanitizeObject_(raw);
    const timestamp = validDate_(event.timestamp) || now;
    return [
      String(event.eventId || 'evt_' + randomHex_(10)),
      timestamp,
      formatDate_(timestamp),
      formatTime_(timestamp),
      clean_(event.event || 'unknown', 120),
      clean_(event.category || inferCategory_(event.event), 80),
      clean_(event.sessionId, 120),
      clean_(event.userId, 120),
      clean_(event.anonymousId, 120),
      clean_(event.page, 300),
      clean_(event.path, 500),
      clean_(event.referrer, 500),
      clean_(event.device, 80),
      clean_(event.browser, 120),
      clean_(event.os, 120),
      clean_(event.country, 120),
      clean_(event.city, 120),
      clean_(event.language, 50),
      clean_(event.utmSource, 120),
      clean_(event.utmMedium, 120),
      clean_(event.utmCampaign, 120),
      safeJson_(event.properties || {})
    ];
  });

  appendRows_(sheet, rows);
  updateSessionFromEvents_(events);

  return { ok: true, recorded: rows.length };
}

function recordSession(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SESSIONS) || ensureSheet_(ss, SHEETS.SESSIONS, HEADERS[SHEETS.SESSIONS]);
  const sessionId = clean_(data.sessionId || 'ses_' + randomHex_(10), 120);
  const existing = findRowByValue_(sheet, 1, sessionId);

  const now = new Date();
  const row = [
    sessionId,
    validDate_(data.startedAt) || now,
    now,
    clean_(data.anonymousId, 120),
    clean_(data.userId, 120),
    clean_(data.landingPage, 500),
    clean_(data.referrer, 500),
    clean_(data.device, 80),
    clean_(data.browser, 120),
    clean_(data.os, 120),
    clean_(data.country, 120),
    clean_(data.city, 120),
    Number(data.pages || 0),
    Number(data.events || 0),
    Number(data.durationSeconds || 0),
    Boolean(data.converted),
    clean_(data.conversionEvent, 120)
  ];

  if (existing) sheet.getRange(existing, 1, 1, row.length).setValues([row]);
  else sheet.appendRow(row);

  return { ok: true, sessionId };
}

function updateSessionFromEvents_(events) {
  const grouped = {};
  events.forEach(e => {
    const id = clean_(e.sessionId, 120);
    if (!id) return;
    grouped[id] = grouped[id] || { events: 0, pages: new Set(), converted: false, conversionEvent: '' };
    grouped[id].events++;
    if (e.path) grouped[id].pages.add(String(e.path));
    if (isConversionEvent_(e.event)) {
      grouped[id].converted = true;
      grouped[id].conversionEvent = e.event;
    }
  });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SESSIONS);
  if (!sheet) return;

  Object.keys(grouped).forEach(id => {
    const rowNum = findRowByValue_(sheet, 1, id);
    if (!rowNum) {
      recordSession({ sessionId: id });
      return;
    }

    const current = sheet.getRange(rowNum, 1, 1, HEADERS[SHEETS.SESSIONS].length).getValues()[0];
    current[2] = new Date();
    current[12] = Number(current[12] || 0) + grouped[id].pages.size;
    current[13] = Number(current[13] || 0) + grouped[id].events;
    current[15] = Boolean(current[15]) || grouped[id].converted;
    if (grouped[id].conversionEvent) current[16] = grouped[id].conversionEvent;
    sheet.getRange(rowNum, 1, 1, current.length).setValues([current]);
  });
}

function upsertUser(data) {
  const userId = clean_(data.userId, 160);
  if (!userId) throw new Error('userId is required.');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const rowNum = findRowByValue_(sheet, 1, userId);
  const now = new Date();

  if (!rowNum) {
    sheet.appendRow([
      userId, validDate_(data.createdAt) || now, now,
      clean_(data.email, 300), clean_(data.name, 200),
      clean_(data.plan, 80), clean_(data.status || 'active', 80),
      clean_(data.source, 200), clean_(data.country, 120), clean_(data.city, 120),
      clean_(data.firstPage, 500), clean_(data.lastPage, 500),
      0, 0, 0, 0, 0
    ]);
  } else {
    const row = sheet.getRange(rowNum, 1, 1, HEADERS[SHEETS.USERS].length).getValues()[0];
    row[2] = now;
    if (data.email) row[3] = clean_(data.email, 300);
    if (data.name) row[4] = clean_(data.name, 200);
    if (data.plan) row[5] = clean_(data.plan, 80);
    if (data.status) row[6] = clean_(data.status, 80);
    if (data.lastPage) row[11] = clean_(data.lastPage, 500);
    sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
  }

  return { ok: true, userId };
}

function recordResume(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.RESUMES);
  const row = [
    clean_(data.resumeId || 'res_' + randomHex_(10), 120),
    validDate_(data.timestamp) || new Date(),
    clean_(data.userId, 160),
    clean_(data.sessionId, 120),
    clean_(data.action, 100),
    clean_(data.targetRole, 200),
    clean_(data.targetCountry, 120),
    clean_(data.template, 120),
    Boolean(data.aiGenerated),
    numberOrBlank_(data.atsScore),
    numberOrBlank_(data.qualityScore),
    numberOrBlank_(data.jobMatchScore),
    clean_(data.status, 80)
  ];
  sheet.appendRow(row);
  return { ok: true, resumeId: row[0] };
}

function recordInterview(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.INTERVIEWS);
  const row = [
    clean_(data.interviewId || 'int_' + randomHex_(10), 120),
    validDate_(data.timestamp) || new Date(),
    clean_(data.userId, 160),
    clean_(data.sessionId, 120),
    clean_(data.action, 100),
    clean_(data.role, 200),
    clean_(data.stage, 100),
    numberOrBlank_(data.questionNumber),
    numberOrBlank_(data.score),
    numberOrBlank_(data.starScore),
    numberOrBlank_(data.communicationScore),
    numberOrBlank_(data.relevanceScore),
    numberOrBlank_(data.specificityScore),
    clean_(data.outcome, 120)
  ];
  sheet.appendRow(row);
  return { ok: true, interviewId: row[0] };
}

function recordPayment(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.PAYMENTS);
  const row = [
    clean_(data.paymentId || 'pay_' + randomHex_(10), 120),
    validDate_(data.timestamp) || new Date(),
    clean_(data.userId, 160),
    clean_(data.sessionId, 120),
    clean_(data.provider, 100),
    clean_(data.reference, 200),
    clean_(data.product, 200),
    numberOrBlank_(data.amount),
    clean_(data.currency || 'NGN', 10),
    clean_(data.status, 60),
    clean_(data.country, 120)
  ];
  sheet.appendRow(row);
  return { ok: true, paymentId: row[0] };
}

function recordLead(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.LEADS);
  const row = [
    clean_(data.leadId || 'lead_' + randomHex_(10), 120),
    validDate_(data.timestamp) || new Date(),
    clean_(data.userId, 160),
    clean_(data.sessionId, 120),
    clean_(data.email, 300),
    clean_(data.name, 200),
    clean_(data.source, 200),
    clean_(data.page, 500),
    clean_(data.status || 'new', 60),
    clean_(data.notes, 1000)
  ];
  sheet.appendRow(row);
  return { ok: true, leadId: row[0] };
}

function recordClientError(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.ERRORS);
  sheet.appendRow([
    new Date(),
    clean_(data.errorId || 'err_' + randomHex_(10), 120),
    clean_(data.source, 100),
    clean_(data.message, 2000),
    clean_(data.stack, 5000),
    clean_(data.userId, 160),
    clean_(data.sessionId, 120),
    clean_(data.path, 500),
    safeJson_(data.metadata || {})
  ]);
  return { ok: true };
}

/* =========================
   ADMIN AUTHENTICATION
   ========================= */

function login(username, password) {
  const user = clean_(username, 120).toLowerCase();
  if (!user || !password) return { ok: false, error: 'Invalid username or password.' };

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.ADMINS) || ensureSheet_(ss, SHEETS.ADMINS, HEADERS[SHEETS.ADMINS]);
  const rowNum = findRowByValue_(sheet, 2, user);

  if (!rowNum) return { ok: false, error: 'Invalid username or password.' };

  const row = sheet.getRange(rowNum, 1, 1, HEADERS[SHEETS.ADMINS].length).getValues()[0];
  const active = row[5] === true || String(row[5]).toLowerCase() === 'true';
  const lockedUntil = validDate_(row[9]);

  if (!active) return { ok: false, error: 'Account disabled.' };
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { ok: false, error: 'Too many failed attempts. Try again later.' };
  }

  const expected = String(row[2]);
  const salt = String(row[3]);
  const supplied = hashPassword_(String(password), salt);

  if (!constantTimeEqual_(expected, supplied)) {
    const failed = Number(row[8] || 0) + 1;
    row[8] = failed;
    if (failed >= CONFIG.LOGIN_MAX_ATTEMPTS) {
      row[9] = new Date(Date.now() + CONFIG.LOGIN_WINDOW_SECONDS * 1000);
      row[8] = 0;
    }
    sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
    return { ok: false, error: 'Invalid username or password.' };
  }

  row[7] = new Date();
  row[8] = 0;
  row[9] = '';
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);

  const token = createSession_(row[0], user, row[4]);
  return {
    ok: true,
    token,
    expiresIn: CONFIG.SESSION_TTL_SECONDS,
    username: user,
    role: row[4]
  };
}

function createSession_(adminId, username, role) {
  const token = randomHex_(32);
  const tokenHash = sha256Hex_(token);
  const expires = new Date(Date.now() + CONFIG.SESSION_TTL_SECONDS * 1000);

  const cache = CacheService.getScriptCache();
  cache.put('session:' + tokenHash, JSON.stringify({
    adminId, username, role, expiresAt: expires.toISOString()
  }), CONFIG.SESSION_TTL_SECONDS);

  return token;
}

function verifySession_(token) {
  if (!token) return { ok: false, authenticated: false };
  const hash = sha256Hex_(String(token));
  const raw = CacheService.getScriptCache().get('session:' + hash);
  if (!raw) return { ok: false, authenticated: false };

  const session = JSON.parse(raw);
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    CacheService.getScriptCache().remove('session:' + hash);
    return { ok: false, authenticated: false };
  }

  return { ok: true, authenticated: true, username: session.username, role: session.role };
}

function logout(token) {
  if (token) CacheService.getScriptCache().remove('session:' + sha256Hex_(String(token)));
  return { ok: true };
}

function changeAdminPassword(token, currentPassword, newPassword) {
  const session = requireSession_(token);
  validatePassword_(newPassword);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.ADMINS);
  const rowNum = findRowByValue_(sheet, 1, session.adminId);
  if (!rowNum) throw new Error('Admin account not found.');

  const row = sheet.getRange(rowNum, 1, 1, HEADERS[SHEETS.ADMINS].length).getValues()[0];
  const currentHash = hashPassword_(String(currentPassword), String(row[3]));

  if (!constantTimeEqual_(String(row[2]), currentHash)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }

  const salt = randomHex_(16);
  row[2] = hashPassword_(newPassword, salt);
  row[3] = salt;
  row[7] = new Date();
  row[8] = 0;
  row[9] = '';
  sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);

  return { ok: true, message: 'Password changed successfully.' };
}

function requireSession_(token) {
  const result = verifySession_(token);
  if (!result.ok) throw new Error('Unauthorized.');
  return result;
}

function validatePassword_(password) {
  if (!password || String(password).length < 10) {
    throw new Error('Use a password with at least 10 characters.');
  }
}

/* =========================
   SHA-256 / SECURITY HELPERS
   ========================= */

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value),
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => {
    const n = b < 0 ? b + 256 : b;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function hashPassword_(password, salt) {
  // Salted, iterated SHA-256. This is intentionally implemented with
  // Apps Script primitives because Apps Script has no native bcrypt/Argon2.
  let value = String(salt) + ':' + String(password);
  for (let i = 0; i < CONFIG.HASH_ITERATIONS; i++) {
    value = sha256Hex_(value + ':' + salt);
  }
  return value;
}

function constantTimeEqual_(a, b) {
  a = String(a);
  b = String(b);
  let result = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return result === 0;
}

function randomHex_(bytes) {
  const raw = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  return raw.substring(0, Math.max(8, bytes * 2));
}

/* =========================
   DASHBOARD DATA
   ========================= */

function getDashboard(token, range) {
  requireSession_(token);

  const days = parseRange_(range);
  const start = new Date(Date.now() - days * 86400000);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const events = readRowsSince_(ss.getSheetByName(SHEETS['Analytics Events']), 2, start);
  const sessions = readRowsSince_(ss.getSheetByName(SHEETS.SESSIONS), 2, start);
  const users = readRowsSince_(ss.getSheetByName(SHEETS.USERS), 2, start);
  const resumes = readRowsSince_(ss.getSheetByName(SHEETS.RESUMES), 2, start);
  const interviews = readRowsSince_(ss.getSheetByName(SHEETS.INTERVIEWS), 2, start);
  const payments = readRowsSince_(ss.getSheetByName(SHEETS.PAYMENTS), 2, start);
  const leads = readRowsSince_(ss.getSheetByName(SHEETS.LEADS), 2, start);
  const errors = readRowsSince_(ss.getSheetByName(SHEETS.ERRORS), 1, start);

  const eventNames = countBy_(events, 4);
  const pages = countBy_(events.filter(r => String(r[4]) === 'page_view'), 9);
  const sources = countBy_(events, 18);
  const devices = countBy_(events, 12);
  const countries = countBy_(events, 15);
  const daily = buildDailySeries_(events, sessions, payments, days);

  const revenue = payments
    .filter(r => String(r[9]).toLowerCase() === 'successful' || String(r[9]).toLowerCase() === 'success' || String(r[9]).toLowerCase() === 'paid')
    .reduce((sum, r) => sum + Number(r[7] || 0), 0);

  const successfulPayments = payments.filter(r => ['successful', 'success', 'paid'].includes(String(r[9]).toLowerCase())).length;
  const uniqueVisitors = new Set(events.map(r => String(r[8] || r[7] || '')).filter(Boolean)).size;
  const uniqueUsers = new Set(users.map(r => String(r[0])).filter(Boolean)).size;

  const cvQuality = average_(resumes.map(r => Number(r[10])).filter(Number.isFinite));
  const ats = average_(resumes.map(r => Number(r[9])).filter(Number.isFinite));
  const jobMatch = average_(resumes.map(r => Number(r[11])).filter(Number.isFinite));
  const interviewScore = average_(interviews.map(r => Number(r[8])).filter(Number.isFinite));
  const sessionDuration = average_(sessions.map(r => Number(r[14])).filter(Number.isFinite));

  const signups = eventCount_(eventNames, ['signup', 'sign_up', 'registration_completed']);
  const cvStarts = eventCount_(eventNames, ['cv_start', 'resume_start']);
  const cvGenerated = eventCount_(eventNames, ['cv_generated', 'resume_generated']);
  const cvTailored = eventCount_(eventNames, ['cv_tailored', 'resume_tailored']);
  const jobMatches = eventCount_(eventNames, ['job_match', 'job_description_match']);
  const interviewsStarted = eventCount_(eventNames, ['interview_started']);
  const interviewsCompleted = eventCount_(eventNames, ['interview_completed']);
  const assessmentsCompleted = eventCount_(eventNames, ['assessment_completed']);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    range: days,
    kpis: {
      visitors: uniqueVisitors,
      users: uniqueUsers,
      sessions: sessions.length,
      pageViews: eventCount_(eventNames, ['page_view']),
      signups,
      cvStarts,
      cvGenerated,
      cvTailored,
      jobMatches,
      interviewsStarted,
      interviewsCompleted,
      assessmentsCompleted,
      payments: successfulPayments,
      revenue,
      leads: leads.length,
      errors: errors.length,
      conversionRate: uniqueVisitors ? round_(successfulPayments / uniqueVisitors * 100, 2) : 0,
      avgSessionSeconds: round_(sessionDuration, 0),
      avgCVQuality: round_(cvQuality, 1),
      avgATSScore: round_(ats, 1),
      avgJobMatchScore: round_(jobMatch, 1),
      avgInterviewScore: round_(interviewScore, 1)
    },
    charts: {
      daily,
      topPages: topN_(pages, 12),
      events: topN_(eventNames, 20),
      sources: topN_(sources, 12),
      devices: topN_(devices, 8),
      countries: topN_(countries, 12)
    },
    funnel: [
      ['Visitors', uniqueVisitors],
      ['CV Started', cvStarts],
      ['CV Generated', cvGenerated],
      ['Job Match', jobMatches],
      ['Interview Started', interviewsStarted],
      ['Interview Completed', interviewsCompleted],
      ['Payment', successfulPayments]
    ],
    quality: {
      cvQuality: round_(cvQuality, 1),
      ats: round_(ats, 1),
      jobMatch: round_(jobMatch, 1),
      interview: round_(interviewScore, 1)
    },
    recentEvents: events.slice(-30).reverse().map(eventForDashboard_),
    recentPayments: payments.slice(-20).reverse().map(paymentForDashboard_),
    recentErrors: errors.slice(-20).reverse().map(errorForDashboard_)
  };
}

function refreshDailyAnalytics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS['Daily Analytics']) || ensureSheet_(ss, SHEETS['Daily Analytics'], HEADERS[SHEETS['Daily Analytics']]);

  const tz = CONFIG.TIME_ZONE;
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const dates = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(Date.now() - i * 86400000);
    dates.push(Utilities.formatDate(d, tz, 'yyyy-MM-dd'));
  }

  const existing = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String)
    : [];

  // Rebuild only the most recent 90 days. This is intentionally idempotent.
  const ssData = {
    events: readRowsSince_(ss.getSheetByName(SHEETS['Analytics Events']), 2, new Date(Date.now() - 91 * 86400000)),
    sessions: readRowsSince_(ss.getSheetByName(SHEETS.SESSIONS), 2, new Date(Date.now() - 91 * 86400000)),
    resumes: readRowsSince_(ss.getSheetByName(SHEETS.RESUMES), 2, new Date(Date.now() - 91 * 86400000)),
    interviews: readRowsSince_(ss.getSheetByName(SHEETS.INTERVIEWS), 2, new Date(Date.now() - 91 * 86400000)),
    payments: readRowsSince_(ss.getSheetByName(SHEETS.PAYMENTS), 2, new Date(Date.now() - 91 * 86400000)),
    leads: readRowsSince_(ss.getSheetByName(SHEETS.LEADS), 2, new Date(Date.now() - 91 * 86400000))
  };

  const rows = dates.map(date => {
    const ev = ssData.events.filter(r => String(r[2]) === date);
    const ses = ssData.sessions.filter(r => formatDate_(new Date(r[1])) === date);
    const res = ssData.resumes.filter(r => formatDate_(new Date(r[1])) === date);
    const ints = ssData.interviews.filter(r => formatDate_(new Date(r[1])) === date);
    const pays = ssData.payments.filter(r => formatDate_(new Date(r[1])) === date && ['successful','success','paid'].includes(String(r[9]).toLowerCase()));
    const leads = ssData.leads.filter(r => formatDate_(new Date(r[1])) === date);

    const names = countBy_(ev, 4);
    const revenue = pays.reduce((sum, r) => sum + Number(r[7] || 0), 0);

    return [
      date,
      new Set(ev.map(r => String(r[8] || r[7])).filter(Boolean)).size,
      ses.length,
      eventCount_(names, ['page_view']),
      eventCount_(names, ['signup', 'sign_up', 'registration_completed']),
      eventCount_(names, ['cv_start', 'resume_start']),
      eventCount_(names, ['cv_generated', 'resume_generated']),
      eventCount_(names, ['cv_tailored', 'resume_tailored']),
      eventCount_(names, ['job_match', 'job_description_match']),
      eventCount_(names, ['interview_started']),
      eventCount_(names, ['interview_completed']),
      eventCount_(names, ['assessment_completed']),
      pays.length,
      revenue,
      leads.length,
      average_(ses.map(r => Number(r[14])).filter(Number.isFinite)),
      average_(res.map(r => Number(r[10])).filter(Number.isFinite)),
      average_(res.map(r => Number(r[9])).filter(Number.isFinite)),
      average_(ints.map(r => Number(r[8])).filter(Number.isFinite)),
      new Set(ev.map(r => String(r[8] || r[7])).filter(Boolean)).size
        ? round_(pays.length / new Set(ev.map(r => String(r[8] || r[7])).filter(Boolean)).size * 100, 2)
        : 0
    ];
  }).reverse();

  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS['Daily Analytics'].length).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  styleSheet_(sheet, HEADERS['Daily Analytics'].length);
}

/* =========================
   DASHBOARD UI
   ========================= */

function getDashboardHtml_() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resumeefy Analytics</title>
<style>
:root{
  --bg:#07111f;--panel:#0d1b2d;--panel2:#11243a;--text:#eef6ff;--muted:#8fa6be;
  --brand:#146cff;--brand2:#5b9cff;--good:#28d17c;--warn:#ffc857;--bad:#ff5c7a;
  --line:rgba(255,255,255,.08);--shadow:0 24px 70px rgba(0,0,0,.28)
}
*{box-sizing:border-box}body{margin:0;background:
radial-gradient(circle at 10% 0%,rgba(20,108,255,.18),transparent 30%),
radial-gradient(circle at 90% 10%,rgba(91,156,255,.10),transparent 28%),var(--bg);
font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text)}
button,input{font:inherit}.wrap{min-height:100vh;padding:28px}.shell{max-width:1480px;margin:auto}
.login{max-width:430px;margin:8vh auto;background:rgba(13,27,45,.9);border:1px solid var(--line);border-radius:28px;padding:34px;box-shadow:var(--shadow);backdrop-filter:blur(18px)}
.logo{font-size:25px;font-weight:800;letter-spacing:-.04em}.logo span{color:#6da5ff}
.muted{color:var(--muted)}label{display:block;font-size:13px;color:var(--muted);margin:20px 0 7px}
input{width:100%;background:#081526;border:1px solid var(--line);color:var(--text);border-radius:13px;padding:13px 14px;outline:none}
input:focus{border-color:var(--brand);box-shadow:0 0 0 4px rgba(20,108,255,.12)}
.btn{border:0;border-radius:13px;padding:12px 17px;background:var(--brand);color:white;font-weight:700;cursor:pointer}
.btn.secondary{background:var(--panel2);border:1px solid var(--line)}.btn.danger{background:rgba(255,92,122,.12);color:#ff8aa0}
.login .btn{width:100%;margin-top:22px}.err{margin-top:15px;color:#ff8aa0;font-size:14px}
.top{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:25px}
.actions{display:flex;gap:10px;align-items:center}.range{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:11px;padding:10px}
.grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
.card{background:linear-gradient(180deg,rgba(17,36,58,.92),rgba(13,27,45,.92));border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:0 12px 35px rgba(0,0,0,.13);animation:rise .45s ease both}
.kicker{font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em}.value{font-size:30px;font-weight:800;letter-spacing:-.04em;margin-top:9px}.delta{font-size:12px;color:var(--good);margin-top:6px}
.two{display:grid;grid-template-columns:1.5fr 1fr;gap:16px;margin-top:16px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px}
.panel{background:rgba(13,27,45,.86);border:1px solid var(--line);border-radius:22px;padding:20px;overflow:hidden}
.panel h3{margin:0 0 16px;font-size:15px}.chart{height:290px;display:flex;align-items:flex-end;gap:5px;padding-top:25px}
.bar{flex:1;min-width:4px;background:linear-gradient(180deg,#75acff,#146cff);border-radius:7px 7px 2px 2px;opacity:.86;transition:height .5s ease,opacity .2s}.bar:hover{opacity:1}
.barlabel{font-size:9px;color:var(--muted);transform:rotate(-45deg);margin-top:12px}
.list{display:grid;gap:9px}.row{display:flex;justify-content:space-between;gap:15px;padding:11px 0;border-bottom:1px solid var(--line)}.row:last-child{border-bottom:0}
.row small{color:var(--muted)}.pill{padding:5px 8px;border-radius:999px;background:rgba(20,108,255,.12);color:#8dbbff;font-size:11px;font-weight:700}
.funnel{display:grid;gap:8px}.fstep{position:relative;padding:12px 14px;border-radius:12px;background:rgba(20,108,255,var(--a,.12));border:1px solid rgba(20,108,255,.12);display:flex;justify-content:space-between}
.table{width:100%;border-collapse:collapse;font-size:12px}.table th,.table td{text-align:left;padding:11px;border-bottom:1px solid var(--line);white-space:nowrap}.table th{color:var(--muted);font-weight:700}
.table-wrap{overflow:auto;max-height:360px}.loading{opacity:.55;pointer-events:none}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@media(max-width:1150px){.grid{grid-template-columns:repeat(3,1fr)}.two{grid-template-columns:1fr}.three{grid-template-columns:1fr 1fr}}
@media(max-width:720px){.wrap{padding:15px}.top{align-items:flex-start;flex-direction:column}.actions{width:100%}.actions>*{flex:1}.grid{grid-template-columns:repeat(2,1fr)}.three{grid-template-columns:1fr}.value{font-size:24px}.panel{padding:15px}}
</style>
</head>
<body>
<div class="wrap"><div class="shell" id="app">
<div class="login" id="login">
  <div class="logo">Resume<span>efy</span></div>
  <p class="muted">Secure analytics dashboard</p>
  <label>Username</label><input id="username" autocomplete="username" value="admin">
  <label>Password</label><input id="password" type="password" autocomplete="current-password">
  <button class="btn" onclick="signIn()">Sign in</button>
  <div class="err" id="loginError"></div>
</div>
</div></div>
<script>
const KEY='resumeefy_admin_session';
let token=localStorage.getItem(KEY);
const $=id=>document.getElementById(id);
function call(action,payload={}){
  return new Promise((resolve,reject)=>{
    google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)
      .doPost({postData:{contents:JSON.stringify({action,...payload})}});
  });
}
async function signIn(){
  $('loginError').textContent='';
  const r=await call('login',{username:$('username').value,password:$('password').value});
  if(!r.ok){$('loginError').textContent=r.error||'Unable to sign in';return}
  token=r.token;localStorage.setItem(KEY,token);renderDashboard();
}
async function signOut(){await call('logout',{token});localStorage.removeItem(KEY);location.reload()}
function fmt(n){return Number(n||0).toLocaleString()}
function money(n){return '₦'+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2})}
function card(label,value){return '<div class="card"><div class="kicker">'+label+'</div><div class="value">'+value+'</div></div>'}
async function renderDashboard(){
  const check=await call('admin_check',{token});
  if(!check.ok){localStorage.removeItem(KEY);token=null;return}
  $('app').innerHTML='<div class="top"><div><div class="logo">Resume<span>efy</span> Analytics</div><div class="muted">Live career platform intelligence</div></div><div class="actions"><select class="range" id="range"><option value="7d">7 days</option><option value="30d" selected>30 days</option><option value="90d">90 days</option></select><button class="btn secondary" onclick="load()">Refresh</button><button class="btn danger" onclick="signOut()">Sign out</button></div></div><div id="dash" class="loading">Loading analytics…</div>';
  $('range').onchange=load;load();
}
async function load(){
  $('dash').classList.add('loading');
  const r=await call('dashboard',{token,range:$('range').value});
  if(!r.ok){$('dash').innerHTML='<div class="panel">Session expired. Please sign in again.</div>';return}
  const k=r.kpis;
  $('dash').innerHTML='<div class="grid">'+
    card('Visitors',fmt(k.visitors))+card('Sessions',fmt(k.sessions))+card('Page views',fmt(k.pageViews))+card('Signups',fmt(k.signups))+card('Revenue',money(k.revenue))+
    card('CVs generated',fmt(k.cvGenerated))+card('Job matches',fmt(k.jobMatches))+card('Interviews',fmt(k.interviewsCompleted))+card('Payments',fmt(k.payments))+card('Conversion',k.conversionRate+'%')+
    '</div>'+
    '<div class="two"><div class="panel"><h3>Traffic trend</h3><div class="chart">'+r.charts.daily.map(d=>'<div title="'+d.date+': '+d.visitors+' visitors" class="bar" style="height:'+Math.max(4,Math.min(100,d.visitors/(Math.max(...r.charts.daily.map(x=>x.visitors),1))*100))+'%"></div>').join('')+'</div></div>'+
    '<div class="panel"><h3>Conversion funnel</h3><div class="funnel">'+r.funnel.map((x,i)=>'<div class="fstep" style="--a:'+Math.max(.06,.2-i*.02)+'"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b></div>').join('')+'</div></div></div>'+
    '<div class="three"><div class="panel"><h3>CV performance</h3><div class="list">'+
      '<div class="row"><span>Quality score</span><b>'+r.quality.cvQuality+'</b></div><div class="row"><span>ATS score</span><b>'+r.quality.ats+'</b></div><div class="row"><span>Job match</span><b>'+r.quality.jobMatch+'</b></div></div></div>'+
      '<div class="panel"><h3>Interview performance</h3><div class="list"><div class="row"><span>Average score</span><b>'+r.quality.interview+'</b></div><div class="row"><span>Completed</span><b>'+fmt(k.interviewsCompleted)+'</b></div><div class="row"><span>Assessments</span><b>'+fmt(k.assessmentsCompleted)+'</b></div></div></div>'+
      '<div class="panel"><h3>Session health</h3><div class="list"><div class="row"><span>Avg duration</span><b>'+fmt(k.avgSessionSeconds)+'s</b></div><div class="row"><span>Leads</span><b>'+fmt(k.leads)+'</b></div><div class="row"><span>Errors</span><b>'+fmt(k.errors)+'</b></div></div></div></div>'+
    '<div class="three"><div class="panel"><h3>Top pages</h3><div class="list">'+r.charts.topPages.map(x=>'<div class="row"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b></div>').join('')+'</div></div>'+
    '<div class="panel"><h3>Acquisition sources</h3><div class="list">'+r.charts.sources.map(x=>'<div class="row"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b></div>').join('')+'</div></div>'+
    '<div class="panel"><h3>Devices</h3><div class="list">'+r.charts.devices.map(x=>'<div class="row"><span>'+x[0]+'</span><b>'+fmt(x[1])+'</b></div>').join('')+'</div></div></div>'+
    '<div class="panel" style="margin-top:16px"><h3>Recent activity</h3><div class="table-wrap"><table class="table"><thead><tr><th>Time</th><th>Event</th><th>Page</th><th>User</th><th>Device</th></tr></thead><tbody>'+r.recentEvents.map(x=>'<tr><td>'+x.time+'</td><td><span class="pill">'+x.event+'</span></td><td>'+x.page+'</td><td>'+x.user+'</td><td>'+x.device+'</td></tr>').join('')+'</tbody></table></div></div>';
  $('dash').classList.remove('loading');
}
if(token) renderDashboard();
</script>
</body></html>`;
}

/* =========================
   DATA / UTILITY HELPERS
   ========================= */

function parseBody_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  return e.parameter || {};
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function appendRows_(sheet, rows) {
  if (!rows.length) return;
  const start = sheet.getLastRow() + 1;
  sheet.getRange(start, 1, rows.length, rows[0].length).setValues(rows);
}

function findRowByValue_(sheet, column, value) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  const values = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).getValues().flat();
  const target = String(value).toLowerCase();
  const index = values.findIndex(v => String(v).toLowerCase() === target);
  return index < 0 ? null : index + 2;
}

function readRowsSince_(sheet, dateColumn, since) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return rows.filter(row => {
    const value = row[dateColumn - 1];
    const date = value instanceof Date ? value : new Date(value);
    return !isNaN(date.getTime()) && date >= since;
  });
}

function countBy_(rows, index) {
  const out = {};
  rows.forEach(r => {
    const key = String(r[index] || 'unknown');
    out[key] = (out[key] || 0) + 1;
  });
  return Object.entries(out).sort((a,b) => b[1]-a[1]);
}

function topN_(arr, n) {
  return arr.slice(0, n);
}

function eventCount_(eventEntries, names) {
  const wanted = new Set(names);
  return eventEntries.filter(x => wanted.has(String(x[0]).toLowerCase())).reduce((s,x)=>s+Number(x[1]),0);
}

function average_(values) {
  if (!values.length) return 0;
  return values.reduce((a,b)=>a+b,0)/values.length;
}

function round_(n, places) {
  const p = Math.pow(10, places);
  return Math.round(Number(n || 0) * p) / p;
}

function numberOrBlank_(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}

function clean_(value, max) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]/g, '').substring(0, max || CONFIG.MAX_STRING_LENGTH);
}

function sanitizeObject_(obj) {
  if (!obj || typeof obj !== 'object') return {};
  const out = {};
  Object.keys(obj).slice(0, 100).forEach(k => {
    const value = obj[k];
    if (typeof value === 'object' && value !== null) out[k] = sanitizeObject_(value);
    else out[k] = clean_(value, CONFIG.MAX_STRING_LENGTH);
  });
  return out;
}

function safeJson_(obj) {
  try { return JSON.stringify(sanitizeObject_(obj)).substring(0, CONFIG.MAX_STRING_LENGTH); }
  catch (_) { return '{}'; }
}

function validDate_(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate_(date) {
  return Utilities.formatDate(new Date(date), CONFIG.TIME_ZONE, 'yyyy-MM-dd');
}

function formatTime_(date) {
  return Utilities.formatDate(new Date(date), CONFIG.TIME_ZONE, 'HH:mm:ss');
}

function parseRange_(range) {
  const match = String(range || '30d').match(/^(7|30|90)d$/);
  return match ? Number(match[1]) : 30;
}

function inferCategory_(event) {
  const e = String(event || '').toLowerCase();
  if (e.includes('cv') || e.includes('resume')) return 'resume';
  if (e.includes('interview') || e.includes('assessment')) return 'assessment';
  if (e.includes('payment') || e.includes('checkout')) return 'commerce';
  if (e.includes('signup') || e.includes('login')) return 'auth';
  if (e.includes('job') || e.includes('match')) return 'job';
  return 'engagement';
}

function isConversionEvent_(event) {
  return ['payment_success','purchase','paid','signup','sign_up','registration_completed','cv_generated','interview_completed','assessment_completed'].includes(String(event || '').toLowerCase());
}

function eventForDashboard_(r) {
  return {
    time: String(r[3] || ''),
    event: String(r[4] || ''),
    page: String(r[9] || r[10] || ''),
    user: String(r[7] || r[8] || 'anonymous'),
    device: String(r[12] || '')
  };
}

function paymentForDashboard_(r) {
  return { time: String(r[1] || ''), product: String(r[6] || ''), amount: Number(r[7] || 0), status: String(r[9] || '') };
}

function errorForDashboard_(r) {
  return { time: String(r[0] || ''), source: String(r[2] || ''), message: String(r[3] || '') };
}

function buildDailySeries_(events, sessions, payments, days) {
  const output = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = formatDate_(new Date(Date.now() - i * 86400000));
    const ev = events.filter(r => String(r[2]) === date);
    const ses = sessions.filter(r => formatDate_(new Date(r[1])) === date);
    const pays = payments.filter(r => formatDate_(new Date(r[1])) === date && ['successful','success','paid'].includes(String(r[9]).toLowerCase()));
    const unique = new Set(ev.map(r => String(r[8] || r[7])).filter(Boolean)).size;
    output.push({
      date,
      visitors: unique,
      sessions: ses.length,
      pageViews: ev.filter(r => String(r[4]) === 'page_view').length,
      payments: pays.length,
      revenue: pays.reduce((s,r)=>s+Number(r[7]||0),0)
    });
  }
  return output;
}

function getEventNames_() {
  return [
    'page_view','session_start','signup','login','logout',
    'cv_start','cv_generated','cv_downloaded','cv_tailored',
    'job_match','interview_started','interview_question_answered',
    'interview_completed','assessment_started','assessment_completed',
    'payment_started','payment_success','lead_created','cta_click',
    'feature_used','error'
  ];
}

function logError_(source, err) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.ERRORS);
    if (!sheet) return;
    sheet.appendRow([
      new Date(),
      'err_' + randomHex_(10),
      source,
      clean_(err && err.message ? err.message : err, 2000),
      clean_(err && err.stack ? err.stack : '', 5000),
      '', '', '', '{}'
    ]);
  } catch (_) {}
}
