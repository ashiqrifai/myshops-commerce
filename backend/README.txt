MYSHOPS PRE-BOOKING CAMPAIGN PERFORMANCE FIX

Confirmed symptoms:
- PreBookingCampaign query observed running ~40 seconds.
- Node backend repeatedly reached ~4 GB V8 heap.
- Node crashed with JavaScript heap out of memory.
- Admin campaign, Protection and Express Delivery requests were affected while the shared backend stalled/restarted.

This package safely patches:
src/modules/pre-booking/preBooking.service.js

Changes:
- Uses separate:true for independent hasMany campaign relationships.
- Orders each separate relationship locally.
- Replaces getCampaignById() without its old nested JOIN order.
- Creates a timestamped backup automatically.

It does NOT touch checkout, Card, Tabby, allocation quantities, Protection logic or Express Delivery logic.

INSTALL

Copy apply-prebooking-campaign-performance-fix.js to:
/var/www/myshops-commerce/backend/

Run:

cd /var/www/myshops-commerce/backend
node apply-prebooking-campaign-performance-fix.js
node --check src/modules/pre-booking/preBooking.service.js

Only if syntax check succeeds:

pm2 restart myshops-backend

Then:
pm2 describe myshops-backend

Open ONE pre-booking campaign in admin and check:
pm2 describe myshops-backend
pm2 logs myshops-backend --lines 100 --nostream

Do not increase Node heap or Sequelize pool again while testing.

ROLLBACK
The installer prints:
preBooking.service.js.bak-campaign-performance-<timestamp>

Copy that backup over preBooking.service.js and restart myshops-backend.
