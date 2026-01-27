# Frontend Guide: Inbox & Stock Flow

This guide explains how to handle Inbox items and their Lifecycle in the frontend.

## 1. Supervisor Flow (Receiving Stock)

**Scenario**: Office sends stock to a Station.

### Inbox Item Details

- **Type**: `STOCK_DISTRIBUTION`
- **Sender**: Office Staff (Admin)
- **Title**: "Kiriman Stock: [Product Name]"
- **Message**: "Office mengirimkan 100 kartu..."

### Frontend Action

1.  **Display**: Show as a "Task" or "Notification".
2.  **Action**: When clicked, navigate the Supervisor to the **Validation Page**.
    - **Route**: `/stock/in/validate/[movementId]`
    - **Movement ID**: Available in `item.payload.movementId`.
    - **Note**: Do **not** resolve the inbox item immediately when clicked. It is resolved automatically when they finish the validation form.
3.  **Status Handling**:
    - If `item.payload.status === "PENDING"` -> Show **"Butuh Validasi"** / **"Action Required"**.
    - If `item.payload.status === "COMPLETED"` -> Show **"Selesai"** (Green tick).

---

## 2. Admin Flow (Issue Approval)

**Scenario**: Supervisor validates stock but reports **Missing (Lost)** or **Damaged** items.

### Inbox Item Details

- **Type**: `STOCK_ISSUE_APPROVAL`
- **Sender**: Supervisor
- **Title**: "Laporan Validasi Stock Out - [Station Name]"
- **Message**: "Laporan dari Station A: 90 Diterima, 5 HILANG, 5 RUSAK..."

### Frontend Action

1.  **Display**: Highlight this as **"Urgent"** or **"Issue"**.
2.  **Action**: When clicked, show a **Dialog/Modal** to approve the report.
    - Display the counts from `item.payload` (Lost: 5, Damaged: 5).
    - Button **"Approve Report"**: Calls API `POST /inbox/approval` with `action: "APPROVE"`.
    - Button **"Reject"**: Calls API with `action: "REJECT"`.
3.  **Status Handling**:
    - Check `item.title`.
    - If title contains `[RESOLVED: APPROVE]` -> Show **"Approved"** badge.
    - If title contains `[RESOLVED: REJECT]` -> Show **"Rejected"** badge.
    - Else -> Show **"Pending Approval"**.

---

## 3. General Notification (Low Stock, Reports)

**Scenario**: Standard reports or alerts (e.g., Stock Out Validated successfully with no issues).

### Inbox Item Details

- **Type**: `STOCK_OUT_REPORT` or `LOW_STOCK`
- **Frontend Action**:
  - Simple **"Mark as Read"** when clicked.
  - No specific navigation required, but can link to `movementId` if present.

## Summary Table

| Inbox Type             | Target User | Action Required? | On Click              | Completed Status Source |
| :--------------------- | :---------- | :--------------- | :-------------------- | :---------------------- |
| `STOCK_DISTRIBUTION`   | Supervisor  | **YES**          | Go to Validation Form | `payload.status`        |
| `STOCK_ISSUE_APPROVAL` | Admin       | **YES**          | Open Approval Dialog  | Title (`[RESOLVED]`)    |
| `STOCK_OUT_REPORT`     | Admin       | No               | Mark Read             | `isRead`                |
| `LOW_STOCK`            | Admin       | No               | Mark Read             | `isRead`                |
