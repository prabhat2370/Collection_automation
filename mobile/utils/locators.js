/**
 * Centralized Flutter semantics locators (content-desc / visible text).
 *
 * These are PLACEHOLDERS. Walk the Ripplr DMS app with Appium Inspector
 * (Phase 1 verification step) and update each value to match the actual
 * content-desc string Flutter exposes for that widget. If a widget has
 * no semantics, ask the dev team to add a Semantics(label: ...) wrapper
 * around it rather than falling back to brittle XPath.
 *
 * WebdriverIO accessibility-id syntax: `~<content-desc>` (the leading ~).
 * Text-based fallback (use sparingly): `//*[@text='...']`.
 */

export const LOCATORS = {
    landing: {
        collectionModule: '//*[contains(@content-desc, "Collect Outstanding Value")]',
        chequeBounceModule: '//*[contains(@content-desc, "Recover Cheque Bounce Value")]',
    },

    roleSelect: {
        salesman: '~Salesman',
    },

    postLoginHome: {
        collectionCard: '//*[contains(@content-desc, "Update Collection")]',
    },

    login: {
        mobileInput: '//android.widget.EditText',
        nextBtn: '//android.view.View[@content-desc="Next"]',
        pinInput: '//android.widget.EditText',
        loginBtn: '//android.view.View[@content-desc="Login"]',
    },

    invoiceList: {
        searchInput: '//android.widget.EditText',
        invoiceRow: (invoiceNo) => `//*[contains(@content-desc, "${invoiceNo}")]`,
    },

    collection: {
        paymentCollectionTab: '//*[starts-with(@content-desc, "Payment Collection")]',
        invoiceAdjustmentTab: '//*[starts-with(@content-desc, "Invoice Adjustment")]',
        cashInput: '//android.widget.EditText',

        // Cheque
        addChequeBtn: '~Add Cheque',
        chequeAmount: '//android.widget.FrameLayout[@resource-id="android:id/content"]/android.widget.FrameLayout/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.widget.EditText[1]',
        chequeRefNumber: '//*[@content-desc="6 characters remaining"]/..',
        chequeBankDropdown: '//android.view.View[starts-with(@content-desc, "Bank Name")]',
        chequeBankOption: (bankName) => `//android.widget.Button[@content-desc="${bankName}"]`,
        chequeDueDate: '//android.view.View[starts-with(@content-desc, "Due Date")]',
        datePickerOkBtn: '//android.widget.Button[@content-desc="OK"]',
        chequeFormSaveBtn: '//android.widget.Button[@content-desc="Save"]',
        chequeFormCancelBtn: '~Cancel',

        // UPI
        scanQRBtn: '~Scan QR / Add UPI',
        addManuallyHere: '//*[contains(@content-desc, "Problem with QR? Add Manually")]',
        upiAmount: '//android.widget.FrameLayout[@resource-id="android:id/content"]/android.widget.FrameLayout/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.widget.EditText[1]',
        upiRefNumber: '//android.widget.FrameLayout[@resource-id="android:id/content"]/android.widget.FrameLayout/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.widget.EditText[2]',
        upiSaveBtn: '~Add UPI',

        // NEFT/RTGS
        addNeftBtn: '//android.widget.Button[@content-desc="Add NEFT/RTGS"]',
        neftAmount: '//android.widget.FrameLayout[@resource-id="android:id/content"]/android.widget.FrameLayout/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.widget.EditText[1]',
        neftRefNumber: '//android.widget.FrameLayout[@resource-id="android:id/content"]/android.widget.FrameLayout/android.view.View/android.view.View/android.view.View/android.view.View/android.view.View/android.widget.EditText[2]',
        neftSaveBtn: '//android.widget.Button[@content-desc="Save"]',

        proceedToAdjustment: '~Proceed to Adjustment',
        totalAmount: (amount) => `~Total: ₹${amount}`,

        // Adjustment screen
        autoBtn: '~Auto',
        manualBtn: '~Manual',
        reasonBtn: '//*[starts-with(@content-desc, "Reason *")]',
        saveBtn: '~Save',
        updateBtn: '~Update',
        clearBtn: '~Clear',

        // Legacy / future use
        splitReason: '~split_reason_dropdown',
        shopClosedOption: '//*[contains(@content-desc, "Shop Permanently Closed")]',
        finalSubmitBtn: '~Proceed to Adjustment',
        submitCollectionDiv: '//*[contains(@content-desc, "Submit Collection")]',
        skipWithoutReturnsBtn: '//*[@content-desc="Skip without returns"]',
        confirmationBtn: (answer) => `//*[contains(@content-desc, "${answer}")]`,
    },
};
