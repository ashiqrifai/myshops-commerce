const fs=require("fs"),path=require("path");
const target=path.resolve(process.cwd(),"src/modules/public-storefront/publicStorefront.service.js");
if(!fs.existsSync(target))throw new Error("Run from /var/www/myshops-commerce/backend");
let s=fs.readFileSync(target,"utf8");
const backup=`${target}.bak-prebooking-homepage-slim-${Date.now()}`;fs.copyFileSync(target,backup);

const a=s.indexOf("      const preBookingVariantIds ="),b=s.indexOf("      const preBookingVariantImageModels =",a);
if(a<0||b<0)throw new Error("preBookingVariantIds block not found");
s=s.slice(0,a)+`      /*
      | Homepage: only variants with active direct allocation and stock
      */
      const preBookingVariantIds =
        Array.from(
          new Set(
            directAllocationModels
              .map(row => toPlainObject(row))
              .filter(allocation => {
                const availableQuantity =
                  Math.max(
                    0,
                    Number(allocation.allocationQuantity || 0) -
                    Number(allocation.reservedQuantity || 0) -
                    Number(allocation.confirmedQuantity || 0)
                  );

                return Boolean(allocation.productVariantId) &&
                  availableQuantity > 0;
              })
              .map(allocation => String(allocation.productVariantId))
          )
        );

`+s.slice(b);

const q1=s.indexOf("      const preBookingVariantImageModels ="),q2=s.indexOf("      const preBookingVariantImagesByVariantId =",q1);
if(q1<0||q2<0)throw new Error("variant image query not found");
s=s.slice(0,q1)+`      const preBookingVariantImageModels =
        preBookingVariantIds.length
          ? await db.ProductImage.findAll({
              where: {
                companyId,
                variantId: {
                  [Op.in]: preBookingVariantIds,
                },
                isActive: true,
              },
              include: [
                {
                  model: db.MediaAsset,
                  as: "mediaAsset",
                  required: true,
                  where: {
                    companyId,
                    status: "READY",
                    isPublic: true,
                    isActive: true,
                  },
                  attributes: [
                    "id",
                    "publicUrl",
                    "previewUrl",
                    "thumbnailUrl",
                    "altText",
                    "title",
                  ],
                },
              ],
              order: [
                ["variantId", "ASC"],
                ["displayOrder", "ASC"],
                ["createdAt", "ASC"],
              ],
            })
          : [];

`+s.slice(q2);

const m1=s.indexOf("      const preBookingVariantImagesByVariantId ="),m2=s.indexOf("      /*\n      |--------------------------------------------------------------------------\n      | 5. Bundles",m1);
if(m1<0||m2<0)throw new Error("variant image map not found");
s=s.slice(0,m1)+`      const preBookingVariantImagesByVariantId =
        new Map();

      for (const imageModel of preBookingVariantImageModels) {
        const image = toPlainObject(imageModel);
        const variantKey = String(image.variantId || "");

        if (!variantKey || !image.mediaAsset) continue;

        /*
         * Only the first ordered image is required for a homepage card.
         */
        if (preBookingVariantImagesByVariantId.has(variantKey)) continue;

        const mediaAsset = image.mediaAsset;

        preBookingVariantImagesByVariantId.set(
          variantKey,
          [
            {
              id: image.id,
              imageRole: image.imageRole || null,
              altText: image.altText || mediaAsset.altText || null,
              title: image.title || mediaAsset.title || null,
              mediaAsset: {
                id: mediaAsset.id,
                publicUrl: mediaAsset.publicUrl || null,
                previewUrl: mediaAsset.previewUrl || null,
                thumbnailUrl: mediaAsset.thumbnailUrl || null,
                altText: mediaAsset.altText || null,
                title: mediaAsset.title || null,
                variants: [],
              },
            },
          ]
        );
      }

`+s.slice(m2);

const v1=s.indexOf("              const preBookingPublicVariants ="),v2=s.indexOf("              /*\n              |--------------------------------------------------------------------------\n              | Bundles",v1);
if(v1<0||v2<0)throw new Error("preBookingPublicVariants block not found");
s=s.slice(0,v1)+`              const preBookingPublicVariants =
                productVariants.flatMap(
                  variant => {
                    const variantAllocations =
                      directAllocationPlain.filter(
                        allocation =>
                          String(
                            allocation.productVariantId ||
                            allocation.variant?.id ||
                            ""
                          ) === String(variant.id)
                      );

                    if (!variantAllocations.length) return [];

                    const allocationQuantity =
                      variantAllocations.reduce(
                        (total, allocation) =>
                          total + Number(allocation.allocationQuantity || 0),
                        0
                      );

                    const reservedQuantity =
                      variantAllocations.reduce(
                        (total, allocation) =>
                          total + Number(allocation.reservedQuantity || 0),
                        0
                      );

                    const confirmedQuantity =
                      variantAllocations.reduce(
                        (total, allocation) =>
                          total + Number(allocation.confirmedQuantity || 0),
                        0
                      );

                    const availableQuantity =
                      Math.max(
                        0,
                        allocationQuantity -
                        reservedQuantity -
                        confirmedQuantity
                      );

                    if (availableQuantity <= 0) return [];

                    const attributeValues =
                      Array.isArray(variant.attributeValues)
                        ? variant.attributeValues
                        : [];

                    return [
                      {
                        id: variant.id,
                        sku: variant.sku,
                        barcode: variant.barcode || null,
                        name: variant.name,
                        isDefault: variant.isDefault === true,
                        sortOrder: Number(variant.sortOrder || 0),

                        attributes:
                          attributeValues.map(
                            value => ({
                              id: value.id,
                              attributeId: value.attributeId,
                              optionId: value.optionId || null,
                              code: value.attribute?.code || null,
                              name: value.attribute?.name || null,
                              displayOrder: Number(
                                value.attribute?.displayOrder ||
                                value.sortOrder ||
                                0
                              ),
                              value:
                                value.option?.value ||
                                value.displayValue ||
                                null,
                              label:
                                value.option?.label ||
                                value.displayValue ||
                                null,
                              swatchValue:
                                value.option?.swatchValue ||
                                null,
                            })
                          ),

                        images:
                          preBookingVariantImagesByVariantId.get(
                            String(variant.id)
                          ) || [],

                        price:
                          getPublicVariantPrice(variant),

                        allocationSummary: {
                          hasAllocation: true,
                          availableQuantity,
                          isAvailable: true,
                        },
                      },
                    ];
                  }
                );

`+s.slice(v2);

fs.writeFileSync(target,s,"utf8");
console.log("PRE_BOOKING homepage slim patch applied.");
console.log("Backup:",backup);
console.log("Updated:",target);
