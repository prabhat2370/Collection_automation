// Reusable check sets so individual tests stay readable.

export const isOk = {
  'status 200':       (r) => r.status === 200,
  'response < 1s':    (r) => r.timings.duration < 1000,
  'no error in body': (r) => !/error|exception/i.test(r.body || ''),
};

export const isCreated = {
  'status 201':       (r) => r.status === 201,
  'response < 2s':    (r) => r.timings.duration < 2000,
};
