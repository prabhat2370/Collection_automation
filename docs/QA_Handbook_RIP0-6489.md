# QA Handbook — RIP0-6489: Allocation List Ageing Wrong for Ground User

## Task: Fix incorrect ageing displayed on Allocation List for ground user

**Jira Ticket:** https://zapgift.atlassian.net/browse/RIP0-6489

**Issue Type:** `Task`   **Status:** `QA`

### Bug Summary

For invoice **MNES08268**, the **Seg Allocation tab** displays an incorrect **ageing** value for the ground user. Ageing on this screen is expected to be derived as `CURRENT_DATE − status_updated_at` (start date = `status_updated_at` column, end date = current day). When the day / month / year portion of `status_updated_at` is changed in the DB, the ageing on the UI must update accordingly. Severity: Medium — affects ground user prioritisation of follow-ups and bucket-wise collection decisions.

### Test Scenarios Covered

| # | Scenario | Result |
| --- | --- | --- |
| 1 | Verify ageing displays correctly on UI in the **Seg Allocation** tab for invoice `MNES08268` | `Pass` |
| 2 | Verify ageing formula on UI equals `CURRENT_DATE − status_updated_at` — start date taken from the `status_updated_at` column, end date is the current day | `Pass` |
| 3 | Change the **day** portion of `status_updated_at` in DB → verify ageing on the Seg Allocation tab updates by the same number of days | `Pass` |
| 4 | Change the **month** portion of `status_updated_at` in DB → verify ageing on the Seg Allocation tab reflects the new month-based difference | `Pass` |
| 5 | Change the **year** portion of `status_updated_at` in DB → verify ageing on the Seg Allocation tab reflects the new year-based difference | `Pass` |
| 6 | Verify UI ageing on Seg Allocation tab matches the value computed by `DATEDIFF(NOW(), status_updated_at)` directly from the DB for the same row | `Pass` |
| 7 | Regression — multiple invoices on the Seg Allocation tab with varying `status_updated_at` dates show correct ageing across 0–30 / 31–60 / 61–90 / 90+ buckets | `Pass` |
| 8 | Verify the Seg Allocation tab reflects the updated `status_updated_at` without app restart or manual cache clear (refresh / re-open of tab is sufficient) | `Pass` |

### Sign-off

| Role | Owner |
| --- | --- |
| Backend Developer | @Hardik Mehta |
| Frontend Developer | N/A |
| QA Sign-off | @Prabhat Kumar Singh |

_QA validated on UAT —_ `5/28/2026`
