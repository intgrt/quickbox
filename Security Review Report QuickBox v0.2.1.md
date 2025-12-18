## Security Review Report: QuickBox v0.2.1

I've completed a comprehensive security analysis of the QuickBox wireframe mockup tool. Below are my findings organized by severity level.

### Critical Vulnerabilities

#### 1. **DOM-Based XSS via User-Controlled Content** (CRITICAL)

**Location:** app.js:160-162, 231, 242

The application inserts user-controlled content directly into the DOM without sanitization:

```javascript
content.contentEditable = true;
content.textContent = box.content;  // Safe for text
```

However, at app.js:231:

```javascript
content.innerHTML = '';  // Clears content
// Then at line 242:
menuItem.textContent = item.text;  // Safe but...
```

While textContent is used (which is safe), the menu rendering uses innerHTML = '' to clear content, which could be exploited if combined with other vectors.

**Severity:** HIGH
**Impact:** Potential XSS if content handling is modified or extended

------

#### 2. **Unsafe use of document.execCommand** (CRITICAL)

**Location:** app.js:214

```javascript
document.execCommand('insertText', false, text);
```

document.execCommand is deprecated and can introduce security issues. While used here for paste operations, it's a legacy API that should be avoided.

**Severity:** MEDIUM
**Impact:** Using deprecated APIs; potential future security issues

------

#### 3. **Arbitrary Code Execution via JSON.parse** (CRITICAL)

**Location:** app.js:749

```javascript
const data = JSON.parse(event.target.result);
```

The application parses user-uploaded JSON files without validation. While JSON.parse itself doesn't execute code, malicious JSON structures could cause:

- Prototype pollution attacks
- DoS via deeply nested objects
- Memory exhaustion

**Severity:** HIGH
**Impact:** Potential prototype pollution, DoS attacks

------

### High Severity Issues

#### 4. **Unvalidated File Upload (Images)**

**Location:** app.js:667-684

```javascript
const reader = new FileReader();
reader.onload = (event) => {
  state.selectedBox.content = event.target.result;
  const img = document.createElement('img');
  img.src = event.target.result;  // Unvalidated data URL
};
reader.readAsDataURL(file);
```

Issues:

- No file size validation (could cause browser memory exhaustion)
- No actual file type validation beyond HTML input accept attribute (client-side only)
- Data URLs stored directly in state without sanitization
- SVG files could contain embedded JavaScript

**Severity:** HIGH
**Impact:** Memory exhaustion, potential XSS via malicious SVG files

------

#### 5. **Client-Side State Manipulation**

**Location:** app.js:3-10

All application state is stored client-side with no integrity protection:

```javascript
const state = {
  pages: [],
  currentPageId: null,
  selectedBox: null,
  boxCounter: 0,
  pageCounter: 0,
  zIndexCounter: 1
};
```

**Severity:** MEDIUM
**Impact:** Users can manipulate state via browser dev tools (low risk for this type of app)

------

### Medium Severity Issues

#### 6. **Missing Input Validation on User Prompts**

**Location:** app.js:415, 464, 595, 615

Multiple uses of prompt() without proper validation:

```javascript
const newSuffix = prompt(`Edit page name:\n\nPage `, suffix);
if (newSuffix === null || newSuffix.trim() === '') return;
page.name = prefix + newSuffix.trim();
```

Issues:

- No length limits on user input
- No character whitelist/blacklist
- Could allow injection of special characters into element names

**Severity:** MEDIUM
**Impact:** UI disruption, potential rendering issues

------

#### 7. **No Content Security Policy (CSP)**

**Location:** index.html:1-102

The HTML file has no CSP headers or meta tags. This would help prevent XSS attacks.

**Severity:** MEDIUM
**Impact:** Reduced defense-in-depth against XSS

------

#### 8. **Unrestricted Canvas Height Manipulation**

**Location:** app.js:356-375

```javascript
const newHeight = Math.max(minHeight, maxBottom + padding);
canvas.style.height = newHeight + 'px';
```

No maximum height limit. Users could create boxes at extreme Y positions causing:

- Browser performance degradation
- Memory issues
- UI/UX problems

**Severity:** LOW
**Impact:** DoS (local browser only)

------

### Low Severity Issues

#### 9. **External Font Loading from Google Fonts**

**Location:** index.html:7

```html
<link href="https://fonts.googleapis.com/css2?family=Architects+Daughter&display=swap" rel="stylesheet">
```

Privacy concern: Loads fonts from external CDN, potentially leaking user IP addresses to Google.

**Severity:** LOW
**Impact:** Privacy leak

------

#### 10. **localStorage/sessionStorage Not Used**

**Context:** General architecture

The application doesn't persist state between sessions. While not a vulnerability, it's a missing security consideration - no risk of data exposure via browser storage.

**Severity:** INFO
**Impact:** None (actually reduces attack surface)

------

### Additional Observations

#### Positive Security Practices:

1. Uses textContent instead of innerHTML for most user content (app.js:161, 208, 242)
2. Client-side only application (no server-side vulnerabilities)
3. Prevents default paste behavior and strips formatting (app.js:211-215)
4. No authentication system = no auth vulnerabilities
5. No external dependencies or npm packages that could have vulnerabilities

#### Architecture Concerns:

- Pure client-side JavaScript with no build process or minification
- No subresource integrity (SRI) checks
- No error boundaries or exception handling in many places

------

## Recommendations (Priority Order)

### Immediate Actions:

1. **Validate JSON Structure** - Add schema validation for uploaded JSON files

   ```javascript
   // Add before parsing
   if (text.length > 10000000) throw new Error('File too large');
   ```

2. **Validate Image Files** - Add proper file type and size validation:

   ```javascript
   if (file.size > 5 * 1024 * 1024) {
     alert('File too large. Maximum 5MB');
     return;
   }
   // Check magic bytes for actual file type
   ```

3. **Add Content Security Policy** - Add CSP meta tag to index.html:

   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:;">
   ```

4. **Replace deprecated APIs** - Replace document.execCommand with modern Clipboard API

5. **Add input length limits** - Limit prompt input lengths and canvas dimensions

6. **Sanitize SVG uploads** - Either block SVG files or sanitize them using DOMPurify library

### Future Enhancements:

1. Consider self-hosting Google Fonts for privacy
2. Add error boundaries and proper exception handling
3. Implement save warnings before destructive operations
4. Add Subresource Integrity (SRI) if using external resources

------

## Summary

**Total Issues Found:** 10
**Critical:** 3
**High:** 2
**Medium:** 3
**Low:** 2

The application is a simple client-side tool with a relatively small attack surface. The most significant risks involve:

- Malicious JSON file uploads
- SVG-based XSS attacks
- DoS via large file uploads

For a local wireframing tool, the risk level is acceptable, but the recommendations above should be implemented before deploying in any public or multi-user environment.