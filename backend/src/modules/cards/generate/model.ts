import { t } from "elysia";

export namespace CardGenerateModel {
  export const generateBody = t.Object({
    cardProductId: t.String({ format: "uuid" }), // Changed from categoryId/typeId
    // Removed strict regex pattern to allow alphanumeric full serials (validated by logic)
    startSerial: t.String(),
    endSerial: t.String(),
  });

  export const generateResponse = t.Object({
    status: t.String(),
    message: t.String(),
    data: t.Object({
      message: t.String(),
      firstSerial: t.String(),
      lastSerial: t.String(),
      generatedFilesCount: t.Number(),
    }),
  });
}
