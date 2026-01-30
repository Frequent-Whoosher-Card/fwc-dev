import { Elysia } from "elysia";
import { EmployeeTypeService } from "./service";
import { EmployeeTypeModel } from "./model";
import { authMiddleware } from "../../middleware/auth";

export const employeeTypeController = new Elysia({ prefix: "/employee-types" })
  .use(authMiddleware)
  /**
   * GET /employee-types - Get all employee types
   */
  .get("/", async () => {
    const employeeTypes = await EmployeeTypeService.getAll();
    return {
      success: true,
      data: employeeTypes,
    };
  })

  /**
   * GET /employee-types/:id - Get employee type by ID
   */
  .get(
    "/:id",
    async ({ params }) => {
      const employeeType = await EmployeeTypeService.getById(params.id);
      return {
        success: true,
        data: employeeType,
      };
    },
    {
      params: EmployeeTypeModel.idParam,
    },
  )

  /**
   * POST /employee-types - Create new employee type
   */
  .post(
    "/",
    async ({ body, user }) => {
      const employeeType = await EmployeeTypeService.create(body, user.id);
      return {
        success: true,
        message: "Employee type berhasil dibuat",
        data: employeeType,
      };
    },
    {
      body: EmployeeTypeModel.createBody,
    },
  )

  /**
   * PUT /employee-types/:id - Update employee type
   */
  .put(
    "/:id",
    async ({ params, body, user }) => {
      const employeeType = await EmployeeTypeService.update(
        params.id,
        body,
        user.id,
      );
      return {
        success: true,
        message: "Employee type berhasil diupdate",
        data: employeeType,
      };
    },
    {
      params: EmployeeTypeModel.idParam,
      body: EmployeeTypeModel.updateBody,
    },
  )

  /**
   * DELETE /employee-types/:id - Delete employee type
   */
  .delete(
    "/:id",
    async ({ params, user }) => {
      const result = await EmployeeTypeService.delete(params.id, user.id);
      return {
        success: true,
        message: result.message,
      };
    },
    {
      params: EmployeeTypeModel.idParam,
    },
  );
