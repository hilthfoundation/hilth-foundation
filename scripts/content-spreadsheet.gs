// Hilth Foundation website content.
// Bind this script to a dedicated Google Sheet that holds public website content only.
//
// One-time setup (Foundation Google account):
//   1. Run setupWebsiteContent  -> creates the "outreach" tab for past programmes.
//   2. Run setupEventsForm      -> repairs/reuses the staff Form, links it to this Sheet and
//                                  logs the form link (see View > Logs / Executions).
//   3. Deploy > New deployment > Web app (execute as you, access: anyone) and put the
//      /exec URL in data/content-source.json on the website.
//
// Adding an event: open the form link on a phone, fill it in, submit. The answer lands in
// the "Event submissions" tab. It appears on the website only after a team member sets
// the "Approved" column on that row to Yes. Set it back to blank or No to remove it.

const EVENT_FORM_TITLE = 'Add a Hilth Foundation event';
// Optional: set this to the ID from the existing Google Form's edit URL to reuse it.
// Leave blank to create a new form.
const EXISTING_EVENT_FORM_ID = '';
const EVENT_SHEET_NAME = 'Event submissions';
const EVENT_PROGRAMMES = ['HSIP', 'Insights', '90 Days', 'Mentorship', 'Community'];
// Question titles double as the column headers the website reads.
const EVENT_FIELDS = {
  title: 'Event title',
  date: 'Date',
  time: 'Start time',
  location: 'Venue, town or Online',
  programme: 'Programme',
  description: 'Short description',
  registrationUrl: 'Registration link (optional)',
  link: 'More information link (optional)'
};
const APPROVED_HEADER = 'Approved';

function setupWebsiteContent() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  PropertiesService.getScriptProperties().setProperty('CONTENT_SHEET_ID', spreadsheet.getId());
  const fields = ['published', 'title', 'school', 'date', 'location', 'programme', 'summary', 'attendance', 'image', 'imageAlt', 'gallery', 'story'];
  let sheet = spreadsheet.getSheetByName('outreach');
  if (!sheet) sheet = spreadsheet.insertSheet('outreach');
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, fields.length).setValues([fields]);
    sheet.setFrozenRows(1);
    sheet.getRange(2, 1, 499, 1).insertCheckboxes();
    sheet.getRange(2, fields.indexOf('date') + 1, 499, 1).setNumberFormat('yyyy-mm-dd');
  }
}

function setupEventsForm() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from Hilth website content: Extensions > Apps Script.');
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('CONTENT_SHEET_ID', spreadsheet.getId());
  const formId = EXISTING_EVENT_FORM_ID.trim() || properties.getProperty('EVENT_FORM_ID');
  const form = formId ? FormApp.openById(formId) : FormApp.create(EVENT_FORM_TITLE);
  if (!formId) properties.setProperty('EVENT_FORM_ID', form.getId());
  const destinationId = formDestinationId_(form);
  if (destinationId && destinationId !== spreadsheet.getId()) {
    throw new Error('This Form is linked to another spreadsheet. Open its response spreadsheet and run setup there.');
  }
  properties.setProperty('EVENT_FORM_ID', form.getId());
  form.setTitle(EVENT_FORM_TITLE);
  form.setDescription('For Hilth Foundation staff. Submit one form per event. Use the details you want visitors to see on the website. A Hilth content editor must set Approved to Yes in the Event submissions sheet before the event is published. All event times should use the local time at the venue.');
  form.setCollectEmail(false);
  form.setConfirmationMessage('Your event has been sent to the Hilth team for review. It will appear on the website after a content editor approves it. To correct an event, contact the content editor rather than submitting it again.');

  configureEventQuestions_(form, properties);

  if (!destinationId) form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  SpreadsheetApp.flush();
  const responseSheet = spreadsheet.getSheets().find(sheet => {
    const link = sheet.getFormUrl();
    return link && (link.indexOf(form.getId()) >= 0 || link === form.getPublishedUrl());
  });
  if (!responseSheet) throw new Error('The linked response tab is not ready. Wait a few seconds and run setupEventsForm again.');
  const namedSheet = spreadsheet.getSheetByName(EVENT_SHEET_NAME);
  if (namedSheet && namedSheet.getSheetId() !== responseSheet.getSheetId()) {
    throw new Error('Another tab already uses the name Event submissions. Check that it belongs to this Form before renaming it.');
  }
  if (responseSheet.getName() !== EVENT_SHEET_NAME) responseSheet.setName(EVENT_SHEET_NAME);

  // Find the approval column by name; never overwrite a response column.
  const headers = responseSheet.getRange(1, 1, 1, responseSheet.getLastColumn()).getDisplayValues()[0];
  let approvedColumn = headers.indexOf(APPROVED_HEADER) + 1;
  if (!approvedColumn) {
    approvedColumn = responseSheet.getLastColumn() + 1;
    if (approvedColumn > responseSheet.getMaxColumns()) responseSheet.insertColumnAfter(responseSheet.getMaxColumns());
    responseSheet.getRange(1, approvedColumn).setValue(APPROVED_HEADER);
  }
  responseSheet.getRange(2, approvedColumn, Math.max(responseSheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build());
  responseSheet.setFrozenRows(1);
  responseSheet.getRange(1, approvedColumn).setNote('Hilth content editor: choose Yes to publish this event. Choose No or clear the cell to keep it off the website.');

  Logger.log('Share this responder link with Hilth staff: ' + form.getPublishedUrl());
  Logger.log('Edit the form here: ' + form.getEditUrl());
  Logger.log('Check the Form preview: all eight questions must have labels. Publish the Form if Google asks you to publish the changes.');
}

function configureEventQuestions_(form, properties) {
  const specs = [
    ['title', 'TEXT', 'addTextItem', 'asTextItem', true, 'The public event name. Example: Hilth School Impact Visit.'],
    ['date', 'DATE', 'addDateItem', 'asDateItem', true, 'The date the event will take place. Include the year.'],
    ['time', 'TIME', 'addTimeItem', 'asTimeItem', true, 'When the event starts, in the local time at the venue.'],
    ['location', 'TEXT', 'addTextItem', 'asTextItem', true, 'Include the venue, town and country. For a virtual event, enter Online.'],
    ['programme', 'MULTIPLE_CHOICE', 'addMultipleChoiceItem', 'asMultipleChoiceItem', true, 'Choose the Hilth programme organising this event.'],
    ['description', 'PARAGRAPH_TEXT', 'addParagraphTextItem', 'asParagraphTextItem', true, 'In one or two sentences, explain what will happen and who the event is for. This appears on the website.'],
    ['registrationUrl', 'TEXT', 'addTextItem', 'asTextItem', false, 'Optional. Paste a full https:// link for visitors to register. Leave blank if registration is not needed.'],
    ['link', 'TEXT', 'addTextItem', 'asTextItem', false, 'Optional. Paste a full https:// link with more details. The website uses this when no registration link is provided.']
  ];
  const propertyKey = 'EVENT_FIELD_IDS_' + form.getId();
  const savedIds = JSON.parse(properties.getProperty(propertyKey) || '{}');
  const items = form.getItems();
  const used = new Set();
  const placeholder = item => /^(question|untitled question)?$/i.test(item.getTitle().trim());
  const urlValidation = FormApp.createTextValidation().requireTextIsUrl().setHelpText('Paste a full link, for example https://example.org/event').build();
  specs.forEach((spec, index) => {
    const [key, type, add, cast, required, help] = spec;
    const compatible = item => !used.has(item.getId()) && item.getType() === FormApp.ItemType[type];
    let item = items.find(item => compatible(item) && item.getId() === savedIds[key])
      || items.find(item => compatible(item) && item.getTitle().trim() === EVENT_FIELDS[key])
      || items.find(item => compatible(item) && placeholder(item));
    if (!item) item = form[add]();
    used.add(item.getId());
    savedIds[key] = item.getId();
    // Existing generic Items need casting; add methods already return typed questions.
    const question = typeof item[cast] === 'function' ? item[cast]() : item;
    question.setTitle(EVENT_FIELDS[key]);
    question.setHelpText(help);
    question.setRequired(required);
    if (key === 'date') question.setIncludesYear(true);
    if (key === 'programme') question.setChoiceValues(EVENT_PROGRAMMES);
    if (key === 'registrationUrl' || key === 'link') question.setValidation(urlValidation);
    form.moveItem(item, index);
  });
  properties.setProperty(propertyKey, JSON.stringify(savedIds));
  const unusedPlaceholders = form.getItems().filter(item => !used.has(item.getId()) && placeholder(item));
  // Only remove unused placeholders from a Form that has never received a submission.
  if (unusedPlaceholders.length && form.getResponses().length === 0) {
    unusedPlaceholders.forEach(item => form.deleteItem(item));
  } else if (unusedPlaceholders.length) {
    Logger.log('Existing submissions were preserved. Review the extra unnamed questions in the Form editor.');
  }
}

function readEvents_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(EVENT_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const tz = spreadsheet.getSpreadsheetTimeZone();
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift().map(h => String(h).trim());
  const approved = headers.indexOf(APPROVED_HEADER);
  const text = (row, key) => {
    const position = headers.indexOf(EVENT_FIELDS[key]);
    return position < 0 ? '' : row[position];
  };
  return rows
    .filter(row => approved >= 0 && String(row[approved]).trim().toLowerCase() === 'yes')
    .map(row => {
      const date = text(row, 'date');
      const time = text(row, 'time');
      return {
        published: true,
        title: String(text(row, 'title')).trim(),
        date: date instanceof Date ? Utilities.formatDate(date, tz, 'yyyy-MM-dd') : '',
        time: time instanceof Date ? Utilities.formatDate(time, tz, 'h:mm a') : String(time).trim(),
        location: String(text(row, 'location')).trim(),
        programme: String(text(row, 'programme')).trim(),
        description: String(text(row, 'description')).trim(),
        registrationUrl: String(text(row, 'registrationUrl')).trim(),
        link: String(text(row, 'link')).trim()
      };
    })
    .filter(event => event.title && event.date);
}

function readOutreach_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('outreach');
  if (!sheet) return [];
  const keys = ['title', 'school', 'date', 'location', 'programme', 'summary', 'attendance', 'image', 'imageAlt', 'gallery', 'story'];
  const rows = sheet.getDataRange().getDisplayValues();
  const headers = rows.shift();
  return rows.filter(row => String(row[headers.indexOf('published')]).toLowerCase() === 'true').map(row => {
    const record = { published: true };
    keys.forEach(key => {
      const position = headers.indexOf(key);
      record[key] = position < 0 ? '' : row[position].trim();
    });
    record.gallery = record.gallery.split('|').map(value => value.trim()).filter(Boolean).slice(0, 8);
    const attendance = Number(record.attendance.replace(/,/g, ''));
    record.attendance = Number.isInteger(attendance) && attendance > 0 ? attendance : null;
    return record;
  });
}

function doGet() {
  const id = PropertiesService.getScriptProperties().getProperty('CONTENT_SHEET_ID');
  if (!id) throw new Error('Run setupWebsiteContent and setupEventsForm before deploying.');
  const spreadsheet = SpreadsheetApp.openById(id);
  const result = { events: readEvents_(spreadsheet), outreach: readOutreach_(spreadsheet), products: readShopProducts_(spreadsheet) };
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

const SHOP_SHEET_NAME = 'Shop submissions';
const SHOP_FIELDS = {
  name: 'Product name', description: 'Product description', price: 'Price in GHS (optional)',
  sizes: 'Sizes or options (optional)', availability: 'Availability',
  photoLinks: 'Photo links (optional)', videoLink: 'Video link (optional)',
  photos: 'Product photos', video: 'Product video (optional)'
};

function setupShopForm() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from the Foundation content Sheet.');
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('CONTENT_SHEET_ID', spreadsheet.getId());
  const id = properties.getProperty('SHOP_FORM_ID');
  const form = id ? FormApp.openById(id) : FormApp.create('Add a Hilth shop product');
  if (!id) properties.setProperty('SHOP_FORM_ID', form.getId());
  const destinationId = formDestinationId_(form);
  if (destinationId && destinationId !== spreadsheet.getId()) {
    throw new Error('This shop Form belongs to another spreadsheet.');
  }
  properties.setProperty('SHOP_FORM_ID', form.getId());
  form.setTitle('Add a Hilth shop product');
  form.setDescription('For Hilth staff only. Submit one product per response. Submissions publish automatically. Uploaded product photos and videos are made publicly viewable for the shop. Only upload media intended for public display. Edit the existing Sheet row to update a product rather than submitting a duplicate.');
  form.setCollectEmail(false);
  form.setConfirmationMessage('Your product has been submitted to the shop. Refresh the shop after a short moment to see it.');
  const specs = [
    ['name', 'TEXT', 'addTextItem', 'asTextItem', true, 'Example: Hilth T-shirt. This is the public product name.'],
    ['description', 'PARAGRAPH_TEXT', 'addParagraphTextItem', 'asParagraphTextItem', true, 'A short description for customers. Do not include private contact or payment information.'],
    ['price', 'TEXT', 'addTextItem', 'asTextItem', false, 'Enter a number only, for example 100 or 75.50. Currency is GHS. Leave blank to show Price on enquiry.'],
    ['sizes', 'TEXT', 'addTextItem', 'asTextItem', false, 'Example: S, M, L, XL or available colours. Leave blank if not applicable.'],
    ['availability', 'MULTIPLE_CHOICE', 'addMultipleChoiceItem', 'asMultipleChoiceItem', true, 'Use Coming soon or Sold out for items customers cannot currently order.'],
    ['photoLinks', 'PARAGRAPH_TEXT', 'addParagraphTextItem', 'asParagraphTextItem', false, 'Optional alternative to uploading photos. One public image URL or Google Drive sharing link per line.'],
    ['videoLink', 'TEXT', 'addTextItem', 'asTextItem', false, 'Optional alternative to uploading a video. Paste a public https:// link.']
  ];
  const key = 'SHOP_FIELD_IDS_' + form.getId();
  const ids = JSON.parse(properties.getProperty(key) || '{}');
  const used = new Set();
  specs.forEach(([field, type, add, cast, required, help], index) => {
    const compatible = item => !used.has(item.getId()) && item.getType() === FormApp.ItemType[type];
    const items = form.getItems();
    let item = items.find(item => compatible(item) && item.getId() === ids[field])
      || items.find(item => compatible(item) && item.getTitle() === SHOP_FIELDS[field]);
    if (!item) item = form[add]();
    used.add(item.getId()); ids[field] = item.getId();
    // Existing generic Items need casting; add methods already return typed questions.
    const question = typeof item[cast] === 'function' ? item[cast]() : item;
    question.setTitle(SHOP_FIELDS[field]).setHelpText(help).setRequired(required);
    if (field === 'availability') question.setChoiceValues(['Available', 'Coming soon', 'Sold out', 'Hidden']);
    // New shop questions are appended in this order. Avoid moveItem here: the Apps Script runtime can reject typed question objects.
  });
  properties.setProperty(key, JSON.stringify(ids));
  if (!destinationId) form.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  SpreadsheetApp.flush();
  const sheet = spreadsheet.getSheets().find(sheet => {
    const url = sheet.getFormUrl();
    return url && (url.includes(form.getId()) || url === form.getPublishedUrl());
  });
  if (!sheet) throw new Error('Response tab is not ready. Run setupShopForm again in a few seconds.');
  const existing = spreadsheet.getSheetByName(SHOP_SHEET_NAME);
  if (existing && existing.getSheetId() !== sheet.getSheetId()) throw new Error('Another tab already uses Shop submissions.');
  sheet.setName(SHOP_SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  let column = headers.indexOf('Publication status') + 1;
  if (!column) {
    column = sheet.getLastColumn() + 1;
    if (column > sheet.getMaxColumns()) sheet.insertColumnAfter(sheet.getMaxColumns());
    sheet.getRange(1, column).setValue('Publication status');
  }
  sheet.getRange(1, column).setNote('Automatic media processing status. Do not edit. Change Availability to Hidden to remove a product.');
  const hasTrigger = ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'publishShopSubmission' && trigger.getTriggerSourceId() === spreadsheet.getId());
  if (!hasTrigger) ScriptApp.newTrigger('publishShopSubmission').forSpreadsheet(spreadsheet).onFormSubmit().create();
  sheet.setFrozenRows(1);
  Logger.log('Staff product Form: ' + form.getPublishedUrl());
  Logger.log('Edit Form: ' + form.getEditUrl());
  Logger.log('In the Form editor, add File upload questions named Product photos (images, up to 4 files) and Product video (optional) (video, 1 file). Then publish. Uploads require Google sign-in.');
}

function shopMediaLinks_(value, photo) {
  return String(value || '').split(/[\n,|]+/).map(link => link.trim()).filter(Boolean).map(link => {
    // Convert only observed Google Drive sharing links, not arbitrary strings, to public image previews.
    const match = link.match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/([\w-]+)|(?:open|uc|thumbnail)\?[^\s]*?id=([\w-]+))/);
    if (match) {
      const id = match[1] || match[2];
      return photo ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000' : 'https://drive.google.com/file/d/' + id + '/view';
    }
    return /^https:\/\//i.test(link) || /^assets\/images\/[\w./-]+$/.test(link) ? link : '';
  }).filter(Boolean).slice(0, photo ? 4 : 1);
}

function readShopProducts_(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(SHOP_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift().map(value => String(value).trim());
  const read = (row, header) => {
    const column = headers.indexOf(header);
    return column < 0 ? '' : String(row[column]).trim();
  };
  return rows.filter(row => read(row, 'Publication status') === 'Published').map(row => {
    const priceText = read(row, SHOP_FIELDS.price);
    const price = /^\d+(?:\.\d{1,2})?$/.test(priceText) ? Number(priceText) : null;
    return {
      published: true, name: read(row, SHOP_FIELDS.name), description: read(row, SHOP_FIELDS.description),
      price: Number.isFinite(price) && price >= 0 ? price : null, currency: 'GHS',
      sizes: read(row, SHOP_FIELDS.sizes), availability: read(row, SHOP_FIELDS.availability) || 'Available',
      images: shopMediaLinks_([read(row, SHOP_FIELDS.photos), read(row, SHOP_FIELDS.photoLinks)].filter(Boolean).join('\n'), true),
      video: shopMediaLinks_(read(row, SHOP_FIELDS.video) || read(row, SHOP_FIELDS.videoLink), false)[0] || ''
    };
  }).filter(product => product.name && product.description && ['Available', 'Coming soon', 'Sold out'].includes(product.availability));
}

// Installed by setupShopForm. Runs as the Foundation owner after a staff submission.
function publishShopSubmission(event) {
  if (!event || !event.range) throw new Error('This runs after a shop Form submission. Use refreshShopMedia to process existing rows.');
  const sheet = event.range.getSheet();
  if (sheet.getName() !== SHOP_SHEET_NAME) return;
  publishShopRow_(sheet, event.range.getRow());
}
function refreshShopMedia() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHOP_SHEET_NAME);
  if (!sheet) throw new Error('Run setupShopForm first.');
  for (let row = 2; row <= sheet.getLastRow(); row++) publishShopRow_(sheet, row);
}
function publishShopRow_(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const statusColumn = headers.indexOf('Publication status') + 1;
  if (!statusColumn) throw new Error('Run setupShopForm to add the publication status column.');
  try {
    [SHOP_FIELDS.photos, SHOP_FIELDS.video, SHOP_FIELDS.photoLinks, SHOP_FIELDS.videoLink].forEach(header => {
      const value = values[headers.indexOf(header)] || '';
      String(value).split(/[\n,|]+/).forEach(link => {
        const match = link.trim().match(/^https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/([\w-]+)|(?:open|uc|thumbnail)\?[^\s]*?id=([\w-]+))/);
        if (!match) return;
        const file = DriveApp.getFileById(match[1] || match[2]);
        const mime = file.getMimeType();
        if (!/^(image|video)\//.test(mime) || mime === 'image/svg+xml') throw new Error('Use JPG, PNG, WebP or video files for shop media.');
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      });
    });
    sheet.getRange(row, statusColumn).setValue('Published');
  } catch (error) {
    sheet.getRange(row, statusColumn).setValue('Media error: ' + error.message);
    console.error(error);
  }
}

// Google throws instead of returning null for a newly created, unlinked Form.
function formDestinationId_(form) {
  try {
    return form.getDestinationId();
  } catch (error) {
    if (/no response destination/i.test(String(error.message))) return null;
    throw error;
  }
}
