import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');
const BASE_URL = 'http://localhost:3000';

const ADMIN_CREDENTIALS = {
  email: 'admin@trustfx.pro',
  password: 'Admin123!'
};

const USER_CREDENTIALS = {
  email: 'kullanici@trustfx.pro',
  password: 'User123!'
};

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL';
  notes: string;
}

const results: TestResult[] = [];

async function takeScreenshot(page: Page, name: string) {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

async function addResult(step: string, status: 'PASS' | 'FAIL', notes: string) {
  results.push({ step, status, notes });
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${step}: ${notes}`);
}

async function login(page: Page, email: string, password: string, role: string) {
  console.log(`\n🔐 Logging in as ${role}...`);
  
  await page.goto(`${BASE_URL}/giris`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  await takeScreenshot(page, `${role.toLowerCase()}-login-form-filled`);
  
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  await takeScreenshot(page, `${role.toLowerCase()}-login-result`);
}

async function logout(page: Page) {
  console.log('\n🚪 Logging out...');
  try {
    const logoutButton = await page.locator('text=Çıkış Yap').first();
    if (await logoutButton.isVisible({ timeout: 2000 })) {
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto(`${BASE_URL}/giris`);
    }
  } catch (error) {
    await page.goto(`${BASE_URL}/giris`);
  }
}

async function runTests() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser: Browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page: Page = await context.newPage();

  try {
    // STEP 1: Admin Login
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1 — Admin Login');
    console.log('='.repeat(60));
    
    try {
      await login(page, ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password, 'Admin');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/admin')) {
        await addResult('Step 1: Admin Login', 'PASS', `Redirected to ${currentUrl}`);
      } else {
        await addResult('Step 1: Admin Login', 'FAIL', `Expected /admin URL, got ${currentUrl}`);
      }
    } catch (error) {
      await addResult('Step 1: Admin Login', 'FAIL', `Error: ${error}`);
    }

    // STEP 2: Admin Bank Accounts Page
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2 — Admin: Bank Accounts Page');
    console.log('='.repeat(60));
    
    try {
      await page.goto(`${BASE_URL}/admin/banka-hesaplari`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'admin-bank-accounts-page');
      
      const heading = await page.locator('h1:has-text("Banka Hesapları")').first();
      const addButton = await page.locator('button:has-text("Yeni Hesap Ekle")').first();
      
      if (await heading.isVisible() && await addButton.isVisible()) {
        await addResult('Step 2: Bank Accounts Page', 'PASS', 'Page loaded with heading and "Yeni Hesap Ekle" button');
      } else {
        await addResult('Step 2: Bank Accounts Page', 'FAIL', 'Missing heading or add button');
      }
    } catch (error) {
      await addResult('Step 2: Bank Accounts Page', 'FAIL', `Error: ${error}`);
    }

    // STEP 3: Admin Add Bank Account
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3 — Admin: Add Bank Account');
    console.log('='.repeat(60));
    
    try {
      await page.click('button:has-text("Yeni Hesap Ekle")');
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'admin-add-modal-opened');
      
      // Fill form fields
      await page.fill('input[name="bankName"]', 'Ziraat Bankası');
      await page.fill('input[name="iban"]', 'TR320010009999901234567890');
      await page.fill('input[name="accountHolder"]', 'TrustFX Pro AS');
      await page.fill('input[name="swiftCode"]', 'TCZBTR2A');
      
      await takeScreenshot(page, 'admin-add-modal-filled');
      
      await page.click('button:has-text("Ekle")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await takeScreenshot(page, 'admin-add-result');
      
      const ziraatRow = await page.locator('text=Ziraat Bankası').first();
      if (await ziraatRow.isVisible({ timeout: 5000 })) {
        await addResult('Step 3: Add Bank Account', 'PASS', 'Ziraat Bankası added successfully');
      } else {
        await addResult('Step 3: Add Bank Account', 'FAIL', 'Account not visible in table');
      }
    } catch (error) {
      await addResult('Step 3: Add Bank Account', 'FAIL', `Error: ${error}`);
    }

    // STEP 4: Admin Edit Bank Account
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4 — Admin: Edit Bank Account');
    console.log('='.repeat(60));
    
    try {
      // Find and click edit button (pencil icon)
      const editButton = await page.locator('button[aria-label*="Düzenle"], button:has(svg.lucide-pencil)').first();
      await editButton.click();
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'admin-edit-modal-opened');
      
      // Clear and update bank name
      await page.fill('input[name="bankName"]', '');
      await page.fill('input[name="bankName"]', 'Ziraat Bankası AS');
      
      await takeScreenshot(page, 'admin-edit-modal-filled');
      
      await page.click('button:has-text("Kaydet")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await takeScreenshot(page, 'admin-edit-result');
      
      const updatedRow = await page.locator('text=Ziraat Bankası AS').first();
      if (await updatedRow.isVisible({ timeout: 5000 })) {
        await addResult('Step 4: Edit Bank Account', 'PASS', 'Bank name updated to "Ziraat Bankası AS"');
      } else {
        await addResult('Step 4: Edit Bank Account', 'FAIL', 'Updated name not visible');
      }
    } catch (error) {
      await addResult('Step 4: Edit Bank Account', 'FAIL', `Error: ${error}`);
    }

    // STEP 5: User Login
    console.log('\n' + '='.repeat(60));
    console.log('STEP 5 — User Login');
    console.log('='.repeat(60));
    
    try {
      await logout(page);
      await page.waitForTimeout(1000);
      
      await login(page, USER_CREDENTIALS.email, USER_CREDENTIALS.password, 'User');
      
      const currentUrl = page.url();
      if (currentUrl.includes('/panel')) {
        await addResult('Step 5: User Login', 'PASS', `Redirected to ${currentUrl}`);
      } else {
        await addResult('Step 5: User Login', 'FAIL', `Expected /panel URL, got ${currentUrl}`);
      }
    } catch (error) {
      await addResult('Step 5: User Login', 'FAIL', `Error: ${error}`);
    }

    // STEP 6: User Deposit Page
    console.log('\n' + '='.repeat(60));
    console.log('STEP 6 — User: Deposit Page');
    console.log('='.repeat(60));
    
    try {
      await page.goto(`${BASE_URL}/panel/cuzdan`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await takeScreenshot(page, 'user-deposit-page');
      
      const bankAccountsSection = await page.locator('text=Banka Hesaplarımız').first();
      const ziraatCard = await page.locator('text=Ziraat Bankası AS').first();
      
      if (await bankAccountsSection.isVisible() && await ziraatCard.isVisible()) {
        await addResult('Step 6: Deposit Page', 'PASS', 'Bank accounts section visible with Ziraat Bankası AS card');
        
        // Click to select the bank account
        await ziraatCard.click();
        await page.waitForTimeout(500);
        
        await takeScreenshot(page, 'user-bank-account-selected');
        
        // Fill amount
        await page.fill('input[name="amount"]', '1000');
        await page.waitForTimeout(500);
        
        await takeScreenshot(page, 'user-deposit-form-filled');
        
        await addResult('Step 6: Fill Deposit Form', 'PASS', 'Selected Ziraat Bankası AS and entered 1000 TL');
      } else {
        await addResult('Step 6: Deposit Page', 'FAIL', 'Bank accounts section or Ziraat card not visible');
      }
    } catch (error) {
      await addResult('Step 6: Deposit Page', 'FAIL', `Error: ${error}`);
    }

    // STEP 7: User Submit Deposit
    console.log('\n' + '='.repeat(60));
    console.log('STEP 7 — User: Submit Deposit');
    console.log('='.repeat(60));
    
    try {
      await page.click('button:has-text("Yatırım Talebi Gönder")');
      await page.waitForTimeout(2000);
      
      await takeScreenshot(page, 'user-deposit-submitted');
      
      // Check for success toast or message
      const successToast = await page.locator('text=başarı, text=success, text=gönderildi').first();
      const toastVisible = await successToast.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (toastVisible) {
        await addResult('Step 7: Submit Deposit', 'PASS', 'Success message displayed');
      } else {
        // Check if form was cleared (indicates success)
        const amountInput = await page.locator('input[name="amount"]').first();
        const value = await amountInput.inputValue();
        if (value === '' || value === '0') {
          await addResult('Step 7: Submit Deposit', 'PASS', 'Form cleared after submission');
        } else {
          await addResult('Step 7: Submit Deposit', 'FAIL', 'No success indication found');
        }
      }
    } catch (error) {
      await addResult('Step 7: Submit Deposit', 'FAIL', `Error: ${error}`);
    }

    // STEP 8: Validate IBAN Copy
    console.log('\n' + '='.repeat(60));
    console.log('STEP 8 — Validate IBAN Copy');
    console.log('='.repeat(60));
    
    try {
      // Refresh the page to reset state
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const copyButton = await page.locator('button:has-text("Kopyala")').first();
      await copyButton.click();
      await page.waitForTimeout(1000);
      
      await takeScreenshot(page, 'user-iban-copied');
      
      // Check for "Kopyalandı" feedback
      const copiedFeedback = await page.locator('text=Kopyalandı').first();
      if (await copiedFeedback.isVisible({ timeout: 3000 })) {
        await addResult('Step 8: IBAN Copy', 'PASS', '"Kopyalandı" feedback displayed');
      } else {
        await addResult('Step 8: IBAN Copy', 'FAIL', 'No copy feedback found');
      }
    } catch (error) {
      await addResult('Step 8: IBAN Copy', 'FAIL', `Error: ${error}`);
    }

  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
  } finally {
    await browser.close();
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('\n| Step | Status | Notes |');
  console.log('|------|--------|-------|');
  
  results.forEach(result => {
    console.log(`| ${result.step} | ${result.status} | ${result.notes} |`);
  });
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Passed: ${passCount}/${results.length}`);
  console.log(`❌ Failed: ${failCount}/${results.length}`);
  console.log('='.repeat(60));
  
  console.log(`\n📁 Screenshots saved in: ${SCREENSHOTS_DIR}`);
}

runTests().catch(console.error);
