# Hierarchy & Perspective API

This document describes the hierarchy and perspective endpoints.

## Hierarchy

- GET `/api/hierarchy/tree`
  - Returns the hierarchy tree for the current perspective (or self if no perspective).

- GET `/api/hierarchy/descendants/:employeeId`
  - Returns all descendants for the specified employee.

- GET `/api/hierarchy/ancestors/:employeeId`
  - Returns the reporting chain (managers) for the specified employee.

- GET `/api/hierarchy/available-perspectives`
  - Returns the list of employees the current authenticated user can switch into (self + descendants).

## Perspective

- POST `/api/perspectives/switch`
  - Body: `{ "targetUserId": "emp_101" }`
  - Switches the authenticated user's current perspective to the specified user, if allowed.

- POST `/api/perspectives/reset`
  - Resets the perspective to self.

- GET `/api/perspectives/current`
  - Returns the user's active perspective row (if any).

## Rules & Notes

- Switching perspective does not change authentication. The JWT identity remains the authenticated user (`req.viewer`). The `effectiveUser` determines data scoping (attached to `req.effectiveUser`).
- Only descendants may be switched into. Peers or ancestors are forbidden.
- All perspective switches create an `AuditLog` entry with action `PERSPECTIVE_SWITCH`.

## Examples

Switch perspective (fetch):

```js
await fetch("/api/perspectives/switch", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer <token>",
  },
  body: JSON.stringify({ targetUserId: "emp_101" }),
});
```

Get available perspectives:

```js
await fetch("/api/hierarchy/available-perspectives", {
  headers: { Authorization: "Bearer <token>" },
});
```
