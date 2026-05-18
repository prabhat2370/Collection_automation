import { LoginPage } from '../web/pages/LoginPage.js';
import { CollectionPage } from '../web/pages/collectionPage.js';
import { USERS } from '../test-data/users.js';

export async function loginAs(page, role) {
    if (role === 'collection') return loginCollection(page);
    return loginCdms(page, role);
}

async function loginCdms(page, role) {
    const user = USERS[role];
    if (!user) throw new Error(`Unknown CDMS role: "${role}"`);
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.emailInput.fill(user.email);
    await loginPage.passwordInput.fill(user.password);
    await loginPage.loginBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return loginPage;
}

async function loginCollection(page) {
    const cp = new CollectionPage(page);
    await cp.navigate();
    await cp.fillMobile(USERS.collection.mobile);
    await cp.clickSubmit();
    await cp.fillPin(USERS.collection.pin);
    await cp.clickSubmit();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    return cp;
}

export async function logout(page) {
    const loginPage = new LoginPage(page);
    await loginPage.logout();
}
