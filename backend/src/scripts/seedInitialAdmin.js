const bcrypt = require("bcryptjs");

const db = require("../models");

const permissions = [
  {
    module: "system",
    code: "system.settings.read",
    name: "View system settings",
  },
  {
    module: "system",
    code: "system.settings.update",
    name: "Update system settings",
  },
  {
    module: "users",
    code: "users.read",
    name: "View users",
  },
  {
    module: "users",
    code: "users.create",
    name: "Create users",
  },
  {
    module: "users",
    code: "users.update",
    name: "Update users",
  },
  {
    module: "users",
    code: "users.disable",
    name: "Disable users",
  },
  {
    module: "roles",
    code: "roles.read",
    name: "View roles",
  },
  {
    module: "roles",
    code: "roles.create",
    name: "Create roles",
  },
  {
    module: "roles",
    code: "roles.update",
    name: "Update roles",
  },
  {
    module: "cms",
    code: "cms.pages.read",
    name: "View CMS pages",
  },
  {
    module: "cms",
    code: "cms.pages.create",
    name: "Create CMS pages",
  },
  {
    module: "cms",
    code: "cms.pages.update",
    name: "Update CMS pages",
  },
  {
    module: "cms",
    code: "cms.pages.publish",
    name: "Publish CMS pages",
  },
  {
    module: "pricing",
    code: "pricing.read",
    name: "View price lists",
  },
  {
    module: "pricing",
    code: "pricing.create",
    name: "Create price lists",
  },
  {
    module: "pricing",
    code: "pricing.update",
    name: "Update price lists",
  },
  {
    module: "pricing",
    code: "pricing.delete",
    name: "Delete price lists",
  },
];

const run = async () => {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync({ alter: false });

    const [
      company,
    ] = await db.Company.findOrCreate({
      where: {
        code: "MYSHOPS",
      },
      defaults: {
        name: "MyShops",
        code: "MYSHOPS",
        legalName: "MyShops",
        email: "admin@myshops.ae",
        country: "United Arab Emirates",
        currency: "AED",
        timezone: "Asia/Dubai",
        isActive: true,
      },
    });

    const createdPermissions = [];

    for (const permissionData of permissions) {
      const [
        permission,
      ] = await db.Permission.findOrCreate({
        where: {
          code: permissionData.code,
        },
        defaults: {
          ...permissionData,
          description: permissionData.name,
          isActive: true,
        },
      });

      createdPermissions.push(permission);
    }

    const [
      role,
    ] = await db.Role.findOrCreate({
      where: {
        companyId: company.id,
        code: "SUPER_ADMIN",
      },
      defaults: {
        companyId: company.id,
        name: "Super Administrator",
        code: "SUPER_ADMIN",
        description:
          "Full administrative access to the MyShops platform.",
        isSystemRole: true,
        isActive: true,
      },
    });

    await role.setPermissions(createdPermissions);

    const passwordHash = await bcrypt.hash(
      "ChangeMe@123",
      12
    );

    const [
      user,
      created,
    ] = await db.User.findOrCreate({
      where: {
        companyId: company.id,
        email: "admin@myshops.ae",
      },
      defaults: {
        companyId: company.id,
        firstName: "MyShops",
        lastName: "Administrator",
        email: "admin@myshops.ae",
        username: "admin",
        passwordHash,
        status: "ACTIVE",
        isSuperAdmin: true,
        isActive: true,
      },
    });

    await user.setRoles([role]);

    console.log("Initial MyShops administrator ready.");
    console.log("");
    console.log("Company Code: MYSHOPS");
    console.log("Login: admin@myshops.ae");
    console.log("Password: ChangeMe@123");
    console.log("");

    if (!created) {
      console.log(
        "The administrator already existed, so its password was not changed."
      );
    }
  } catch (error) {
    console.error("Initial administrator seed failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
};

run();