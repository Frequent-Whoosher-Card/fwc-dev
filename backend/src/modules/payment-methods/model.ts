import { t } from "elysia";

export const PaymentMethodModel = {
  createBody: t.Object({
    name: t.String({ minLength: 1, maxLength: 100 }),
    notes: t.Optional(t.String()),
  }),

  updateBody: t.Object({
    name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
    notes: t.Optional(t.Nullable(t.String())),
  }),

  idParam: t.Object({
    id: t.String(),
  }),
};
