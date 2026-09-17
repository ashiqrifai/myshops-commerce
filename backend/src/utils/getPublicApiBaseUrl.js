const getPublicApiBaseUrl = (
    req
  ) => {
    const configuredUrl =
      process.env
        .PUBLIC_API_URL;
  
    if (
      configuredUrl &&
      String(
        configuredUrl
      ).trim()
    ) {
      return String(
        configuredUrl
      )
        .trim()
        .replace(
          /\/+$/,
          ""
        );
    }
  
    return `${req.protocol}://${req.get(
      "host"
    )}`.replace(
      /\/+$/,
      ""
    );
  };
  
  module.exports =
    getPublicApiBaseUrl;