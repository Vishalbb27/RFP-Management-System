const nodemailer = require("nodemailer");
const Imap = require("imap");
const { simpleParser } = require("mailparser");
const { Vendor, Proposal } = require("../models");
const proposalService = require("./proposal.service");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    this.imapConfig = {
      user: process.env.GMAIL_USER,
      password: process.env.GMAIL_APP_PASSWORD,
      host: process.env.IMAP_HOST || "imap.gmail.com",
      port: process.env.IMAP_PORT || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    };
  }
  async sendRFPToVendors(rfp, vendors) {
    const results = [];

    for (const vendor of vendors) {
      try {
        const emailBody = this.generateRFPEmailBody(rfp);

        await this.transporter.sendMail({
          from: process.env.GMAIL_USER,
          to: vendor.email,
          subject: `Request for Proposal: ${rfp.title} - ${rfp._id}`,
          html: emailBody,
          replyTo: process.env.GMAIL_USER,
        });

        results.push({
          vendorId: vendor._id,
          email: vendor.email,
          status: "sent",
        });
      } catch (error) {
        console.error(`Failed to send email to ${vendor.email}:`, error);
        results.push({
          vendorId: vendor._id,
          email: vendor.email,
          status: "failed",
          error: error.message,
        });
      }
    }

    return results;
  }

  generateRFPEmailBody(rfp) {
    const { specifications, title } = rfp;
    const { items, budget, deliveryTerms, paymentTerms, warranty } =
      specifications;

    let itemsHTML = "<ul>";
    items?.forEach((item) => {
      itemsHTML += `<li><strong>${item.name}</strong> (Qty: ${item.quantity})`;
      if (item.specs) {
        itemsHTML += "<ul>";
        Object.entries(item.specs).forEach(([key, value]) => {
          itemsHTML += `<li>${key}: ${value}</li>`;
        });
        itemsHTML += "</ul>";
      }
      itemsHTML += "</li>";
    });
    itemsHTML += "</ul>";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
    .section { margin: 20px 0; }
    .section h3 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 8px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Request for Proposal</h1>
      <p>${title}</p>
    </div>

    <div class="section">
      <h3>Items Needed</h3>
      ${itemsHTML}
    </div>

    <div class="section">
      <h3>Budget</h3>
      <table>
        <tr>
          <td>Total Budget:</td>
          <td>${budget?.currency || "USD"} ${
      budget?.total?.toLocaleString() || "N/A"
    }</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h3>Delivery Terms</h3>
      <table>
        <tr>
          <td>Required by:</td>
          <td>${deliveryTerms?.deadline || "TBD"}</td>
        </tr>
        <tr>
          <td>Lead Time:</td>
          <td>${deliveryTerms?.leadTimeDays || "N/A"} days</td>
        </tr>
      </table>
    </div>

    <div class="section">
      <h3>Payment Terms</h3>
      <p>Net ${paymentTerms?.netDays || 30}</p>
    </div>

    <div class="section">
      <h3>Warranty Requirements</h3>
      <p>Minimum ${warranty?.period || 12} months ${
      warranty?.coverage || "hardware coverage"
    }</p>
    </div>

    <div class="section">
      <p>Please submit your proposal by <strong>${
        deliveryTerms?.deadline || "the specified date"
      }</strong> with:
      <ul>
        <li>Itemized pricing</li>
        <li>Delivery timeline and conditions</li>
        <li>Warranty and support terms</li>
        <li>Any compliance certifications</li>
      </ul>
      </p>
    </div>

    <p>Best regards,<br>Procurement Team</p>
  </div>
</body>
</html>
    `;

    return html;
  }

  async pollIncomingEmails() {
    console.log("🔍 Starting email poll...");
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const imap = new Imap(this.imapConfig);

    return new Promise(async (resolve, reject) => {
      const proposals = [];

      imap.once("ready", () => {
        console.log("✅ IMAP ready");

        imap.openBox("INBOX", false, (err, box) => {
          if (err) return reject(err);

          imap.search([["UNSEEN"], ["SINCE", oneDayAgo]], (err, results) => {
            if (err) return reject(err);

            const totalEmails = results?.length || 0;
            console.log(`📬 Found ${totalEmails} UNSEEN emails`);

            if (totalEmails === 0) {
              imap.end();
              return resolve([]);
            }

            const f = imap.fetch(results, { bodies: "" });
            const processingPromises = [];

            f.on("message", (msg, seqno) => {
              const emailTask = new Promise((resolveTask) => {
                let buffer = Buffer.alloc(0);

                msg.on("body", (stream) => {
                  stream.on("data", (chunk) => {
                    buffer = Buffer.concat([buffer, chunk]);
                  });
                });

                msg.once("end", async () => {
                  try {
                    const parsed = await simpleParser(buffer);

                    const processedEmail = await this.processSingleEmail(
                      parsed
                    );

                    if (processedEmail.proposal) {
                      proposals.push(processedEmail.proposal);
                    }

                    imap.addFlags(seqno, "\\Seen", (err) => {
                      if (err) console.error("❌ Failed to mark as seen:", err);
                      else console.log(`📌 Email ${seqno} marked as SEEN`);
                    });
                  } catch (err) {
                    console.error(
                      `❌ Failed processing email seq #${seqno}:`,
                      err.message
                    );
                  } finally {
                    resolveTask();
                  }
                });
              });

              processingPromises.push(emailTask);
            });

            f.once("end", async () => {
              console.log("⏳ Waiting for parsing & DB...");

              await Promise.all(processingPromises);

              console.log(`✅ Processed ${proposals.length} valid proposals.`);
              imap.end();
              resolve(proposals);
            });

            f.once("error", (err) => {
              console.error("❌ Fetch error:", err);
              reject(err);
            });
          });
        });
      });

      imap.once("error", reject);
      imap.connect();
    });
  }

  async processSingleEmail(parsed) {
    const fromEmail =
      parsed.from?.value?.[0]?.address || parsed.from?.text || "";
    const vendor = await Vendor.findOne({
      email: fromEmail.toLowerCase().trim(),
    });

    if (!vendor) return { proposal: null };

    const rfpId = this.extractRfpId(parsed.subject);
    if (!rfpId) return { proposal: null };

    const existing = await Proposal.findOne({
      rfpId,
      vendorId: vendor._id,
    });

    if (existing) {
      console.log(
        `⚠ Proposal already exists for vendor ${vendor.email} & RFP ${rfpId}. Skipping.`
      );
      return { proposal: null };
    }

    const proposal = await proposalService.createFromEmail(
      parsed,
      rfpId,
      vendor._id
    );

    return { proposal };
  }

  extractRfpId(subject) {
    if (!subject) return null;

    const objectIdMatch = subject.match(/[a-f0-9]{24}/i);
    if (objectIdMatch) {
      const potentialId = objectIdMatch[0];
      console.log(`🔍 Found potential RFP ID: ${potentialId}`);
      return potentialId;
    }

    return null;
  }
}

module.exports = new EmailService();
