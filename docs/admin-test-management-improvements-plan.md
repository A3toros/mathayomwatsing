# Admin Test Management Improvements Plan

## Overview
This plan outlines improvements to the Admin Test Management section:
1. Cache busting for test data
2. Checkbox selection for bulk deletion
3. "Delete Marked" button for batch operations

## Current Implementation

### Files Involved:
- `src/admin/AdminCabinet.jsx` - Main admin component
- `functions/get-all-tests.js` - API endpoint for fetching all tests
- `functions/delete-test.js` - API endpoint for deleting tests

### Current Flow:
1. **Load Tests**: `loadActualTests()` calls `/.netlify/functions/get-all-tests`
2. **Delete Test**: `deleteTest()` calls `/.netlify/functions/delete-test` then refreshes list

## Requirements

### 1. Cache Busting

#### 1.1 When "Get All Tests" is Pressed
**Current Issue**: Browser/API might cache the response, showing stale data.

**Solution**: Add cache-busting query parameter to API call:
```javascript
const response = await apiGet(`/.netlify/functions/get-all-tests?t=${Date.now()}`);
```

**Location**: `src/admin/AdminCabinet.jsx` - `loadActualTests()` function (line ~840)

#### 1.2 When Each Test is Deleted
**Current Issue**: After deletion, the list might not refresh properly due to caching.

**Solution**: 
- Add cache-busting to `loadActualTests()` call after deletion
- Or add timestamp parameter when refreshing

**Location**: `src/admin/AdminCabinet.jsx` - `deleteTest()` function (line ~866)

### 2. Checkbox Column

#### 2.1 State Management
**New State**:
```javascript
const [selectedTests, setSelectedTests] = useState(new Set());
```

**Location**: After existing state declarations (around line ~135)

#### 2.2 Checkbox Handler
**Functions**:
```javascript
const handleTestSelect = (testId, testType, teacherId) => {
  const key = `${testType}-${testId}-${teacherId}`;
  setSelectedTests(prev => {
    const next = new Set(prev);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return next;
  });
};

const handleSelectAll = () => {
  if (selectedTests.size === filteredActualTests.length) {
    setSelectedTests(new Set());
  } else {
    const keys = filteredActualTests.map(test => 
      `${test.test_type}-${test.test_id}-${test.teacher_id}`
    );
    setSelectedTests(new Set(keys));
  };
};
```

#### 2.3 Table Header Update
**Add checkbox column as first column**:
```jsx
<th className={STYLES.tableHeaderCell}>
  <input
    type="checkbox"
    checked={selectedTests.size === filteredActualTests.length && filteredActualTests.length > 0}
    onChange={handleSelectAll}
    className="cursor-pointer"
  />
</th>
```

**Location**: `src/admin/AdminCabinet.jsx` - Table header (around line ~2253)

#### 2.4 Table Row Update
**Add checkbox in each row**:
```jsx
<td className={STYLES.tableCell}>
  <input
    type="checkbox"
    checked={selectedTests.has(`${test.test_type}-${test.test_id}-${test.teacher_id}`)}
    onChange={() => handleTestSelect(test.test_id, test.test_type, test.teacher_id)}
    className="cursor-pointer"
  />
</td>
```

**Location**: `src/admin/AdminCabinet.jsx` - Table body (around line ~2264)

### 3. "Delete Marked" Button

#### 3.1 Button Placement
**Location**: Next to "All Tests (22 of 22)" heading

**Behavior**:
- Button appears when **ANY** tests are selected (1 or more checkboxes checked)
- Button text shows count: "Delete Marked (X)" where X is the number of selected tests
- Button will delete **ALL** selected tests (whether 1, 2, or 100+)
- If only 1 test is selected, button still appears and deletes that single test
- Button disappears when no tests are selected (all checkboxes unchecked)

**Update**:
```jsx
<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
  <div className="flex items-center gap-4">
    <h4 className="text-lg font-semibold text-gray-700">
      All Tests ({filteredActualTests.length} of {allActualTests.length})
    </h4>
    {selectedTests.size > 0 && (
      <Button
        variant="danger"
        onClick={handleDeleteMarked}
        className="text-sm px-4 py-2"
      >
        Delete Marked ({selectedTests.size})
      </Button>
    )}
  </div>
  {/* Existing filter controls */}
</div>
```

**Location**: `src/admin/AdminCabinet.jsx` - Around line ~2217

#### 3.2 Delete Marked Function
**Implementation**:
```javascript
const handleDeleteMarked = useCallback(async () => {
  if (selectedTests.size === 0) return;
  
  if (!confirm(`Are you sure you want to delete ${selectedTests.size} test(s)?`)) {
    return;
  }
  
  try {
    const deletePromises = Array.from(selectedTests).map(key => {
      const [testType, testId, teacherId] = key.split('-');
      return apiPost('/.netlify/functions/delete-test', {
        test_id: parseInt(testId),
        test_type: testType,
        teacher_id: teacherId
      });
    });
    
    await Promise.all(deletePromises);
    
    setNotification({
      type: 'success',
      message: `Successfully deleted ${selectedTests.size} test(s)!`
    });
    
    // Clear selection
    setSelectedTests(new Set());
    
    // Refresh list with cache busting
    await loadActualTests();
  } catch (error) {
    console.error('Error deleting marked tests:', error);
    setNotification({
      type: 'error',
      message: 'Failed to delete some tests. Please try again.'
    });
  }
}, [selectedTests, apiPost, loadActualTests]);
```

**Location**: `src/admin/AdminCabinet.jsx` - After `deleteTest()` function (around line ~874)

## Implementation Steps

1. **Add cache busting to `loadActualTests()`**
   - Update API call to include timestamp parameter

2. **Add selected tests state**
   - Add `selectedTests` state variable

3. **Add checkbox handlers**
   - `handleTestSelect()` - Toggle individual test selection
   - `handleSelectAll()` - Toggle all tests selection

4. **Update table header**
   - Add checkbox column header with "select all" functionality

5. **Update table rows**
   - Add checkbox in first column of each row

6. **Add "Delete Marked" button**
   - Add button next to "All Tests" heading
   - Show only when tests are selected

7. **Implement bulk delete**
   - Add `handleDeleteMarked()` function
   - Delete all selected tests in parallel
   - Clear selection after success
   - Refresh list with cache busting

8. **Update cache busting in `deleteTest()`**
   - Ensure `loadActualTests()` uses cache busting when called after deletion

## Testing Checklist

- [ ] Cache busting works when "Get All Tests" is pressed
- [ ] Cache busting works after individual test deletion
- [ ] Checkbox selection works for individual tests
- [ ] "Select All" checkbox works correctly
- [ ] "Delete Marked" button appears when tests are selected
- [ ] "Delete Marked" button disappears when no tests selected
- [ ] Bulk deletion works for multiple tests
- [ ] Selection is cleared after bulk deletion
- [ ] List refreshes correctly after bulk deletion
- [ ] Error handling works for failed deletions

## Notes

- The cache busting uses `Date.now()` to generate unique timestamps
- The checkbox selection uses a `Set` for efficient lookup and management
- The bulk delete uses `Promise.all()` for parallel deletion
- The "Delete Marked" button only shows when tests are selected for better UX

