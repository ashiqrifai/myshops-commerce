const express =
  require(
    "express"
  );

const db =
  require(
    "../../models"
  );

const {
  sendEmail,
} =
  require(
    "../../services/email.service"
  );

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Contact Us
|--------------------------------------------------------------------------
|
| POST
| /api/v1/public/contact
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  async (
    req,
    res,
    next
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Normalize Input
      |--------------------------------------------------------------------------
      */

      const firstName =
        String(
          req.body?.firstName ||
            ""
        ).trim();

      const lastName =
        String(
          req.body?.lastName ||
            ""
        ).trim();

      const email =
        String(
          req.body?.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const message =
        String(
          req.body?.message ||
            ""
        ).trim();

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (
        !firstName ||
        !lastName ||
        !email ||
        !message
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "CONTACT_FIELDS_REQUIRED",

              message:
                "Please complete all required fields.",
            },
          });
      }

      if (
        firstName.length >
          100 ||
        lastName.length >
          100
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "CONTACT_NAME_TOO_LONG",

              message:
                "Name is too long.",
            },
          });
      }

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(
          email
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "INVALID_EMAIL",

              message:
                "Please enter a valid email address.",
            },
          });
      }

      if (
        message.length >
        10000
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error: {
              code:
                "CONTACT_MESSAGE_TOO_LONG",

              message:
                "Message is too long.",
            },
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Company
      |--------------------------------------------------------------------------
      */

      const company =
        await db.Company.findOne({
          where: {
            code:
              "MYSHOPS",

            isActive:
              true,
          },

          attributes: [
            "id",
            "name",
            "code",
          ],
        });

      if (!company) {
        return res
          .status(404)
          .json({
            success:
              false,

            error: {
              code:
                "COMPANY_NOT_FOUND",

              message:
                "Company not found.",
            },
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Save Enquiry First
      |--------------------------------------------------------------------------
      |
      | Saving happens before email delivery so the customer's enquiry is not
      | lost if SMTP is temporarily unavailable.
      |
      |--------------------------------------------------------------------------
      */

      const enquiry =
        await db.ContactEnquiry
          .create({
            companyId:
              company.id,

            firstName,

            lastName,

            email,

            message,

            status:
              "NEW",

            emailSent:
              false,

            emailSentAt:
              null,

            emailError:
              null,
          });

      /*
      |--------------------------------------------------------------------------
      | Email Notification
      |--------------------------------------------------------------------------
      */

      const recipient =
        String(
          process.env
            .CONTACT_SUPPORT_EMAIL ||
            "Support@MyShops.ae"
        ).trim();

      const subject =
        `MyShops Contact Us - ${firstName} ${lastName}`;

      const text =
        [
          "New MyShops Contact Us enquiry",
          "",
          `Name: ${firstName} ${lastName}`,
          `Email: ${email}`,
          `Enquiry ID: ${enquiry.id}`,
          "",
          "Message:",
          message,
        ].join(
          "\n"
        );

      const escapeHtml =
        (value) =>
          String(
            value || ""
          )
            .replace(
              /&/g,
              "&amp;"
            )
            .replace(
              /</g,
              "&lt;"
            )
            .replace(
              />/g,
              "&gt;"
            )
            .replace(
              /"/g,
              "&quot;"
            )
            .replace(
              /'/g,
              "&#039;"
            );

      const html =
        `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#222">
            <h2>New MyShops Contact Us enquiry</h2>

            <p>
              <strong>Name:</strong>
              ${escapeHtml(firstName)} ${escapeHtml(lastName)}
            </p>

            <p>
              <strong>Email:</strong>
              ${escapeHtml(email)}
            </p>

            <p>
              <strong>Enquiry ID:</strong>
              ${escapeHtml(enquiry.id)}
            </p>

            <p>
              <strong>Message:</strong>
            </p>

            <div style="white-space:pre-wrap">
              ${escapeHtml(message)}
            </div>
          </div>
        `;

      /*
      |--------------------------------------------------------------------------
      | Send Email
      |--------------------------------------------------------------------------
      */

      try {
        await sendEmail({
          to:
            recipient,

          subject,

          html,

          text,

          replyTo:
            email,
        });

        await enquiry.update({
          emailSent:
            true,

          emailSentAt:
            new Date(),

          emailError:
            null,
        });
      } catch (
        emailError
      ) {
        /*
        |--------------------------------------------------------------------------
        | Do Not Lose The Enquiry
        |--------------------------------------------------------------------------
        |
        | The database record has already been created.
        |
        |--------------------------------------------------------------------------
        */

        console.error(
          "[Contact] Email notification failed:",
          emailError
        );

        await enquiry.update({
          emailSent:
            false,

          emailSentAt:
            null,

          emailError:
            String(
              emailError?.message ||
                emailError
            ).slice(
              0,
              5000
            ),
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Response
      |--------------------------------------------------------------------------
      */

      return res
        .status(201)
        .json({
          success:
            true,

          data: {
            enquiryId:
              enquiry.id,

            received:
              true,
          },

          message:
            "Thank you. Your message has been received.",
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  }
);

module.exports =
  router;