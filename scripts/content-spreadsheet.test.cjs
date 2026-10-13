const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(require('node:path').join(__dirname, 'content-spreadsheet.gs'), 'utf8');

function fixture(initial = [], responses = []) {
  let nextId = 1;
  const items = [];
  const values = {};
  const properties = {
    getProperty: key => values[key] || null,
    setProperty(key, value) { values[key] = value; return this; }
  };
  function add(type, title = '') {
    const item = {
      id: nextId++, type, title,
      getId() { return this.id; },
      getType() { return this.type; },
      getTitle() { return this.title; },
      setTitle(value) { this.title = value; return this; },
      setHelpText(value) { this.help = value; return this; },
      setRequired(value) { this.required = value; return this; },
      setIncludesYear(value) { this.includesYear = value; return this; },
      setChoiceValues(value) { this.choices = [...value]; return this; },
      setValidation(value) { this.validation = value; return this; }
    };
    ['asTextItem', 'asDateItem', 'asTimeItem', 'asMultipleChoiceItem', 'asParagraphTextItem'].forEach(method => {
      item[method] = () => item;
    });
    items.push(item);
    return item;
  }
  initial.forEach(([type, title]) => add(type, title));
  const form = {
    destination: 'sheet-id', destinationChanges: 0,
    getId: () => 'form-id',
    getItems: () => [...items],
    getResponses: () => responses,
    getEditUrl: () => 'https://docs.google.com/forms/d/form-id/edit',
    getPublishedUrl: () => 'https://docs.google.com/forms/d/e/public-id/viewform',
    getDestinationId() { return this.destination; },
    setDestination(type, id) { this.destination = id; this.destinationChanges++; },
    moveItem(item, index) { items.splice(items.indexOf(item), 1); items.splice(index, 0, item); },
    deleteItem(item) { items.splice(items.indexOf(item), 1); }
  };
  ['setTitle', 'setDescription', 'setCollectEmail', 'setConfirmationMessage'].forEach(method => {
    form[method] = () => form;
  });
  Object.entries({ addTextItem: 'TEXT', addDateItem: 'DATE', addTimeItem: 'TIME', addMultipleChoiceItem: 'MULTIPLE_CHOICE', addParagraphTextItem: 'PARAGRAPH_TEXT' }).forEach(([method, type]) => {
    // Google add methods return typed items, which do not expose asTextItem etc.
    form[method] = () => new Proxy(add(type), {
      get(target, key) { return String(key).startsWith('as') ? undefined : Reflect.get(target, key); }
    });
  });
  const headers = ['Timestamp', 'Legacy question', 'Event title', 'Date', 'Start time', 'Venue, town or Online', 'Programme', 'Short description', 'Registration link (optional)', 'More information link (optional)'];
  const sheet = {
    name: 'Event submissions',
    getName() { return this.name; },
    setName(name) { this.name = name; },
    getSheetId: () => 1,
    getFormUrl: () => form.getEditUrl(),
    getLastColumn: () => headers.length,
    getMaxColumns: () => 26,
    getMaxRows: () => 1000,
    setFrozenRows() {},
    getRange(row, column) {
      return {
        getDisplayValues: () => [[...headers]],
        setValue(value) { headers[column - 1] = value; return this; },
        setNote() {},
        setDataValidation() {}
      };
    }
  };
  const spreadsheet = {
    getId: () => 'sheet-id',
    getSheets: () => [sheet],
    getSheetByName: name => name === sheet.name ? sheet : null
  };
  const validation = { requireTextIsUrl() { return this; }, setHelpText() { return this; }, requireValueInList() { return this; }, setAllowInvalid() { return this; }, build() { return this; } };
  const context = vm.createContext({
    FormApp: { ItemType: Object.fromEntries(['TEXT', 'DATE', 'TIME', 'MULTIPLE_CHOICE', 'PARAGRAPH_TEXT'].map(type => [type, type])), DestinationType: { SPREADSHEET: 'SPREADSHEET' }, createTextValidation: () => validation, openById: () => form, create: () => { throw new Error('Unexpected duplicate Form creation'); } },
    PropertiesService: { getScriptProperties: () => properties },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, flush() {}, newDataValidation: () => validation },
    Logger: { log() {} }
  });
  vm.runInContext(source, context);
  return { context, form, items, properties, headers, sheet };
}

test('repairs unlabeled questions with examples and stable IDs on repeated setup', () => {
  const f = fixture([['TEXT', 'Question'], ['DATE', ''], ['TIME', 'Untitled Question']]);
  const originalIds = f.items.map(item => item.id);
  f.context.configureEventQuestions_(f.form, f.properties);
  assert.equal(f.items.length, 8);
  assert.deepEqual(f.items.slice(0, 3).map(item => item.id), originalIds);
  assert.deepEqual(f.items.map(item => item.title), ['Event title', 'Date', 'Start time', 'Venue, town or Online', 'Programme', 'Short description', 'Registration link (optional)', 'More information link (optional)']);
  assert.ok(f.items.every(item => item.help));
  assert.deepEqual(f.items.map(item => item.required), [true, true, true, true, true, true, false, false]);
  assert.equal(f.items[1].includesYear, true);
  const ids = f.items.map(item => item.id);
  f.items[0].title = 'Question';
  f.context.configureEventQuestions_(f.form, f.properties);
  assert.deepEqual(f.items.map(item => item.id), ids);
  assert.equal(f.items[0].title, 'Event title');
});

test('preserves extra question data when the Form already has responses', () => {
  const f = fixture([['TEXT', 'Event title'], ['TEXT', 'Question'], ['TEXT', 'Question'], ['TEXT', 'Question'], ['TEXT', 'Question'], ['TEXT', 'Question']], [{ submitted: true }]);
  const ids = f.items.map(item => item.id);
  f.context.configureEventQuestions_(f.form, f.properties);
  assert.ok(ids.every(id => f.items.some(item => item.id === id)));
});

test('reuses the stored Form and appends approval without overwriting response columns', () => {
  const f = fixture();
  f.properties.setProperty('EVENT_FORM_ID', 'form-id');
  const existingHeaders = [...f.headers];
  f.context.setupEventsForm();
  f.context.setupEventsForm();
  assert.deepEqual(f.headers.slice(0, existingHeaders.length), existingHeaders);
  assert.equal(f.headers.at(-1), 'Approved');
  assert.equal(f.headers.filter(header => header === 'Approved').length, 1);
  assert.equal(f.form.destinationChanges, 0);
  assert.equal(f.items.length, 8);
});

test('refuses to modify a Form linked to a different spreadsheet', () => {
  const f = fixture([['TEXT', 'Question']]);
  f.properties.setProperty('EVENT_FORM_ID', 'form-id');
  f.form.destination = 'another-sheet';
  assert.throws(() => f.context.setupEventsForm(), /another spreadsheet/);
  assert.equal(f.items[0].title, 'Question');
});


test('links a new event Form when Google throws for a missing destination', () => {
  const f = fixture();
  f.properties.setProperty('EVENT_FORM_ID', 'form-id');
  f.form.destination = null;
  f.form.getDestinationId = function () {
    if (!this.destination) throw new Error('Exception: The form currently has no response destination.');
    return this.destination;
  };
  f.context.setupEventsForm();
  assert.equal(f.form.destination, 'sheet-id');
  assert.equal(f.form.destinationChanges, 1);
});

test('creates and reuses a shop Form with no response destination', () => {
  const f = fixture();
  let creations = 0, triggers = 0;
  f.sheet.name = 'Shop submissions';
  f.form.destination = null;
  f.form.getDestinationId = function () {
    if (!this.destination) throw new Error('Exception: The form currently has no response destination.');
    return this.destination;
  };
  f.context.FormApp.create = () => { creations++; return f.form; };
  f.form.moveItem = () => { throw new Error('Shop setup must not reorder typed question items.'); };
  const trigger = { getHandlerFunction: () => 'publishShopSubmission', getTriggerSourceId: () => 'sheet-id' };
  const builder = { forSpreadsheet() { return this; }, onFormSubmit() { return this; }, create() { triggers++; } };
  f.context.ScriptApp = { getProjectTriggers: () => triggers ? [trigger] : [], newTrigger: () => builder };
  f.context.setupShopForm();
  f.context.setupShopForm();
  assert.equal(creations, 1);
  assert.equal(triggers, 1);
  assert.equal(f.form.destinationChanges, 1);
  assert.equal(f.properties.getProperty('SHOP_FORM_ID'), 'form-id');
  assert.equal(f.items.length, 7);
  assert.equal(f.headers.filter(header => header === 'Publication status').length, 1);
});

test('does not mask destination access errors', () => {
  const f = fixture();
  f.form.getDestinationId = () => { throw new Error('Permission denied'); };
  assert.throws(() => f.context.formDestinationId_(f.form), /Permission denied/);
});
