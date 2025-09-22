/**
 * Anti-Cheating System Test
 * 
 * Simple test to verify the anti-cheating tracking works correctly
 */

import AntiCheatingTracker from './antiCheating';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock document.hidden
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

describe('AntiCheatingTracker', () => {
  let tracker;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Create new tracker instance
    tracker = new AntiCheatingTracker('multiple_choice', 123);
  });

  afterEach(() => {
    if (tracker) {
      tracker.stopTracking();
    }
  });

  test('should initialize with correct default values', () => {
    expect(tracker.testType).toBe('multiple_choice');
    expect(tracker.testId).toBe(123);
    expect(tracker.visibilityChangeCount).toBe(0);
    expect(tracker.isCheating).toBe(false);
    expect(tracker.isTestActive).toBe(false);
    expect(tracker.hiddenDurationThreshold).toBe(10000); // 10 seconds
    expect(tracker.cheatingThreshold).toBe(2); // 2 counts
  });

  test('should start tracking correctly', () => {
    tracker.startTracking();
    expect(tracker.isTestActive).toBe(true);
  });

  test('should stop tracking correctly', () => {
    tracker.startTracking();
    tracker.stopTracking();
    expect(tracker.isTestActive).toBe(false);
  });

  test('should not count short tab switches', () => {
    tracker.startTracking();
    
    // Simulate tab hidden for 5 seconds (less than threshold)
    document.hidden = true;
    tracker.handleVisibilityChange();
    
    // Wait 5 seconds
    const hiddenStartTime = Date.now();
    tracker.hiddenStartTime = hiddenStartTime;
    
    // Simulate tab visible after 5 seconds
    document.hidden = false;
    tracker.handleVisibilityChange();
    
    expect(tracker.visibilityChangeCount).toBe(0);
    expect(tracker.isCheating).toBe(false);
  });

  test('should count tab switches over 10 seconds', () => {
    tracker.startTracking();
    
    // Simulate tab hidden
    document.hidden = true;
    tracker.handleVisibilityChange();
    
    // Simulate 11 seconds hidden
    const hiddenStartTime = Date.now() - 11000;
    tracker.hiddenStartTime = hiddenStartTime;
    
    // Simulate tab visible
    document.hidden = false;
    tracker.handleVisibilityChange();
    
    expect(tracker.visibilityChangeCount).toBe(1);
    expect(tracker.isCheating).toBe(false);
  });

  test('should flag cheating after 2 counts', () => {
    tracker.startTracking();
    
    // First count
    document.hidden = true;
    tracker.handleVisibilityChange();
    tracker.hiddenStartTime = Date.now() - 11000;
    document.hidden = false;
    tracker.handleVisibilityChange();
    
    expect(tracker.visibilityChangeCount).toBe(1);
    expect(tracker.isCheating).toBe(false);
    
    // Second count
    document.hidden = true;
    tracker.handleVisibilityChange();
    tracker.hiddenStartTime = Date.now() - 11000;
    document.hidden = false;
    tracker.handleVisibilityChange();
    
    expect(tracker.visibilityChangeCount).toBe(2);
    expect(tracker.isCheating).toBe(true);
  });

  test('should save and load data from localStorage', () => {
    tracker.startTracking();
    tracker.visibilityChangeCount = 2;
    tracker.isCheating = true;
    
    tracker.saveToStorage();
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'anti_cheating_multiple_choice_123',
      JSON.stringify({
        visibility_change_times: 2,
        caught_cheating: true,
        is_test_active: true,
        last_updated: expect.any(String)
      })
    );
  });

  test('should clear data correctly', () => {
    tracker.startTracking();
    tracker.visibilityChangeCount = 2;
    tracker.isCheating = true;
    
    tracker.clearData();
    
    expect(tracker.visibilityChangeCount).toBe(0);
    expect(tracker.isCheating).toBe(false);
    expect(tracker.isTestActive).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('anti_cheating_multiple_choice_123');
  });

  test('should get correct cheating data', () => {
    tracker.startTracking();
    tracker.visibilityChangeCount = 1;
    tracker.isCheating = false;
    
    const data = tracker.getCheatingData();
    
    expect(data).toEqual({
      visibility_change_times: 1,
      caught_cheating: false,
      is_test_active: true
    });
  });
});
