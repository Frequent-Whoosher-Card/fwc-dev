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

export class EmailService {
  static async sendPurchaseConfirmation(data: PurchaseEmailData): Promise<void> {
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
}
