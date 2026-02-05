import { Elysia } from "elysia";
import { PaymentMethodService } from "./service";
import { PaymentMethodModel } from "./model";
import { authMiddleware } from "../../middleware/auth";
import { permissionMiddleware } from "../../middleware/permission";

const viewRoutes = new Elysia()
  .use(permissionMiddleware("payment_method.view"))
  .get("/", async () => {
    const data = await PaymentMethodService.getAll();
    return {
      success: true,
      data,
    };
  })
  .get(
    "/:id",
    async ({ params }) => {
      const data = await PaymentMethodService.getById(params.id);
      return {
        success: true,
        data,
      };
    },
    {
      params: PaymentMethodModel.idParam,
    }
  );

const manageRoutes = new Elysia()
  .use(permissionMiddleware("payment_method.manage"))
  .post(
    "/",
    async ({ body, user }) => {
      const data = await PaymentMethodService.create(body, user.id);
      return {
        success: true,
        message: "Metode pembayaran berhasil dibuat",
        data,
      };
    },
    {
      body: PaymentMethodModel.createBody,
    }
  )
  .put(
    "/:id",
    async ({ params, body, user }) => {
      const data = await PaymentMethodService.update(params.id, body, user.id);
      return {
        success: true,
        message: "Metode pembayaran berhasil diupdate",
        data,
      };
    },
    {
      params: PaymentMethodModel.idParam,
      body: PaymentMethodModel.updateBody,
    }
  )
  .delete(
    "/:id",
    async ({ params, user }) => {
      const result = await PaymentMethodService.delete(params.id, user.id);
      return {
        success: true,
        message: result.message,
      };
    },
    {
      params: PaymentMethodModel.idParam,
    }
  );

export const paymentMethodController = new Elysia({
  prefix: "/payment-methods",
})
  .use(authMiddleware)
  .use(viewRoutes)
  .use(manageRoutes);
