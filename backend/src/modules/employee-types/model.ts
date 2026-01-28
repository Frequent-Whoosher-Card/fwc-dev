import { t } from "elysia";

export const EmployeeTypeModel = {
  // Create employee type body
  createBody: t.Object({
    code: t.String({ minLength: 2, maxLength: 50 }),
    name: t.String({ minLength: 2, maxLength: 100 }),
    description: t.Optional(t.String()),
  }),

  // Update employee type body
  updateBody: t.Object({
    code: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
    name: t.Optional(t.String({ minLength: 2, maxLength: 100 })),
    description: t.Optional(t.Nullable(t.String())),
  }),

  // Params
  idParam: t.Object({
    id: t.String(),
  }),
};
