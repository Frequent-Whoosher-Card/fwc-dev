import { Elysia } from "elysia";
import { EmployeeTypeService } from "./service";
import { EmployeeTypeModel } from "./model";
import { authMiddleware } from "../../middleware/auth";
import { permissionMiddleware } from "../../middleware/permission";

/**
 * View Routes (Read-Only)
 */
const viewRoutes = new Elysia()
  .use(permissionMiddleware("employee_type.view"))
  .get("/", async () => {
    const employeeTypes = await EmployeeTypeService.getAll();
    return {
      success: true,
      data: employeeTypes,
    };
  })
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
    }
  );

/**
 * Manage Routes (Create, Update, Delete)
 */
const manageRoutes = new Elysia()
  .use(permissionMiddleware("employee_type.manage"))
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
    }
  )
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
    }
  )
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
    }
  );

/**
 * Main Controller
 */
export const employeeTypeController = new Elysia({ prefix: "/employee-types" })
  .use(authMiddleware)
  .use(viewRoutes)
  .use(manageRoutes);
