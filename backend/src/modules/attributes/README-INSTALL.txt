ATTRIBUTE MODULE INSTALLATION

1. Copy the three models into:
   backend/src/models/

2. Copy the attributes module into:
   backend/src/modules/attributes/

3. Update backend/src/models/index.js:

   Add:
   const Attribute = require("./Attribute");
   const AttributeOption = require("./AttributeOption");
   const CategoryAttribute = require("./CategoryAttribute");

   Add all three to the db object.

   Add the associations provided in the assistant response.

4. Update backend/src/routes/index.js:

   const attributeRoutes = require(
     "../modules/attributes/attribute.routes"
   );

   router.use(
     "/attributes",
     attributeRoutes
   );

5. Permissions:
   attributes.read
   attributes.create
   attributes.update
   attributes.delete

   Super-admin bypasses these permission checks.

6. Restart the backend.

ENDPOINTS

GET    /api/v1/attributes
POST   /api/v1/attributes
GET    /api/v1/attributes/:id
PUT    /api/v1/attributes/:id
PATCH  /api/v1/attributes/:id/status
DELETE /api/v1/attributes/:id

POST   /api/v1/attributes/:id/options
PUT    /api/v1/attributes/:id/options/:optionId
DELETE /api/v1/attributes/:id/options/:optionId

PUT    /api/v1/attributes/:id/categories
