module.exports = {
  routes:
    require(
      "./customerAddress.routes"
    ),

  controller:
    require(
      "./customerAddress.controller"
    ),

  service:
    require(
      "./customerAddress.service"
    ),

  validation:
    require(
      "./customerAddress.validation"
    ),

  messages:
    require(
      "./customerAddress.messages"
    ),

  constants:
    require(
      "./customerAddress.constants"
    ),

  mapper:
    require(
      "./customerAddress.mapper"
    ),
};
