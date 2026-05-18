export async function waitAndClick(selector, timeout = 15000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    await el.click();
    return el;
}

export async function waitAndFill(selector, value, timeout = 15000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    await el.click();
    await el.clearValue().catch(() => {});
    await el.setValue(value);
    return el;
}

export async function isDisplayed(selector, timeout = 5000) {
    try {
        const el = await $(selector);
        return await el.waitForDisplayed({ timeout });
    } catch {
        return false;
    }
}

export async function hideKeyboard() {
    // NOTE: `mobile: hideKeyboard` and `browser.hideKeyboard()` press the BACK key,
    // which in Flutter apps closes the modal/sheet rather than just dismissing the
    // soft keyboard. We use the IME "done" editor action instead, which only signals
    // the IME to dismiss without going to the back stack.
    try {
        await browser.execute('mobile: performEditorAction', { action: 'done' });
    } catch { /* swallow */ }
    try {
        await browser.waitUntil(
            async () => !(await browser.isKeyboardShown()),
            { timeout: 2000, interval: 200 }
        );
    } catch { /* swallow — keyboard may still be up; caller can tap to refocus */ }
}

export async function scrollToText(text, maxSwipes = 5) {
    const selector = `android=new UiScrollable(new UiSelector().scrollable(true).instance(0)).scrollIntoView(new UiSelector().textContains("${text}"))`;
    return $(selector);
}

export async function tapByText(text) {
    const el = await $(`//*[@text='${text}']`);
    await el.waitForDisplayed({ timeout: 15000 });
    await el.click();
    return el;
}
