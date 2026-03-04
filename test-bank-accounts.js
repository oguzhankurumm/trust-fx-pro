const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const screenshotsDir = path.join(__dirname, 'test-screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  let testResults = [];

  try {
    console.log('\n=== TASK 1: Admin - Add Bank Account ===\n');
    
    // Step 1: Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3000/giris');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: true });
    testResults.push('✓ Login page loaded successfully');

    // Step 2: Login with admin credentials
    console.log('2. Logging in with admin credentials...');
    await page.fill('input[type="email"]', 'admin@trustfx.pro');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.screenshot({ path: path.join(screenshotsDir, '02-login-filled.png'), fullPage: true });
    
    await page.click('button:has-text("Giriş Yap")');
    
    // Wait for navigation or error message
    try {
      await Promise.race([
        page.waitForURL(url => url.includes('/panel') || url.includes('/admin'), { timeout: 5000 }),
        page.waitForSelector('text=/hata|error|geçersiz/i', { timeout: 5000 })
      ]);
    } catch (e) {
      console.log('Waiting for navigation or error...');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '03-after-login.png'), fullPage: true });
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('/panel') || currentUrl.includes('/admin')) {
      testResults.push('✓ Successfully logged in as admin');
    } else {
      testResults.push('✗ Login failed - still on login page: ' + currentUrl);
      
      // Check for error messages
      const pageContent = await page.textContent('body');
      if (pageContent.includes('hata') || pageContent.includes('error')) {
        console.log('Error message found on page');
      }
      
      // Continue anyway to see what happens
      console.log('Continuing test despite login issue...');
    }

    // Step 3: Navigate to bank accounts admin page
    console.log('3. Navigating to bank accounts admin page...');
    try {
      await page.goto('http://localhost:3000/admin/banka-hesaplari');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '04-bank-accounts-page.png'), fullPage: true });
      
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
    } catch (e) {
      testResults.push('✗ Failed to load bank accounts page: ' + e.message);
      throw e;
    }

    // Step 4: Click "Yeni Hesap Ekle"
    console.log('4. Clicking "Yeni Hesap Ekle" button...');
    const addButton = await page.locator('button:has-text("Yeni Hesap Ekle"), a:has-text("Yeni Hesap Ekle")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '05-add-account-modal.png'), fullPage: true });
      testResults.push('✓ Add account form opened');
    } else {
      testResults.push('✗ "Yeni Hesap Ekle" button not found');
    }

    // Step 5: Fill in bank account details
    console.log('5. Filling in bank account details...');
    await page.fill('input[name="bankName"], input[placeholder*="Banka"], input[id*="banka"]', 'Ziraat Bankası');
    await page.fill('input[name="iban"], input[placeholder*="IBAN"], input[id*="iban"]', 'TR320010009999901234567890');
    await page.fill('input[name="accountHolder"], input[placeholder*="Hesap Sahibi"], input[id*="hesap"]', 'TrustFX Pro A.Ş.');
    await page.fill('input[name="swift"], input[placeholder*="SWIFT"], input[id*="swift"]', 'TCZBTR2A');
    await page.screenshot({ path: path.join(screenshotsDir, '06-form-filled.png'), fullPage: true });
    testResults.push('✓ Form filled with bank details');

    // Step 6: Submit the form
    console.log('6. Submitting the form...');
    await page.click('button[type="submit"]:has-text("Kaydet"), button:has-text("Ekle"), button:has-text("Oluştur")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '07-after-submit.png'), fullPage: true });
    
    // Check if account appears in table
    const tableContent = await page.textContent('body');
    if (tableContent.includes('Ziraat Bankası')) {
      testResults.push('✓ Bank account successfully added and appears in table');
    } else {
      testResults.push('⚠ Could not verify if bank account was added to table');
    }

    console.log('\n=== TASK 2: Admin - Edit and Delete ===\n');

    // Step 8: Click edit button
    console.log('8. Clicking edit button...');
    const editButton = await page.locator('button[title*="Düzenle"], button:has-text("Düzenle"), svg[class*="pencil"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '08-edit-modal.png'), fullPage: true });
      testResults.push('✓ Edit modal opened');

      // Step 9: Change bank name
      console.log('9. Changing bank name...');
      await page.fill('input[name="bankName"], input[placeholder*="Banka"], input[id*="banka"]', 'Ziraat Bankası A.Ş.');
      await page.screenshot({ path: path.join(screenshotsDir, '09-edit-filled.png'), fullPage: true });
      
      await page.click('button[type="submit"]:has-text("Kaydet"), button:has-text("Güncelle")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotsDir, '10-after-edit.png'), fullPage: true });
      testResults.push('✓ Bank account updated');
    } else {
      testResults.push('✗ Edit button not found');
    }

    // Step 10: Click delete button
    console.log('10. Clicking delete button...');
    const deleteButton = await page.locator('button[title*="Sil"], button:has-text("Sil"), svg[class*="trash"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, '11-delete-confirm.png'), fullPage: true });
      
      // Confirm delete
      const confirmButton = await page.locator('button:has-text("Evet"), button:has-text("Onayla"), button:has-text("Sil")').last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotsDir, '12-after-delete.png'), fullPage: true });
        testResults.push('✓ Bank account deleted');
      }
    } else {
      testResults.push('✗ Delete button not found');
    }

    console.log('\n=== TASK 3: User - Deposit Page ===\n');

    // Step 12: Navigate to wallet/deposit page
    console.log('12. Navigating to wallet page...');
    await page.goto('http://localhost:3000/panel/cuzdan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '13-wallet-page.png'), fullPage: true });
    
    const walletContent = await page.textContent('body');
    if (walletContent.includes('Banka Hesaplarımız') || walletContent.includes('banka')) {
      testResults.push('✓ Wallet page loaded with bank accounts section');
    } else {
      testResults.push('⚠ Wallet page loaded but bank accounts section not clearly visible');
    }

    // Step 14: Try selecting a bank account if available
    console.log('14. Checking for bank account selection...');
    const bankAccountSelector = await page.locator('select, [role="combobox"], button:has-text("Banka")').first();
    if (await bankAccountSelector.isVisible()) {
      await bankAccountSelector.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(screenshotsDir, '14-bank-select.png'), fullPage: true });
      testResults.push('✓ Bank account selector found');
    } else {
      testResults.push('⚠ Bank account selector not found or no accounts available');
    }

    console.log('\n=== TASK 4: Edge Cases ===\n');

    // Step 15: Test invalid IBAN
    console.log('15. Testing invalid IBAN validation...');
    await page.goto('http://localhost:3000/admin/banka-hesaplari');
    await page.waitForLoadState('networkidle');
    
    const addButtonAgain = await page.locator('button:has-text("Yeni Hesap Ekle"), a:has-text("Yeni Hesap Ekle")').first();
    if (await addButtonAgain.isVisible()) {
      await addButtonAgain.click();
      await page.waitForTimeout(1000);
      
      await page.fill('input[name="bankName"], input[placeholder*="Banka"], input[id*="banka"]', 'Test Bank');
      await page.fill('input[name="iban"], input[placeholder*="IBAN"], input[id*="iban"]', 'INVALID123');
      await page.fill('input[name="accountHolder"], input[placeholder*="Hesap Sahibi"], input[id*="hesap"]', 'Test Holder');
      await page.fill('input[name="swift"], input[placeholder*="SWIFT"], input[id*="swift"]', 'TESTSWIF');
      await page.screenshot({ path: path.join(screenshotsDir, '15-invalid-iban.png'), fullPage: true });
      
      await page.click('button[type="submit"]:has-text("Kaydet"), button:has-text("Ekle"), button:has-text("Oluştur")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(screenshotsDir, '16-validation-error.png'), fullPage: true });
      
      const errorContent = await page.textContent('body');
      if (errorContent.includes('geçersiz') || errorContent.includes('hata') || errorContent.includes('error')) {
        testResults.push('✓ IBAN validation error displayed correctly');
      } else {
        testResults.push('⚠ IBAN validation error not clearly visible');
      }
    }

    console.log('\n=== TEST RESULTS ===\n');
    testResults.forEach(result => console.log(result));
    console.log(`\nScreenshots saved to: ${screenshotsDir}`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ path: path.join(screenshotsDir, 'error.png'), fullPage: true });
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
