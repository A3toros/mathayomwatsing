# Simple Token Storage Approach for React Native/Expo

## Overview
This document analyzes a simpler, more practical approach to token storage for React Native/Expo apps, focusing on reliability without over-engineering.

## Current State

### Web App (React/Vite)
- Uses `localStorage` for token storage
- Has corruption issues on weak/old computers
- Uses `tokenManager.js` with backup system

### Expo App (MWSExpo)
- Uses `AsyncStorage` from `@react-native-async-storage/async-storage`
- Currently uses `useLocalStorage` hook
- Token storage likely in `AsyncStorage` (not secure)

## Recommended Approach

### 1. Use expo-secure-store for Tokens (Expo App)

**Why**: 
- ✅ Encrypted storage (more secure than AsyncStorage)
- ✅ Async operations (non-blocking)
- ✅ Designed specifically for sensitive data
- ✅ Better reliability on weak devices

**Implementation**:
```typescript
import * as SecureStore from 'expo-secure-store';

export async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    
    // Verify write succeeded
    const verify = await SecureStore.getItemAsync(key);
    return verify === value;
  } catch (e) {
    console.warn('Storage write failed', e);
    return false;
  }
}
```

**Sensibility for Your App**: ✅ **High**
- Tokens are sensitive (should be encrypted)
- Current AsyncStorage is not encrypted
- Easy to implement (just change storage method)
- Solves encryption + reliability issues

### 2. Use AsyncStorage for General Cached Data

**Why**:
- ✅ Good for non-sensitive data (test progress, cache, etc.)
- ✅ Already in use in your app
- ✅ Sufficient for large data

**Keep Current**: `MWSExpo/src/hooks/useLocalStorage.ts` already uses AsyncStorage

**Sensibility for Your App**: ✅ **High**
- Already implemented
- Works well for non-sensitive data
- No changes needed

### 3. Add Lightweight Integrity Checks

**Why**:
- ✅ Simple hash verification
- ✅ Detects silent corruption
- ✅ Not over-engineered (just hash comparison)

**Implementation**:
```typescript
import * as Crypto from 'expo-crypto';

async function hashValue(value: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, 
    value
  );
}

export async function storeWithHash(key: string, value: string): Promise<boolean> {
  try {
    const hash = await hashValue(value);
    await SecureStore.setItemAsync(`${key}_hash`, hash);
    const stored = await safeSetItem(key, value);
    return stored;
  } catch (e) {
    console.warn('Failed to store with hash', e);
    return false;
  }
}

export async function verifyHash(key: string): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(key);
    const storedHash = await SecureStore.getItemAsync(`${key}_hash`);
    
    if (!value || !storedHash) return false;
    
    const hash = await hashValue(value);
    return hash === storedHash;
  } catch (e) {
    console.warn('Hash verification failed', e);
    return false;
  }
}
```

**Sensibility for Your App**: ✅ **Medium-High**
- Simple to implement
- Only adds hash storage/verification
- Detects corruption without complex checksums
- **Note**: Need to add `expo-crypto` package

### 4. Simple Retry Logic

**Why**:
- ✅ Simple retry with fixed delay
- ✅ No complex exponential backoff
- ✅ Handles transient failures

**Implementation**:
```typescript
async function retryWrite(
  fn: () => Promise<boolean>, 
  retries: number = 3, 
  delay: number = 200
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const ok = await fn();
    if (ok) return true;
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Usage
await retryWrite(() => safeSetItem('auth_token', token));
```

**Sensibility for Your App**: ✅ **High**
- Simple and effective
- Handles temporary failures (network, disk I/O)
- Low overhead
- Easy to understand and maintain

### 5. Auto Recovery with Last-Known-Good Copy

**Why**:
- ✅ Keeps backup of last working token
- ✅ Restores automatically if write fails
- ✅ Prevents losing authentication

**Implementation**:
```typescript
export async function safeWrite(key: string, value: string): Promise<boolean> {
  // Get last known good value
  const old = await SecureStore.getItemAsync(key);
  
  // Try to write new value
  const ok = await safeSetItem(key, value);
  
  if (!ok && old) {
    // Restore last working value
    console.warn('Write failed, restoring last known good value');
    await SecureStore.setItemAsync(key, old);
    return false; // Still return false to indicate write failed
  }
  
  return ok;
}
```

**Sensibility for Your App**: ✅ **High**
- Prevents losing authentication on write failure
- Simple backup/restore mechanism
- Better UX (user doesn't get logged out)
- Minimal code

### 6. Optional: Metrics & Self-Heal

**Why**:
- ✅ Track corruption frequency
- ✅ Adjust behavior if failures are high
- ✅ Can disable heavy caching on weak devices

**Implementation**:
```typescript
// Store in AsyncStorage (not sensitive)
async function trackCorruption(key: string) {
  const corruptionKey = `corruption_count_${key}`;
  const count = await AsyncStorage.getItem(corruptionKey);
  const newCount = (parseInt(count || '0') + 1);
  await AsyncStorage.setItem(corruptionKey, newCount.toString());
  
  // If too many failures, disable heavy features
  if (newCount > 5) {
    console.warn('High corruption rate detected - switching to lighter mode');
    // Disable heavy caching, reduce integrity checks frequency, etc.
  }
}

async function resetCorruptionCount(key: string) {
  await AsyncStorage.removeItem(`corruption_count_${key}`);
}
```

**Sensibility for Your App**: ✅ **Low-Medium**
- Nice to have but not critical
- Can be added later if needed
- Useful for debugging and monitoring
- Optional enhancement

## Minor Improvements Worth Adding

### 7. Type-Safe Wrapper (SecureToken Class)

**Why**:
- ✅ Clean API for token operations
- ✅ Encapsulates get/set with retries and hash check
- ✅ Keeps contexts cleaner
- ✅ Easier to use and maintain

**Implementation**:
```typescript
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper functions (from previous sections)
async function hashValue(value: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, 
    value
  );
}

async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    const verify = await SecureStore.getItemAsync(key);
    return verify === value;
  } catch (e) {
    console.warn('Storage write failed', e);
    return false;
  }
}

async function storeWithHash(key: string, value: string): Promise<boolean> {
  try {
    const hash = await hashValue(value);
    await SecureStore.setItemAsync(`${key}_hash`, hash);
    return await safeSetItem(key, value);
  } catch (e) {
    console.warn('Failed to store with hash', e);
    return false;
  }
}

async function verifyHash(key: string): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(key);
    const storedHash = await SecureStore.getItemAsync(`${key}_hash`);
    
    if (!value || !storedHash) return false;
    
    const hash = await hashValue(value);
    return hash === storedHash;
  } catch (e) {
    console.warn('Hash verification failed', e);
    return false;
  }
}

async function retryWrite(
  fn: () => Promise<boolean>, 
  retries: number = 3, 
  delay: number = 200
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const ok = await fn();
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Main SecureToken class
export const SecureToken = {
  async set(token: string): Promise<boolean> {
    return await retryWrite(() => storeWithHash('auth_token', token));
  },

  async get(): Promise<string | null> {
    try {
      const ok = await verifyHash('auth_token');
      if (!ok) {
        console.warn('Token hash verification failed');
        return null;
      }
      return await SecureStore.getItemAsync('auth_token');
    } catch (e) {
      console.warn('Failed to get token', e);
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_token_hash');
      // Clear in-memory cache if using
      tokenCache = null;
    } catch (e) {
      console.warn('Failed to clear token', e);
    }
  }
};
```

**Sensibility for Your App**: ✅ **High**
- Cleaner code in contexts
- Easier to use (just `SecureToken.set(token)`)
- Type-safe (if using TypeScript)
- Single source of truth for token operations

### 8. Ensure Cleanup on Logout

**Why**:
- ✅ Important on shared devices
- ✅ Prevents token leakage
- ✅ Security best practice
- ✅ Fully clears SecureStore

**Implementation**:
```typescript
// In logout function (e.g., UserContext.tsx or auth service)
async function logout() {
  try {
    // Clear SecureStore tokens
    await SecureToken.clear();
    
    // Clear AsyncStorage (non-sensitive data)
    await AsyncStorage.multiRemove([
      'user_data',
      'test_progress',
      'cache_data',
      // ... other non-sensitive keys
    ]);
    
    // Clear in-memory state
    // ... reset app state
    
    console.log('✅ Logout complete - all storage cleared');
  } catch (e) {
    console.error('Logout cleanup failed', e);
    // Still proceed with logout even if cleanup fails
  }
}
```

**Sensibility for Your App**: ✅ **High**
- Critical for security
- Prevents token leakage on shared devices
- Easy to implement
- Must be done correctly

### 9. Handle SecureStore Unavailability Gracefully

**Why**:
- ✅ Rare emulators or weird Android builds might throw
- ✅ Prevents app crashes
- ✅ Graceful degradation
- ✅ Fallback to AsyncStorage (non-sensitive mode)

**Implementation**:
```typescript
let secureStoreAvailable: boolean | null = null;

async function checkSecureStoreAvailability(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }
  
  try {
    await SecureStore.setItemAsync('_test', 'test');
    await SecureStore.deleteItemAsync('_test');
    secureStoreAvailable = true;
  } catch (e) {
    console.warn('SecureStore unavailable, falling back to AsyncStorage', e);
    secureStoreAvailable = false;
  }
  
  return secureStoreAvailable;
}

export const SecureToken = {
  async set(token: string): Promise<boolean> {
    const isSecureAvailable = await checkSecureStoreAvailability();
    
    if (!isSecureAvailable) {
      // Fallback to AsyncStorage (non-sensitive mode)
      console.warn('⚠️ SecureStore unavailable - using AsyncStorage (less secure)');
      try {
        await AsyncStorage.setItem('auth_token', token);
        const verify = await AsyncStorage.getItem('auth_token');
        return verify === token;
      } catch (e) {
        console.error('AsyncStorage fallback failed', e);
        return false;
      }
    }
    
    // Normal SecureStore path
    return await retryWrite(() => storeWithHash('auth_token', token));
  },

  async get(): Promise<string | null> {
    const isSecureAvailable = await checkSecureStoreAvailability();
    
    if (!isSecureAvailable) {
      // Fallback to AsyncStorage
      try {
        return await AsyncStorage.getItem('auth_token');
      } catch (e) {
        console.error('AsyncStorage fallback read failed', e);
        return null;
      }
    }
    
    // Normal SecureStore path
    try {
      const ok = await verifyHash('auth_token');
      if (!ok) return null;
      return await SecureStore.getItemAsync('auth_token');
    } catch (e) {
      console.warn('Failed to get token', e);
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      // Clear SecureStore
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_token_hash');
    } catch (e) {
      // Ignore if SecureStore unavailable
    }
    
    try {
      // Also clear AsyncStorage fallback
      await AsyncStorage.removeItem('auth_token');
    } catch (e) {
      // Ignore if AsyncStorage unavailable
    }
    
    // Clear in-memory cache
    tokenCache = null;
  }
};
```

**Sensibility for Your App**: ✅ **Medium-High**
- Prevents crashes on rare devices
- Graceful degradation
- Better UX (app still works)
- Important for production

### 10. Optional Optimization: In-Memory Cache

**Why**:
- ✅ Avoids unnecessary async reads every render
- ✅ Faster token access
- ✅ Reduces SecureStore calls
- ✅ Better performance

**Implementation**:
```typescript
// In-memory cache
let tokenCache: string | null = null;
let hashCache: string | null = null;

export const SecureToken = {
  async set(token: string): Promise<boolean> {
    const ok = await retryWrite(() => storeWithHash('auth_token', token));
    
    if (ok) {
      // Update cache
      tokenCache = token;
      try {
        hashCache = await hashValue(token);
      } catch (e) {
        hashCache = null;
      }
    }
    
    return ok;
  },

  async get(): Promise<string | null> {
    // Return cached value if available
    if (tokenCache) {
      return tokenCache;
    }
    
    // Otherwise, read from SecureStore
    try {
      const ok = await verifyHash('auth_token');
      if (!ok) {
        tokenCache = null; // Clear cache on verification failure
        return null;
      }
      
      const token = await SecureStore.getItemAsync('auth_token');
      tokenCache = token; // Cache the value
      return token;
    } catch (e) {
      console.warn('Failed to get token', e);
      tokenCache = null;
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_token_hash');
    } catch (e) {
      // Ignore
    }
    
    // Clear cache
    tokenCache = null;
    hashCache = null;
  },

  // Clear cache manually if needed (e.g., after token refresh)
  clearCache(): void {
    tokenCache = null;
    hashCache = null;
  }
};
```

**Sensibility for Your App**: ✅ **Medium**
- Performance optimization
- Nice to have but not critical
- Reduces async calls
- Can be added later if needed

## Implementation Plan

### Phase 1: Core Protection (High Priority)

1. **Install expo-secure-store** (if not already installed)
   ```bash
   npx expo install expo-secure-store
   ```

2. **Create SecureStorage utility** (`MWSExpo/src/utils/secureStorage.ts`)
   - Implement `safeSetItem()` with write verification
   - Implement `safeGetItem()` with integrity check
   - Implement `safeWrite()` with auto-recovery

3. **Update token storage in MWSExpo**
   - Replace AsyncStorage token storage with SecureStore
   - Update `UserContext.tsx` or wherever tokens are stored
   - Keep AsyncStorage for non-sensitive data (cache, test progress)

### Phase 2: Integrity Checks (Medium Priority)

4. **Install expo-crypto** (if not already installed)
   ```bash
   npx expo install expo-crypto
   ```

5. **Add hash verification**
   - Implement `hashValue()` function
   - Implement `storeWithHash()` function
   - Implement `verifyHash()` function
   - Use for critical tokens only

### Phase 3: Reliability (Medium Priority)

6. **Add retry logic**
   - Implement `retryWrite()` function
   - Wrap token write operations with retry
   - Use for all token writes

### Phase 4: Minor Improvements (Medium Priority)

7. **Create SecureToken wrapper class**
   - Implement `SecureToken.set()` with retry and hash
   - Implement `SecureToken.get()` with hash verification
   - Implement `SecureToken.clear()` for cleanup
   - Update contexts to use `SecureToken` instead of direct SecureStore calls

8. **Add logout cleanup**
   - Ensure `SecureToken.clear()` is called on logout
   - Clear all SecureStore items on logout
   - Clear AsyncStorage non-sensitive data
   - Update logout functions in `UserContext.tsx` and auth services

9. **Handle SecureStore unavailability**
   - Add `checkSecureStoreAvailability()` function
   - Fallback to AsyncStorage if SecureStore unavailable
   - Graceful degradation for rare devices/emulators

### Phase 5: Optional Optimizations (Low Priority)

10. **Add in-memory cache**
    - Cache token after first read
    - Update cache on token set
    - Clear cache on logout/clear
    - Reduce unnecessary SecureStore calls

## Comparison: Simple vs Over-Engineered

### Simple Approach (Recommended)
- ✅ Write verification (read after write)
- ✅ Simple retry (fixed delay, 3 attempts)
- ✅ Hash verification (SHA256 hash)
- ✅ Auto-recovery (last-known-good copy)
- ✅ SecureStore for tokens (encrypted)
- ⏱️ Implementation time: 2-3 hours
- 📦 Dependencies: expo-secure-store, expo-crypto
- 🧠 Complexity: Low-Medium

### Over-Engineered Approach (Not Recommended)
- ❌ Exponential backoff (unnecessary complexity)
- ❌ Complex checksum algorithms (overkill)
- ❌ Multiple fallback storage layers (unnecessary)
- ❌ Performance-based detection (over-engineering)
- ⏱️ Implementation time: 1-2 days
- 📦 Dependencies: Multiple packages
- 🧠 Complexity: High

## Benefits for Your App

### Immediate Benefits
1. **Security**: Tokens encrypted in SecureStore
2. **Reliability**: Write verification prevents silent failures
3. **Recovery**: Auto-recovery prevents unexpected logouts
4. **Simplicity**: Easy to understand and maintain

### Long-term Benefits
1. **Less corruption**: SecureStore + write verification = fewer corruptions
2. **Better UX**: Users don't get logged out unexpectedly
3. **Maintainability**: Simple code is easier to debug
4. **Performance**: Minimal overhead, fast operations

## Migration Path

### For MWSExpo (Expo App)

1. **Create new utility file**: `MWSExpo/src/utils/secureTokenStorage.ts`
   ```typescript
   import * as SecureStore from 'expo-secure-store';
   import * as Crypto from 'expo-crypto';
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // Implement helper functions (safeSetItem, hashValue, storeWithHash, verifyHash, retryWrite)
   // Implement checkSecureStoreAvailability()
   // Implement SecureToken class with set(), get(), clear(), clearCache()
   ```

2. **Update token storage locations**:
   - Find where tokens are stored in `UserContext.tsx`
   - Replace AsyncStorage/raw SecureStore calls with `SecureToken.set()` / `SecureToken.get()`
   - Add `SecureToken.clear()` to logout function

3. **Update logout function**:
   - Add `SecureToken.clear()` call
   - Clear AsyncStorage non-sensitive data
   - Clear in-memory cache if using

4. **Keep AsyncStorage for**:
   - Test progress
   - Cache data
   - Non-sensitive app state

### For Web App (React/Vite)

**Keep current approach** but consider:
- Add write verification to `tokenManager.js`
- Add simple retry logic (3 attempts, 200ms delay)
- Keep localStorage for now (SecureStore is Expo-only)

## Recommendations

### ✅ DO:
1. Use SecureStore for tokens in Expo app
2. Implement write verification
3. Add simple retry logic
4. Add hash verification for critical tokens
5. Create SecureToken wrapper class for cleaner code
6. Ensure cleanup on logout (deleteItemAsync)
7. Handle SecureStore unavailability gracefully (fallback to AsyncStorage)
8. Keep AsyncStorage for non-sensitive data
9. Consider in-memory cache for performance

### ❌ DON'T:
1. Over-engineer with complex algorithms
2. Add unnecessary dependencies
3. Create complex fallback mechanisms
4. Add performance monitoring unless needed
5. Change working AsyncStorage usage for non-sensitive data
6. Forget to clear SecureStore on logout
7. Ignore SecureStore unavailability errors

## Conclusion

**This approach is sensible and practical** for your app because:

1. ✅ **Simple**: Easy to understand and maintain
2. ✅ **Secure**: Uses encrypted storage for tokens
3. ✅ **Reliable**: Write verification + retry handles failures
4. ✅ **Recoverable**: Auto-recovery prevents data loss
5. ✅ **Appropriate**: Right level of protection without over-engineering

**Estimated Implementation Time**: 
- Phase 1-3 (Core): 2-3 hours
- Phase 4 (Minor Improvements): 1-2 hours
- Phase 5 (Optional): 30 minutes

**Total**: 3.5-5.5 hours for all features

**Estimated Complexity**: Low-Medium
**Risk Level**: Low (well-tested Expo packages)

## Complete Implementation Example

Here's a complete, production-ready implementation combining all features:

```typescript
// MWSExpo/src/utils/secureTokenStorage.ts
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache
let tokenCache: string | null = null;
let secureStoreAvailable: boolean | null = null;

// Helper: Check if SecureStore is available
async function checkSecureStoreAvailability(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }
  
  try {
    await SecureStore.setItemAsync('_test', 'test');
    await SecureStore.deleteItemAsync('_test');
    secureStoreAvailable = true;
  } catch (e) {
    console.warn('SecureStore unavailable, falling back to AsyncStorage', e);
    secureStoreAvailable = false;
  }
  
  return secureStoreAvailable;
}

// Helper: Hash value
async function hashValue(value: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256, 
    value
  );
}

// Helper: Safe set with verification
async function safeSetItem(key: string, value: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(key, value);
    const verify = await SecureStore.getItemAsync(key);
    return verify === value;
  } catch (e) {
    console.warn('Storage write failed', e);
    return false;
  }
}

// Helper: Store with hash
async function storeWithHash(key: string, value: string): Promise<boolean> {
  try {
    const hash = await hashValue(value);
    await SecureStore.setItemAsync(`${key}_hash`, hash);
    return await safeSetItem(key, value);
  } catch (e) {
    console.warn('Failed to store with hash', e);
    return false;
  }
}

// Helper: Verify hash
async function verifyHash(key: string): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(key);
    const storedHash = await SecureStore.getItemAsync(`${key}_hash`);
    
    if (!value || !storedHash) return false;
    
    const hash = await hashValue(value);
    return hash === storedHash;
  } catch (e) {
    console.warn('Hash verification failed', e);
    return false;
  }
}

// Helper: Retry write
async function retryWrite(
  fn: () => Promise<boolean>, 
  retries: number = 3, 
  delay: number = 200
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    const ok = await fn();
    if (ok) return true;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  return false;
}

// Main SecureToken API
export const SecureToken = {
  async set(token: string): Promise<boolean> {
    const isSecureAvailable = await checkSecureStoreAvailability();
    
    // Fallback to AsyncStorage if SecureStore unavailable
    if (!isSecureAvailable) {
      console.warn('⚠️ SecureStore unavailable - using AsyncStorage (less secure)');
      try {
        await AsyncStorage.setItem('auth_token', token);
        const verify = await AsyncStorage.getItem('auth_token');
        const ok = verify === token;
        if (ok) tokenCache = token; // Update cache
        return ok;
      } catch (e) {
        console.error('AsyncStorage fallback failed', e);
        return false;
      }
    }
    
    // Normal SecureStore path with retry and hash
    const ok = await retryWrite(() => storeWithHash('auth_token', token));
    
    if (ok) {
      // Update cache
      tokenCache = token;
      try {
        const hash = await hashValue(token);
        // Hash is stored in SecureStore, no need to cache separately
      } catch (e) {
        // Ignore hash cache failure
      }
    }
    
    return ok;
  },

  async get(): Promise<string | null> {
    // Return cached value if available
    if (tokenCache) {
      return tokenCache;
    }
    
    const isSecureAvailable = await checkSecureStoreAvailability();
    
    // Fallback to AsyncStorage if SecureStore unavailable
    if (!isSecureAvailable) {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        tokenCache = token; // Cache the value
        return token;
      } catch (e) {
        console.error('AsyncStorage fallback read failed', e);
        return null;
      }
    }
    
    // Normal SecureStore path
    try {
      const ok = await verifyHash('auth_token');
      if (!ok) {
        tokenCache = null; // Clear cache on verification failure
        return null;
      }
      
      const token = await SecureStore.getItemAsync('auth_token');
      tokenCache = token; // Cache the value
      return token;
    } catch (e) {
      console.warn('Failed to get token', e);
      tokenCache = null;
      return null;
    }
  },

  async clear(): Promise<void> {
    try {
      // Clear SecureStore
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('auth_token_hash');
    } catch (e) {
      // Ignore if SecureStore unavailable
    }
    
    try {
      // Also clear AsyncStorage fallback
      await AsyncStorage.removeItem('auth_token');
    } catch (e) {
      // Ignore if AsyncStorage unavailable
    }
    
    // Clear in-memory cache
    tokenCache = null;
  },

  // Clear cache manually if needed (e.g., after token refresh)
  clearCache(): void {
    tokenCache = null;
  }
};

// Usage example:
// import { SecureToken } from '@/utils/secureTokenStorage';
// 
// // Set token
// await SecureToken.set(token);
// 
// // Get token
// const token = await SecureToken.get();
// 
// // Clear token (on logout)
// await SecureToken.clear();
```

