import { transporter } from "../config/mail";

interface PurchaseEmailData {
  memberEmail: string;
  memberName: string;
  nik: string;
  cardCategory: string;
  cardType: string;
  serialNumber: string;
  masaBerlaku: string;
  kuota: number;
  serialEdc: string;
  stasiunPembelian: string;
  harga: number;
  purchaseDate: string;
  productType: string;
}

interface VoucherBulkPurchaseEmailData {
  memberEmail: string;
  memberName: string;
  nik: string;
  vouchers: Array<{
    serialNumber: string;
    cardCategory: string;
    cardType: string;
    masaBerlaku: string;
    harga: number;
  }>;
  serialEdc: string;
  stasiunPembelian: string;
  totalHarga: number;
  purchaseDate: string;
  discountAmount?: number;
  subtotal?: number;
}

export class EmailService {
  static async sendPurchaseConfirmation(
    data: PurchaseEmailData,
  ): Promise<void> {
    const subject = `[INVOICE] ${data.productType} Purchase – ${data.purchaseDate}`;

    // Format harga dengan separator ribuan
    const formattedPrice = data.harga.toLocaleString("id-ID");

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .mobile-padding {
        padding: 16px !important;
      }
      .stack {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
      .text-right {
        text-align: center !important;
      }
      .title {
        font-size: 16px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
<tr>
<td align="center">

<!-- CONTAINER -->
<table width="600" cellpadding="0" cellspacing="0" class="container"
  style="background:#ffffff;border-radius:8px;overflow:hidden;">

<!-- HEADER (WHITE) -->
<tr>
  <td style="background:#ffffff;border-bottom:2px solid #8b1538;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>

        <!-- Logo -->
        <td width="35%" class="stack" align="left" valign="middle"
          style="padding:20px;">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/WHOOSH_Logo.svg/250px-WHOOSH_Logo.svg.png"
            alt="Whoosh"
            style="
              display:block;
              max-width:140px;
              width:100%;
              height:auto;
            "
          >
        </td>

        <!-- Title -->
        <td width="65%" class="stack text-right" align="right" valign="middle"
          style="padding:20px;color:#8b1538;">
          <div class="title" style="font-size:18px;font-weight:bold;letter-spacing:0.5px;">
            [INVOICE] ${data.productType}
          </div>
          <div style="font-size:12px;opacity:0.8;margin-top:4px;">
            Purchase – ${data.purchaseDate}
          </div>
        </td>

      </tr>
    </table>
  </td>
</tr>

<!-- CONTENT -->
<tr>
  <td class="mobile-padding" style="padding:25px;">

    <p>Halo <strong>${data.memberName}</strong>,</p>
    <p>Terima kasih atas pembelian ${data.productType} Anda. Berikut detail transaksi:</p>

    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <tr>
        <td width="40%"><strong>NIK</strong></td>
        <td>${data.nik}</td>
      </tr>
      <tr>
        <td><strong>Kategori Kartu</strong></td>
        <td>${data.cardCategory}</td>
      </tr>
      <tr>
        <td><strong>Jenis Kartu</strong></td>
        <td>${data.cardType}</td>
      </tr>
      <tr>
        <td><strong>Serial Number</strong></td>
        <td>${data.serialNumber}</td>
      </tr>
      <tr>
        <td><strong>Masa Berlaku</strong></td>
        <td>${data.masaBerlaku}</td>
      </tr>
      <tr>
        <td><strong>Kuota</strong></td>
        <td>${data.kuota}</td>
      </tr>
      <tr>
        <td><strong>Serial EDC</strong></td>
        <td>${data.serialEdc}</td>
      </tr>
      <tr>
        <td><strong>Stasiun Pembelian</strong></td>
        <td>${data.stasiunPembelian}</td>
      </tr>
      <tr>
        <td><strong>Harga</strong></td>
        <td><strong>Rp ${formattedPrice}</strong></td>
      </tr>
    </table>

    <hr style="margin:20px 0;">

    <p style="font-size:13px;color:#555;">
      Simpan email ini sebagai bukti transaksi Anda.<br>
      Jika ada pertanyaan, silakan hubungi customer service kami.
    </p>

  </td>
</tr>

<!-- FOOTER (MAROON) -->
<tr>
  <td style="background:#8b1538;text-align:center;padding:14px;font-size:12px;color:#ffffff;">
    ©️ 2026 Whoosh • All Rights Reserved
  </td>
</tr>

</table>
<!-- END CONTAINER -->

</td>
</tr>
</table>
</body>
</html>`;

    // Plain text fallback
    const textContent = `
Halo ${data.memberName},

Terima kasih atas pembelian ${data.productType} Anda.

Detail Transaksi:
- NIK: ${data.nik}
- Kategori Kartu: ${data.cardCategory}
- Jenis Kartu: ${data.cardType}
- Serial Number: ${data.serialNumber}
- Masa Berlaku: ${data.masaBerlaku}
- Kuota: ${data.kuota}
- Serial EDC: ${data.serialEdc}
- Stasiun Pembelian: ${data.stasiunPembelian}
- Harga: Rp ${formattedPrice}

Simpan email ini sebagai bukti transaksi Anda.

©️ 2026 Whoosh • All Rights Reserved
    `.trim();

    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME || "FWC Card System"} <${process.env.MAIL_USER}>`,
      to: data.memberEmail,
      subject,
      html: htmlContent,
      text: textContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${data.memberEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${data.memberEmail}:`, error);
      throw error;
    }
  }

  static async sendVoucherBulkPurchaseConfirmation(
    data: VoucherBulkPurchaseEmailData,
  ): Promise<void> {
    const subject = `[INVOICE] Voucher Bulk Purchase – ${data.purchaseDate}`;

    // Format harga dengan separator ribuan
    const formattedTotalPrice = data.totalHarga.toLocaleString("id-ID");
    const formattedSubtotal = data.subtotal ? data.subtotal.toLocaleString("id-ID") : formattedTotalPrice;
    const formattedDiscount = data.discountAmount ? data.discountAmount.toLocaleString("id-ID") : "0";

    // Generate voucher list HTML
    const voucherRows = data.vouchers.map((voucher, index) => {
      const formattedPrice = voucher.harga.toLocaleString("id-ID");
      return `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 8px; text-align: center;">${index + 1}</td>
        <td style="padding: 8px;">${voucher.serialNumber}</td>
        <td style="padding: 8px;">${voucher.cardCategory}</td>
        <td style="padding: 8px;">${voucher.cardType}</td>
        <td style="padding: 8px;">${voucher.masaBerlaku}</td>
        <td style="padding: 8px; text-align: right;">Rp ${formattedPrice}</td>
      </tr>`;
    }).join("");

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .mobile-padding {
        padding: 16px !important;
      }
      .stack {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
      }
      .text-right {
        text-align: center !important;
      }
      .title {
        font-size: 16px !important;
      }
      table {
        font-size: 12px !important;
      }
    }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
<tr>
<td align="center">

<!-- CONTAINER -->
<table width="600" cellpadding="0" cellspacing="0" class="container"
  style="background:#ffffff;border-radius:8px;overflow:hidden;">

<!-- HEADER (WHITE) -->
<tr>
  <td style="background:#ffffff;border-bottom:2px solid #8b1538;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>

        <!-- Logo -->
        <td width="35%" class="stack" align="left" valign="middle"
          style="padding:20px;">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/WHOOSH_Logo.svg/250px-WHOOSH_Logo.svg.png"
            alt="Whoosh"
            style="
              display:block;
              max-width:140px;
              width:100%;
              height:auto;
            "
          >
        </td>

        <!-- Title -->
        <td width="65%" class="stack text-right" align="right" valign="middle"
          style="padding:20px;color:#8b1538;">
          <div class="title" style="font-size:18px;font-weight:bold;letter-spacing:0.5px;">
            [INVOICE] Voucher Bulk Purchase
          </div>
          <div style="font-size:12px;opacity:0.8;margin-top:4px;">
            Purchase – ${data.purchaseDate}
          </div>
        </td>

      </tr>
    </table>
  </td>
</tr>

<!-- CONTENT -->
<tr>
  <td class="mobile-padding" style="padding:25px;">

    <p>Halo <strong>${data.memberName}</strong>,</p>
    <p>Terima kasih atas pembelian Voucher Bulk Purchase Anda. Berikut detail transaksi:</p>

    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr>
        <td width="40%"><strong>NIK</strong></td>
        <td>${data.nik}</td>
      </tr>
      <tr>
        <td><strong>Jumlah Voucher</strong></td>
        <td>${data.vouchers.length} voucher</td>
      </tr>
      <tr>
        <td><strong>Serial EDC</strong></td>
        <td>${data.serialEdc}</td>
      </tr>
      <tr>
        <td><strong>Stasiun Pembelian</strong></td>
        <td>${data.stasiunPembelian}</td>
      </tr>
    </table>

    <h3 style="color:#8b1538;font-size:16px;margin-top:25px;margin-bottom:10px;">Detail Voucher:</h3>
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:13px;border:1px solid #e0e0e0;">
      <thead>
        <tr style="background:#f5f5f5;border-bottom:2px solid #8b1538;">
          <th style="padding:10px;text-align:center;font-weight:bold;">No</th>
          <th style="padding:10px;text-align:left;font-weight:bold;">Serial Number</th>
          <th style="padding:10px;text-align:left;font-weight:bold;">Kategori</th>
          <th style="padding:10px;text-align:left;font-weight:bold;">Jenis</th>
          <th style="padding:10px;text-align:left;font-weight:bold;">Masa Berlaku</th>
          <th style="padding:10px;text-align:right;font-weight:bold;">Harga</th>
        </tr>
      </thead>
      <tbody>
        ${voucherRows}
      </tbody>
    </table>

    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-top:20px;">
      <tr>
        <td width="70%" style="text-align:right;padding-right:10px;"><strong>Subtotal:</strong></td>
        <td style="text-align:right;"><strong>Rp ${formattedSubtotal}</strong></td>
      </tr>
      ${data.discountAmount && data.discountAmount > 0 ? `
      <tr>
        <td style="text-align:right;padding-right:10px;color:#28a745;"><strong>Discount:</strong></td>
        <td style="text-align:right;color:#28a745;"><strong>- Rp ${formattedDiscount}</strong></td>
      </tr>
      ` : ""}
      <tr style="border-top:2px solid #8b1538;">
        <td style="text-align:right;padding-right:10px;padding-top:10px;"><strong>Total:</strong></td>
        <td style="text-align:right;padding-top:10px;font-size:16px;color:#8b1538;"><strong>Rp ${formattedTotalPrice}</strong></td>
      </tr>
    </table>

    <hr style="margin:20px 0;">

    <p style="font-size:13px;color:#555;">
      Simpan email ini sebagai bukti transaksi Anda.<br>
      Jika ada pertanyaan, silakan hubungi customer service kami.
    </p>

  </td>
</tr>

<!-- FOOTER (MAROON) -->
<tr>
  <td style="background:#8b1538;text-align:center;padding:14px;font-size:12px;color:#ffffff;">
    ©️ 2026 Whoosh • All Rights Reserved
  </td>
</tr>

</table>
<!-- END CONTAINER -->

</td>
</tr>
</table>
</body>
</html>`;

    // Plain text fallback
    const voucherListText = data.vouchers.map((voucher, index) => {
      const formattedPrice = voucher.harga.toLocaleString("id-ID");
      return `${index + 1}. ${voucher.serialNumber} - ${voucher.cardCategory} ${voucher.cardType} - Masa Berlaku: ${voucher.masaBerlaku} - Rp ${formattedPrice}`;
    }).join("\n");

    const textContent = `
Halo ${data.memberName},

Terima kasih atas pembelian Voucher Bulk Purchase Anda.

Detail Transaksi:
- NIK: ${data.nik}
- Jumlah Voucher: ${data.vouchers.length} voucher
- Serial EDC: ${data.serialEdc}
- Stasiun Pembelian: ${data.stasiunPembelian}

Detail Voucher:
${voucherListText}

Subtotal: Rp ${formattedSubtotal}
${data.discountAmount && data.discountAmount > 0 ? `Discount: - Rp ${formattedDiscount}\n` : ""}Total: Rp ${formattedTotalPrice}

Simpan email ini sebagai bukti transaksi Anda.

©️ 2026 Whoosh • All Rights Reserved
    `.trim();

    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME || "FWC Card System"} <${process.env.MAIL_USER}>`,
      to: data.memberEmail,
      subject,
      html: htmlContent,
      text: textContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Voucher bulk purchase email sent successfully to ${data.memberEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send voucher bulk purchase email to ${data.memberEmail}:`, error);
      throw error;
    }
  }
}
