const test = require('node:test');
const assert = require('node:assert');
const { formatDate, formatDateTime } = require('../utils/dateFormatter');

test('dateFormatter - formatDate', (t) => {
    const testDate = new Date('2023-10-27T10:00:00Z');
    assert.strictEqual(formatDate(testDate), 'Oct 27, 2023');
    assert.strictEqual(formatDate(null), 'N/A');
    assert.strictEqual(formatDate('invalid-date'), 'Invalid Date');
});

test('dateFormatter - formatDateTime', (t) => {
    const testDate = new Date('2023-10-27T10:30:00Z');
    // We use a regex for dynamic parts like AM/PM which might vary by environment
    const result = formatDateTime(testDate);
    assert.ok(result.includes('Oct 27, 2023'));
    assert.ok(result.includes('10:30'));
    assert.strictEqual(formatDateTime(null), 'N/A');
});
