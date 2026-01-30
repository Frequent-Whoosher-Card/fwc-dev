import { Elysia, t } from "elysia";
import { MemberModel } from "./model";
import { MemberService } from "./service";
import { rbacMiddleware } from "../../middleware/rbac";
import { formatErrorResponse } from "../../utils/errors";

type AuthContextUser = {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
    role: {
      id: string;
      roleCode: string;
      roleName: string;
    };
  };
};

// Base routes (Read) - All authenticated users
// Note: rbacMiddleware automatically includes authMiddleware
const baseRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .get(
    "/",
    async (context) => {
      const { query, set } = context;
      try {
        const { page, limit, search, startDate, endDate, gender, hasNippKai, employeeTypeId } = query;
        
        // Validate dates if provided
        if (startDate && isNaN(new Date(startDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid startDate format. Please use YYYY-MM-DD.")
          );
        }
        if (endDate && isNaN(new Date(endDate).getTime())) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid endDate format. Please use YYYY-MM-DD.")
          );
        }
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Start date cannot be after end date.")
          );
        }

        const result = await MemberService.getAll({
          page: page ? parseInt(page) : undefined,
          limit: limit ? parseInt(limit) : undefined,
          search,
          startDate,
          endDate,
          gender,
          hasNippKai,
          employeeTypeId: employeeTypeId || undefined,
        });
        return {
          success: true,
          data: result,
          message: "Members retrieved successfully",
        };
      } catch (error) {
        set.status = 500;
        return formatErrorResponse(error);
      }
    },
    {
      query: MemberModel.getMembersQuery,
      response: {
        200: MemberModel.getListMemberResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Get all members",
        description: "Retrieve all members with pagination, search, membership date filter, gender filter, and NIPKAI filter. Search supports: name, identity number, email, phone, and updated by (user name). Optional startDate, endDate, gender, and hasNippKai parameters can be used to filter members.",
      },
    }
  )
  .get(
    "/:id",
    async (context) => {
      const { params, set } = context;
      try {
        const result = await MemberService.getById(params.id);
        return {
          success: true,
          data: result,
          message: "Member retrieved successfully",
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: MemberModel.getDetailMemberResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        404: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Get member by ID",
        description: "Retrieve a specific member by ID",
      },
    }
  );

// Write routes (Create) - petugas, supervisor, admin, superadmin
const writeRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/",
    async (context) => {
      const { body, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await MemberService.create(body, user.id);
        return {
          success: true,
          message: "Member created successfully",
          data: result,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: MemberModel.createMemberBody,
      response: {
        200: MemberModel.createMemberResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Create new member",
        description:
          "Create a new member (petugas, supervisor, admin, superadmin)",
      },
    }
  );

// Update routes - petugas, supervisor, superadmin only
const updateRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "superadmin"]))
  .put(
    "/:id",
    async (context) => {
      const { params, body, set, user } = context as typeof context &
        AuthContextUser;
      try {
        const result = await MemberService.update(params.id, body, user.id);
        return {
          success: true,
          message: "Member updated successfully",
          data: result,
        };
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: MemberModel.updateMemberBody,
      response: {
        200: MemberModel.createMemberResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        404: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Update member",
        description:
          "Update a member (petugas, supervisor, superadmin only)",
      },
    }
  );

// Delete routes - admin and superadmin only
const deleteRoutes = new Elysia()
  .use(rbacMiddleware(["admin", "superadmin"]))
  .delete(
    "/:id",
    async (context) => {
      const { params, set, user } = context as typeof context & AuthContextUser;
      try {
        const result = await MemberService.delete(params.id, user.id);
        return result;
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: MemberModel.genericResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        404: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Delete member (Soft Delete)",
        description: "Soft delete a member (admin, superadmin only)",
      },
    }
  );

// KTP Detection routes - petugas, supervisor, admin, superadmin
const detectionRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/ktp-detect",
    async (context) => {
      const { body, query, set } = context as typeof context & AuthContextUser;
      try {
        // Handle multipart/form-data
        const formData = body as any;
        const file = formData?.image || formData?.file || formData?.ktp;

        // Get query parameters for detection options
        const returnMultiple = query?.return_multiple === "true";
        const minConfidence = query?.min_confidence 
          ? parseFloat(query.min_confidence as string) 
          : 0.5;

        if (!file) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Image file is required. Please upload a KTP image.")
          );
        }

        // Convert to File object if it's not already
        let fileObj: File;
        if (file instanceof File) {
          fileObj = file;
        } else if (file && typeof file === "object" && "data" in file) {
          const fileData = file as any;
          fileObj = new File([fileData.data], fileData.name || "ktp.jpg", {
            type: fileData.type || "image/jpeg",
          });
        } else {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid file format. Please upload a valid image file.")
          );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(fileObj.type)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid file type. Please upload a JPEG, PNG, or WebP image.")
          );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (fileObj.size > maxSize) {
          set.status = 400;
          return formatErrorResponse(
            new Error("File size too large. Maximum size is 10MB.")
          );
        }

        // Validate min_confidence
        if (minConfidence < 0 || minConfidence > 1) {
          set.status = 400;
          return formatErrorResponse(
            new Error("min_confidence must be between 0 and 1.")
          );
        }

        const result = await MemberService.detectKTP(fileObj, returnMultiple, minConfidence);
        return result;
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: t.Object({
        image: t.File({
          type: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        }),
      }),
      query: t.Optional(t.Object({
        return_multiple: t.Optional(t.String({ description: "Set to 'true' to return all detections" })),
        min_confidence: t.Optional(t.String({ description: "Minimum confidence threshold (0-1), default: 0.5" })),
      })),
      response: {
        200: MemberModel.ktpDetectionResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
        detail: {
          tags: ["Members"],
          summary: "Detect and crop KTP from image",
          description: `Detect KTP in uploaded image and return cropped KTP image(s) using YOLO machine learning model.

**File Requirements:**
- **Format**: JPEG, JPG, PNG, or WebP
- **Max Size**: 10MB
- **Field Name**: \`image\` (also accepts \`file\` or \`ktp\`)

**Query Parameters:**
- \`return_multiple\` (optional): Set to \`"true"\` to return all detected KTPs. Default: \`false\` (returns only the best detection)
- \`min_confidence\` (optional): Minimum confidence threshold (0-1). Default: \`0.5\`

**Response:**
- \`sessionId\`: Session ID for retrieving cropped image(s) later (valid for 30 minutes)
- \`cropped_image\`: Base64 encoded cropped KTP image (single detection, if \`return_multiple=false\`)
- \`cropped_images\`: Array of cropped images with bbox and confidence (if \`return_multiple=true\`)
- \`bbox\`: Bounding box coordinates [x1, y1, x2, y2] (single detection)
- \`original_size\`: Original image size [width, height]
- \`confidence\`: Detection confidence score (single detection, optional)

**Usage Flow:**
1. Upload image to this endpoint (optionally with \`return_multiple=true\` for multiple detections)
2. Receive cropped KTP image(s) (base64) and \`sessionId\`
3. Display cropped image(s) to user for confirmation
4. Send \`sessionId\` (or \`cropped_image\` base64) to \`/members/ocr-extract\` endpoint for OCR extraction

**Example with Multiple Detections:**
\`\`\`
POST /members/ktp-detect?return_multiple=true&min_confidence=0.6
\`\`\`

**Access Control:**
- Roles allowed: petugas, supervisor, admin, superadmin`,
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "KTP image file (JPEG, PNG, or WebP, max 10MB)",
                  },
                },
              },
              encoding: {
                image: {
                  contentType: "image/jpeg, image/png, image/webp",
                },
              },
            },
          },
        },
      },
    }
  );

// OCR Extract routes - petugas, supervisor, admin, superadmin
const ocrRoutes = new Elysia()
  .use(rbacMiddleware(["petugas", "supervisor", "admin", "superadmin"]))
  .post(
    "/ocr-extract",
    async (context) => {
      const { body, set } = context as typeof context & AuthContextUser;
      try {
        // Handle multipart/form-data
        // Elysia automatically parses multipart/form-data
        const formData = body as any;
        const file = formData?.image || formData?.file || formData?.ktp;
        const croppedImageBase64 = formData?.cropped_image;
        const sessionId = formData?.session_id;

        // Either file upload, cropped_image base64, or sessionId must be provided
        if (!file && !croppedImageBase64 && !sessionId) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Either image file, cropped_image (base64), or session_id is required.")
          );
        }

        // Priority: sessionId > cropped_image > file upload
        if (sessionId) {
          // Use sessionId to retrieve cropped image from temp storage
          if (typeof sessionId !== "string" || sessionId.length === 0) {
            set.status = 400;
            return formatErrorResponse(
              new Error("Invalid session_id format. Must be a valid session ID string.")
            );
          }

          const result = await MemberService.extractKTPFields(sessionId, true);
          return result;
        }

        // If cropped_image is provided, use it directly
        if (croppedImageBase64) {
          // Validate base64 format
          if (typeof croppedImageBase64 !== "string" || croppedImageBase64.length === 0) {
            set.status = 400;
            return formatErrorResponse(
              new Error("Invalid cropped_image format. Must be a base64 string.")
            );
          }

          const result = await MemberService.extractKTPFields(croppedImageBase64);
          return result;
        }

        // Otherwise, process uploaded file
        if (!file) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Image file is required when cropped_image or session_id is not provided.")
          );
        }

        // Convert to File object if it's not already
        let fileObj: File;
        if (file instanceof File) {
          fileObj = file;
        } else if (file && typeof file === "object" && "data" in file) {
          // Handle case where file might be in different format
          const fileData = file as any;
          fileObj = new File([fileData.data], fileData.name || "ktp.jpg", {
            type: fileData.type || "image/jpeg",
          });
        } else {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid file format. Please upload a valid image file.")
          );
        }

        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(fileObj.type)) {
          set.status = 400;
          return formatErrorResponse(
            new Error("Invalid file type. Please upload a JPEG, PNG, or WebP image.")
          );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (fileObj.size > maxSize) {
          set.status = 400;
          return formatErrorResponse(
            new Error("File size too large. Maximum size is 10MB.")
          );
        }

        const result = await MemberService.extractKTPFields(fileObj);
        return result;
      } catch (error) {
        set.status =
          error instanceof Error && "statusCode" in error
            ? (error as any).statusCode
            : 500;
        return formatErrorResponse(error);
      }
    },
    {
      body: t.Object({
        image: t.Optional(
          t.File({
            type: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
          })
        ),
        cropped_image: t.Optional(
          t.String({
            description: "Base64 encoded cropped KTP image (from /members/ktp-detect endpoint). If provided, this will be used instead of uploaded file.",
          })
        ),
        session_id: t.Optional(
          t.String({
            description: "Session ID from /members/ktp-detect endpoint. If provided, cropped image will be retrieved from temporary storage.",
          })
        ),
      }),
      response: {
        200: MemberModel.ocrExtractResponse,
        400: MemberModel.errorResponse,
        401: MemberModel.errorResponse,
        403: MemberModel.errorResponse,
        500: MemberModel.errorResponse,
      },
      detail: {
        tags: ["Members"],
        summary: "Extract KTP fields using OCR",
          description: `Extract KTP fields (NIK, name, gender, address) from uploaded KTP image, cropped image, or session ID using OCR.

**Input Options (Priority Order):**
1. **Use session ID** (Recommended): Use \`session_id\` field (session ID from /members/ktp-detect)
   - Most efficient: retrieves pre-cropped image from temporary storage
   - Session expires after 30 minutes
2. **Use cropped image**: Use \`cropped_image\` field (base64 string from /members/ktp-detect)
   - Direct base64 image data
3. **Upload file**: Use \`image\` field (multipart/form-data)
   - Full image upload (will be processed directly)

**File Requirements (if uploading):**
- **Format**: JPEG, JPG, PNG, or WebP
- **Max Size**: 10MB
- **Field Name**: \`image\` (also accepts \`file\` or \`ktp\`)

**Recommended Flow:**
1. Upload image to \`/members/ktp-detect\` to get cropped KTP image and \`sessionId\`
2. Display cropped image to user for confirmation
3. Send \`sessionId\` to this endpoint using \`session_id\` field (or use \`cropped_image\` base64)

**How to Test in Swagger UI:**
1. Click "Try it out" button
2. Click "Choose File" and select a KTP image
3. Click "Execute"
4. View the extracted fields in the response

**Response Fields:**
- \`identityNumber\`: NIK from KTP (can be null if not found)
- \`name\`: Name from KTP (can be null if not found)
- \`gender\`: Gender from KTP (can be null if not found)
- \`alamat\`: Address from KTP (can be null if not found)
- \`raw\`: Raw OCR data including text blocks count and combined text

**Access Control:**
- Roles allowed: petugas, supervisor, admin, superadmin

**Example Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "identityNumber": "3201012345678901",
    "name": "JOHN DOE",
    "gender": "L",
    "alamat": "JL. EXAMPLE NO. 123"
  },
  "raw": {
    "text_blocks_count": 15,
    "combined_text": "PROVINSI JAWA BARAT\\nKABUPATEN BANDUNG\\n..."
  },
  "message": "KTP fields extracted successfully"
}
\`\`\``,
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "KTP image file (JPEG, PNG, or WebP, max 10MB)",
                  },
                },
              },
              encoding: {
                image: {
                  contentType: "image/jpeg, image/png, image/webp",
                },
              },
            },
          },
        },
      },
    }
  );

// Combine all routes
export const members = new Elysia({ prefix: "/members" })
  .use(baseRoutes)
  .use(writeRoutes)
  .use(updateRoutes)
  .use(deleteRoutes)
  .use(detectionRoutes)
  .use(ocrRoutes);
