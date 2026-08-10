const {
    buildProductImportTemplate,
  } = require("./services/template.service");
  
  const {
    previewProductImport,
  } = require("./services/preview.service");
  
  const {
    executeProductImportPreview,
  } = require("./services/execute.service");
  
  module.exports = {
    buildTemplate:
      buildProductImportTemplate,
  
    preview:
      previewProductImport,
  
    execute:
      executeProductImportPreview,
  };