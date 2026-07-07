import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APK_PATH = path.resolve(__dirname, 'apk', 'dms_v2_pre_prod_v0.1.52.apk');

export const config = {
    runner: 'local',
    specs: [path.resolve(__dirname, 'tests', '**', '*.e2e.js')],
    maxInstances: 1,

    capabilities: [{
        platformName: 'Android',
        'appium:automationName': 'UiAutomator2',
        'appium:deviceName': 'Pixel_6',
        'appium:avd': 'Pixel_6',
        'appium:platformVersion': '13',
        'appium:app': APK_PATH,
        'appium:appPackage': 'com.ripplr.dms',
        'appium:appActivity': 'com.ripplr.dms.MainActivity',
        'appium:autoGrantPermissions': true,
        'appium:noReset': false,
        'appium:fullReset': false,
        'appium:newCommandTimeout': 240,
        'appium:adbExecTimeout': 60000,
        'appium:uiautomator2ServerInstallTimeout': 60000,
        'appium:appWaitActivity': '*',
        'appium:autoLaunch': true,
        'appium:autoAcceptAlerts': true,
    }],

    logLevel: 'info',
    bail: 0,
    waitforTimeout: 15000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    services: [
        ['appium', {
            args: { relaxedSecurity: true },
            command: 'appium',
        }],
    ],

    framework: 'mocha',
    mochaOpts: {
        ui: 'bdd',
        timeout: 600000,
    },

    reporters: [
        'spec',
        ['allure', {
            outputDir: path.resolve(__dirname, '..', 'allure-results'),
            disableWebdriverStepsReporting: false,
            disableWebdriverScreenshotsReporting: false,
        }],
    ],

    afterTest: async function (test, context, { error }) {
        if (error) {
            try {
                await browser.takeScreenshot();
            } catch (e) { /* swallow */ }
        }
    },
};
