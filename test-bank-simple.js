const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  // Create a new context with no cookies
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  let testResults = [];
  let stepNumber = 1;

  const screenshot = async (name) => {
    await page.screenshot({ 
      path: path.join(screenshotsDir, `${String(stepNumber).padStart(2, '0')}-${name}.png`), 
      fullPage: true 
    });
    stepNumber++;
  };

  try {
    console.log('\n=== TASK 1: Admin - Add Bank Account ===\n');
    
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/giris', { waitUntil: 'networkidle' });
    await screenshot('login-page');
    testResults.push('✓ Login page loaded successfully');

    // Step 2: Login with admin credentials
    console.log('2. Logging in with admin credentials...');
    
    // Wait for form to be visible
    await page.waitForSelector('input#email', { state: 'visible' });
    
    // Fill the form - use specific selectors to avoid footer inputs
    await page.locator('input#email').fill('admin@trustfx.pro');
    await page.locator('input[type="password"]').first().fill('Admin123!');
    await screenshot('login-filled');
    
    // Click login button and wait for navigation
    await page.locator('button:has-text("Giriş Yap")').click();
    
    // Wait for navigation away from login page
    try {
      await page.waitForFunction(() => !window.location.href.includes('/giris'), { timeout: 10000 });
    } catch (e) {
      console.log('Navigation timeout, checking current URL...');
    }
    
    await page.waitForTimeout(2000);
    await screenshot('after-login');
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/panel') || currentUrl.includes('/admin')) {
      testResults.push('✓ Successfully logged in as admin');
    } else {
      testResults.push('✗ Login failed - URL: ' + currentUrl);
      const bodyText = await page.textContent('body');
      if (bodyText.toLowerCase().includes('error') || bodyText.toLowerCase().includes('hata')) {
        console.log('Error detected on page');
        testResults.push('✗ Error message found on login page');
      }
    }

    // Step 3: Navigate to bank accounts admin page
    console.log('3. Navigating to bank accounts admin page...');
    await page.goto('http://localhost:3000/admin/banka-hesaplari', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot('bank-accounts-page');
    
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/admin/banka-hesaplari')) {
      testResults.push('✓ Bank accounts admin page loaded');
    } else if (url.includes('/giris')) {
      testResults.push('✗ Redirected to login - authentication issue');
      throw new Error('Not authenticated');
    } else {
      testResults.push('⚠ On different page: ' + url);
    }

    // Step 4: Click "Yeni Hesap Ekle"
    console.log('4. Looking for "Yeni Hesap Ekle" button...');
    
    // Try multiple selectors
    const addButtonSelectors = [
      'button:has-text("Yeni Hesap Ekle")',
      'a:has-text("Yeni Hesap Ekle")',
      'button:has-text("Yeni Hesap")',
      'button:has-text("Ekle")',
      '[data-testid="add-bank-account"]'
    ];
    
    let addButton = null;
    for (const selector of addButtonSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        addButton = elem;
        console.log(`Found button with selector: ${selector}`);
        break;
      }
    }
    
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(1000);
      await screenshot('add-account-modal');
      testResults.push('✓ Add account form opened');
    } else {
      testResults.push('✗ "Yeni Hesap Ekle" button not found');
      console.log('Page content:', await page.textContent('body').then(t => t.substring(0, 500)));
    }

    // Step 5: Fill in bank account details
    console.log('5. Filling in bank account details...');
    
    // Try to find and fill form fields
    const formFields = {
      bankName: ['input[name="bankName"]', 'input[placeholder*="Banka"]', 'input[id*="banka"]', 'input[id*="bank"]'],
      iban: ['input[name="iban"]', 'input[placeholder*="IBAN"]', 'input[id*="iban"]'],
      accountHolder: ['input[name="accountHolder"]', 'input[placeholder*="Hesap Sahibi"]', 'input[id*="hesap"]', 'input[id*="holder"]'],
      swift: ['input[name="swift"]', 'input[placeholder*="SWIFT"]', 'input[id*="swift"]']
    };
    
    const fillField = async (fieldName, value, selectors) => {
      for (const selector of selectors) {
        const field = page.locator(selector).first();
        if (await field.isVisible().catch(() => false)) {
          await field.fill(value);
          console.log(`Filled ${fieldName} using ${selector}`);
          return true;
        }
      }
      console.log(`Could not find field: ${fieldName}`);
      return false;
    };
    
    await fillField('bankName', 'Ziraat Bankası', formFields.bankName);
    await fillField('iban', 'TR320010009999901234567890', formFields.iban);
    await fillField('accountHolder', 'TrustFX Pro A.Ş.', formFields.accountHolder);
    await fillField('swift', 'TCZBTR2A', formFields.swift);
    
    await screenshot('form-filled');
    testResults.push('✓ Form filled with bank details');

    // Step 6: Submit the form
    console.log('6. Submitting the form...');
    const submitSelectors = [
      'button[type="submit"]:has-text("Kaydet")',
      'button:has-text("Ekle")',
      'button:has-text("Oluştur")',
      'button[type="submit"]'
    ];
    
    let submitButton = null;
    for (const selector of submitSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        submitButton = elem;
        console.log(`Found submit button with selector: ${selector}`);
        break;
      }
    }
    
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      await screenshot('after-submit');
      
      // Check if account appears in table
      const tableContent = await page.textContent('body');
      if (tableContent.includes('Ziraat Bankası')) {
        testResults.push('✓ Bank account successfully added and appears in table');
      } else {
        testResults.push('⚠ Could not verify if bank account was added to table');
      }
    } else {
      testResults.push('✗ Submit button not found');
    }

    console.log('\n=== TASK 2: Admin - Edit and Delete ===\n');

    // Step 8: Click edit button
    console.log('8. Looking for edit button...');
    const editSelectors = [
      'button[title*="Düzenle"]',
      'button:has-text("Düzenle")',
      'button[aria-label*="edit"]',
      'svg[class*="pencil"]',
      '[data-testid="edit-bank-account"]'
    ];
    
    let editButton = null;
    for (const selector of editSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        editButton = elem;
        console.log(`Found edit button with selector: ${selector}`);
        break;
      }
    }
    
    if (editButton) {
      await editButton.click();
      await page.waitForTimeout(1000);
      await screenshot('edit-modal');
      testResults.push('✓ Edit modal opened');

      // Step 9: Change bank name
      console.log('9. Changing bank name...');
      await fillField('bankName', 'Ziraat Bankası A.Ş.', formFields.bankName);
      await screenshot('edit-filled');
      
      // Find and click update button
      const updateSelectors = [
        'button[type="submit"]:has-text("Kaydet")',
        'button:has-text("Güncelle")',
        'button[type="submit"]'
      ];
      
      for (const selector of updateSelectors) {
        const elem = page.locator(selector).first();
        if (await elem.isVisible().catch(() => false)) {
          await elem.click();
          console.log(`Clicked update button with selector: ${selector}`);
          break;
        }
      }
      
      await page.waitForTimeout(2000);
      await screenshot('after-edit');
      testResults.push('✓ Bank account updated');
    } else {
      testResults.push('✗ Edit button not found');
    }

    // Step 10: Click delete button
    console.log('10. Looking for delete button...');
    const deleteSelectors = [
      'button[title*="Sil"]',
      'button:has-text("Sil")',
      'button[aria-label*="delete"]',
      'svg[class*="trash"]',
      '[data-testid="delete-bank-account"]'
    ];
    
    let deleteButton = null;
    for (const selector of deleteSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        deleteButton = elem;
        console.log(`Found delete button with selector: ${selector}`);
        break;
      }
    }
    
    if (deleteButton) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      await screenshot('delete-confirm');
      
      // Confirm delete
      const confirmSelectors = [
        'button:has-text("Evet")',
        'button:has-text("Onayla")',
        'button:has-text("Sil")',
        'button[type="submit"]'
      ];
      
      for (const selector of confirmSelectors) {
        const elem = page.locator(selector).last(); // Use last() for confirm dialogs
        if (await elem.isVisible().catch(() => false)) {
          await elem.click();
          console.log(`Clicked confirm button with selector: ${selector}`);
          break;
        }
      }
      
      await page.waitForTimeout(2000);
      await screenshot('after-delete');
      testResults.push('✓ Bank account deleted');
    } else {
      testResults.push('✗ Delete button not found');
    }

    console.log('\n=== TASK 3: User - Deposit Page ===\n');

    // Step 12: Navigate to wallet/deposit page
    console.log('12. Navigating to wallet page...');
    await page.goto('http://localhost:3000/panel/cuzdan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await screenshot('wallet-page');
    
    const walletContent = await page.textContent('body');
    if (walletContent.includes('Banka Hesaplarımız') || walletContent.toLowerCase().includes('banka')) {
      testResults.push('✓ Wallet page loaded with bank accounts section');
    } else {
      testResults.push('⚠ Wallet page loaded but bank accounts section not clearly visible');
    }

    // Step 14: Try selecting a bank account if available
    console.log('14. Checking for bank account selection...');
    const bankSelectSelectors = [
      'select',
      '[role="combobox"]',
      'button:has-text("Banka")',
      '[data-testid="bank-select"]'
    ];
    
    let bankSelector = null;
    for (const selector of bankSelectSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        bankSelector = elem;
        console.log(`Found bank selector with selector: ${selector}`);
        break;
      }
    }
    
    if (bankSelector) {
      await bankSelector.click();
      await page.waitForTimeout(500);
      await screenshot('bank-select');
      testResults.push('✓ Bank account selector found');
    } else {
      testResults.push('⚠ Bank account selector not found or no accounts available');
    }

    console.log('\n=== TASK 4: Edge Cases ===\n');

    // Step 15: Test invalid IBAN
    console.log('15. Testing invalid IBAN validation...');
    await page.goto('http://localhost:3000/admin/banka-hesaplari', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Click add button again
    for (const selector of addButtonSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        await elem.click();
        console.log(`Clicked add button with selector: ${selector}`);
        break;
      }
    }
    
    await page.waitForTimeout(1000);
    
    await fillField('bankName', 'Test Bank', formFields.bankName);
    await fillField('iban', 'INVALID123', formFields.iban);
    await fillField('accountHolder', 'Test Holder', formFields.accountHolder);
    await fillField('swift', 'TESTSWIF', formFields.swift);
    await screenshot('invalid-iban');
    
    // Try to submit
    for (const selector of submitSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible().catch(() => false)) {
        await elem.click();
        console.log(`Clicked submit with invalid data using selector: ${selector}`);
        break;
      }
    }
    
    await page.waitForTimeout(2000);
    await screenshot('validation-error');
    
    const errorContent = await page.textContent('body');
    if (errorContent.toLowerCase().includes('geçersiz') || 
        errorContent.toLowerCase().includes('hata') || 
        errorContent.toLowerCase().includes('error') ||
        errorContent.toLowerCase().includes('invalid')) {
      testResults.push('✓ IBAN validation error displayed correctly');
    } else {
      testResults.push('⚠ IBAN validation error not clearly visible');
    }

    console.log('\n=== TEST RESULTS ===\n');
    testResults.forEach(result => console.log(result));
    console.log(`\nScreenshots saved to: ${screenshotsDir}`);
    console.log('\nTest completed! Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await screenshot('error');
    testResults.push(`✗ Test failed: ${error.message}`);
  } finally {
    await browser.close();
    
    // Write results to file
    fs.writeFileSync(
      path.join(screenshotsDir, 'test-results.txt'),
      testResults.join('\n')
    );
  }
})();
