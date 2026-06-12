"use server";

import { db } from "@/db";
import { exports, transactions, pockets, categories } from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to get authenticated user ID
async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getExportHistory() {
  try {
    const userId = await getUserId();
    const result = await db.query.exports.findMany({
      where: eq(exports.userId, userId),
      orderBy: (exports, { desc }) => [desc(exports.createdAt)],
    });
    return { data: result };
  } catch (error: any) {
    console.error("Failed to fetch export history:", error);
    return { error: error.message || "Failed to load export history." };
  }
}

export async function generateExcelExport(filters?: { 
  range?: string; 
  type?: string; 
  pocketId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const userId = await getUserId();
    const session = await auth();
    const userName = session?.user?.name || "User";

    // 1. Build conditional filters
    const conditions = [eq(transactions.userId, userId)];

    if (filters) {
      const { range, type, pocketId, startDate, endDate } = filters;

      if (range && range !== "all") {
        if (range === "custom") {
          if (startDate) {
            conditions.push(gte(transactions.createdAt, new Date(startDate)));
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            conditions.push(lte(transactions.createdAt, end));
          }
        } else {
          const dateLimit = new Date();
          if (range === "day") {
            dateLimit.setDate(dateLimit.getDate() - 1);
          } else if (range === "week") {
            dateLimit.setDate(dateLimit.getDate() - 7);
          } else if (range === "month") {
            dateLimit.setMonth(dateLimit.getMonth() - 1);
          }
          conditions.push(gte(transactions.createdAt, dateLimit));
        }
      }

      if (type && type !== "all") {
        conditions.push(eq(transactions.type, type as "expense" | "income"));
      }

      if (pocketId && pocketId !== "all") {
        conditions.push(eq(transactions.pocketId, pocketId));
      }
    }

    // Fetch user transactions
    const list = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        createdAt: transactions.createdAt,
        pocketName: pockets.name,
        categoryName: categories.name,
      })
      .from(transactions)
      .leftJoin(pockets, eq(transactions.pocketId, pockets.id))
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt));

    // 2. Initialize Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Poka Pocket";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Transactions");

    // 3. Add title banner with theme styling
    sheet.mergeCells("A1:F1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "POKA POCKET - FINANCIAL REPORT";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF090E17" }, // Theme deep dark
    };
    sheet.getRow(1).height = 40;

    // 4. Add metadata block
    sheet.getCell("A3").value = "Exported For:";
    sheet.getCell("B3").value = userName;
    sheet.getCell("A4").value = "Exported At:";
    sheet.getCell("B4").value = new Date().toLocaleString("id-ID");
    sheet.getCell("A3").font = { bold: true };
    sheet.getCell("A4").font = { bold: true };

    // Add filters metadata
    sheet.getCell("D3").value = "Filters Applied:";
    sheet.getCell("D3").font = { bold: true };

    const filterSummary: string[] = [];
    if (filters) {
      const { range, type, pocketId, startDate, endDate } = filters;
      if (range === "custom") {
        filterSummary.push(`Range: Custom (${startDate || "Any"} to ${endDate || "Any"})`);
      } else {
        filterSummary.push(`Range: ${range || "all"}`);
      }
      filterSummary.push(`Type: ${type || "all"}`);
      if (pocketId && pocketId !== "all") {
        const [p] = await db.select().from(pockets).where(eq(pockets.id, pocketId)).limit(1);
        filterSummary.push(`Pocket: ${p ? p.name : "Unknown"}`);
      } else {
        filterSummary.push("Pocket: all");
      }
    } else {
      filterSummary.push("None (All Data)");
    }
    sheet.getCell("E3").value = filterSummary.join(" | ");

    // 5. Add headers
    const headers = ["Date", "Type", "Pocket", "Category", "Description", "Amount (Rp)"];
    sheet.getRow(6).values = headers;
    sheet.getRow(6).font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(6).height = 25;

    const cols = ["A", "B", "C", "D", "E", "F"];
    cols.forEach((col) => {
      const cell = sheet.getCell(`${col}6`);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F2937" }, // Dark gray
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "double", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
    });

    // 6. Populate transaction items
    let currentRow = 7;
    list.forEach((t) => {
      const amountVal = parseFloat(t.amount);
      const isExpense = t.type === "expense";

      const row = sheet.getRow(currentRow);
      row.values = [
        t.createdAt,
        t.type.toUpperCase(),
        t.pocketName || "N/A",
        t.categoryName || "No Category",
        t.description || "",
        isExpense ? -amountVal : amountVal, // Expense is negative for correct summing
      ];

      // Cell formatting & alignment
      const dateCell = row.getCell(1);
      dateCell.numFmt = "yyyy-mm-dd hh:mm:ss";
      dateCell.alignment = { horizontal: "center" };

      const typeCell = row.getCell(2);
      typeCell.alignment = { horizontal: "center" };
      typeCell.font = {
        bold: true,
        color: { argb: isExpense ? "FFFF6B6B" : "FF4ECDC4" }, // Red/Green theme colors
      };

      const amountCell = row.getCell(6);
      amountCell.numFmt = `#,##0.00;[Red]-#,##0.00;"-"`;
      amountCell.alignment = { horizontal: "right" };

      cols.forEach((col) => {
        const cell = row.getCell(col);
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });

      currentRow++;
    });

    const lastDataRow = currentRow - 1;

    // 7. Apply Excel auto-filters
    if (lastDataRow >= 6) {
      sheet.autoFilter = {
        from: { row: 6, column: 1 },
        to: { row: lastDataRow, column: 6 },
      };
    }

    // 8. Add SUBTOTAL calculation row at the bottom
    const totalRowIndex = lastDataRow >= 7 ? lastDataRow + 2 : 8;
    const totalRow = sheet.getRow(totalRowIndex);
    totalRow.getCell(5).value = "TOTAL SELECTED (FILTERED)";
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(5).alignment = { horizontal: "right" };

    const formulaCell = totalRow.getCell(6);
    formulaCell.value = {
      formula: `SUBTOTAL(9, F7:F${Math.max(7, lastDataRow)})`,
      date1904: false,
    };
    formulaCell.font = { bold: true };
    formulaCell.numFmt = `#,##0.00;[Red]-#,##0.00;"-"`;
    formulaCell.alignment = { horizontal: "right" };

    // Styling borders on subtotal row
    cols.forEach((col) => {
      const cell = totalRow.getCell(col);
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "double", color: { argb: "FF000000" } },
      };
    });

    // 9. Auto-fit columns dynamically
    if (sheet.columns) {
      sheet.columns.forEach((column) => {
        if (!column) return;
        let maxLen = 0;
        if (typeof column.eachCell === "function") {
          column.eachCell({ includeEmpty: true }, (cell) => {
            let valStr = "";
            if (cell.value instanceof Date) {
              valStr = "2026-00-00 00:00:00";
            } else if (cell.value && typeof cell.value === "object" && "formula" in cell.value) {
              valStr = "TOTAL SELECTED (FILTERED)";
            } else if (cell.value !== undefined && cell.value !== null) {
              valStr = cell.value.toString();
            }
            maxLen = Math.max(maxLen, valStr.length);
          });
        }
        column.width = Math.max(maxLen + 4, 12);
      });
    }

    // 10. Generate workbook buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const dateStr = new Date().toISOString().split("T")[0];
    const userSuffix = userId.substring(0, 8);
    const fileName = `Poka_Pocket_Export_${dateStr}_${userSuffix}.xlsx`;

    // 11. Upload buffer as raw resource to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          public_id: `poka_pocket_exports/${userId}/${Date.now()}_Poka_Pocket_Export`,
          format: "xlsx",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(Buffer.from(buffer));
    });

    const fileUrl = uploadResult.secure_url;

    // 12. Save history log in database
    const exportId = crypto.randomUUID();
    await db.insert(exports).values({
      id: exportId,
      userId,
      fileName,
      fileUrl,
    });

    revalidatePath("/dashboard");
    return { success: true, fileUrl, fileName };
  } catch (error: any) {
    console.error("Excel generation or upload failed:", error);
    return { error: error.message || "Failed to generate Excel export." };
  }
}

export async function deleteExportRecord(id: string) {
  try {
    const userId = await getUserId();

    // 1. Fetch export record to get URL
    const [record] = await db
      .select()
      .from(exports)
      .where(and(eq(exports.id, id), eq(exports.userId, userId)))
      .limit(1);

    if (!record) {
      throw new Error("Export record not found or unauthorized.");
    }

    // 2. Try to parse publicId from Cloudinary URL and delete it
    try {
      const urlParts = record.fileUrl.split("/upload/");
      if (urlParts.length > 1) {
        const pathAfterUpload = urlParts[1];
        const segments = pathAfterUpload.split("/");
        if (segments[0].startsWith("v")) {
          segments.shift(); // Remove version prefix (e.g. v1781249392)
        }
        const publicId = segments.join("/"); // Keeping file extension for raw file deletion
        await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
      }
    } catch (err) {
      console.error("Failed to delete raw asset from Cloudinary:", err);
    }

    // 3. Delete from DB
    await db
      .delete(exports)
      .where(and(eq(exports.id, id), eq(exports.userId, userId)));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete export record:", error);
    return { error: error.message || "Failed to delete export record." };
  }
}
