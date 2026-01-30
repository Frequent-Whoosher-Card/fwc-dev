import { Elysia, t } from "elysia";
import { permissionMiddleware } from "../../middleware/permission";

export const noteRoutes = new Elysia({ prefix: "/notes" })
    .use(permissionMiddleware("note.confirm"))
    .post("/", async ({ body, set }) => {
        // Placeholder for Note Creation Logic
        // In reality, this should transactions, update stock, etc.
        console.log("Received Note/Confirmation:", body);

        return {
            success: true,
            message: "Note created successfully (Placeholder)",
            data: body
        };
    }, {
        body: t.Object({
            batchCard: t.Any(),
            station: t.String(),
            category: t.String(),
            type: t.String(),
            goodQty: t.Number(),
            damaged: t.Object({
                hasDamaged: t.String(),
                damagedQty: t.Number(),
                damagedSerials: t.Array(t.String())
            }),
            missing: t.Object({
                hasMissing: t.String(),
                missingQty: t.Number(),
                missingSerials: t.Array(t.String())
            }),
            message: t.String()
        }),
        detail: {
            tags: ["Notes"],
            security: [{ BearerAuth: [] }]
        }
    });
