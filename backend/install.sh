#!/usr/bin/env bash
set -euo pipefail

if [ ! -f "src/modules/public-storefront/publicProduct.service.js" ]; then
  echo "ERROR: Run from /var/www/myshops-commerce/backend"
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="src/modules/public-storefront.backup-${STAMP}"

echo "Backing up current public-storefront module..."
cp -a src/modules/public-storefront "${BACKUP}"

echo "Installing patched files..."
cp -f patch/src/modules/public-storefront/*.js \
  src/modules/public-storefront/

echo "Checking JavaScript syntax..."
for file in \
  publicAvailability.service.js \
  publicBrand.service.js \
  publicSearch.service.js \
  publicCategory.service.js \
  publicCollection.service.js \
  publicProduct.service.js \
  publicStorefront.service.js
do
  node --check "src/modules/public-storefront/${file}"
done

echo
echo "SUCCESS: availability patch installed."
echo "Backup created at: ${BACKUP}"
echo
echo "Restart backend:"
echo "pm2 restart myshops-backend --update-env"
