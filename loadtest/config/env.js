// K6 env config — picks the right base URLs based on -e ENV=<name>
// Run: k6 run -e ENV=preprod loadtest/tests/login.test.js

const ENV = __ENV.ENV || 'preprod';

const ENVS = {
  preprod: {
    webUrl: 'https://cdms-preprod.ripplr.in',
    apiUrl: 'https://api-cdms-preprod.ripplr.in',
    collectionApiUrl: 'https://api-collection-preprod.ripplr.in',
    chatbotUrl: 'http://preprod-SAMMMM-app-alb-alb-2069611663.ap-south-1.elb.amazonaws.com',
  },
  // add staging / qa / prod here when needed
};

if (!ENVS[ENV]) {
  throw new Error(`Unknown ENV "${ENV}". Valid: ${Object.keys(ENVS).join(', ')}`);
}

export const env = ENVS[ENV];

// Credentials come from env vars (never hardcode in scripts).
// Use LOAD_USERNAME / LOAD_PASSWORD to avoid colliding with the Windows
// built-in USERNAME env var (which k6 inherits into __ENV).
export const creds = {
  username: __ENV.LOAD_USERNAME || 'segobc2@ripplr.in',
  password: __ENV.LOAD_PASSWORD || 'Ripplr@123',
};

// Geo / IP context headers required by the CDMS API
export const geoHeaders = {
  'x-user-ip':        __ENV.USER_IP        || '103.242.225.82',
  'x-user-latitude':  __ENV.USER_LATITUDE  || '28.494101316774074',
  'x-user-longitude': __ENV.USER_LONGITUDE || '77.09228445136326',
};
