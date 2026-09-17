const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const {
  execFile,
} = require("child_process");
const {
  promisify,
} = require("util");

const {
  ensureDirectory,
  buildAssetDirectory,
  getRelativeStoragePath,
  buildPublicUrl,
} = require(
  "./mediaStorage.service"
);

const execFileAsync =
  promisify(execFile);

const FFMPEG_PATH =
  process.env.FFMPEG_PATH ||
  "/usr/bin/ffmpeg";

const FFPROBE_PATH =
  process.env.FFPROBE_PATH ||
  "/usr/bin/ffprobe";

const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_VIDEO_CRF = 28;
const PREVIEW_VIDEO_PRESET =
  "medium";

const calculateFileChecksum = async (
  filePath
) => {
  const buffer =
    await fs.readFile(filePath);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};

const getFileSize = async (
  filePath
) => {
  const statistics =
    await fs.stat(filePath);

  return statistics.size;
};

const parseFraction = (
  value
) => {
  if (!value) {
    return null;
  }

  const [numerator, denominator] =
    String(value)
      .split("/")
      .map(Number);

  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return numerator / denominator;
};

const getOrientation = ({
  width,
  height,
}) => {
  if (!width || !height) {
    return "UNKNOWN";
  }

  if (width === height) {
    return "SQUARE";
  }

  return width > height
    ? "LANDSCAPE"
    : "PORTRAIT";
};

const runFfprobe = async (
  sourcePath
) => {
  const {
    stdout,
  } = await execFileAsync(
    FFPROBE_PATH,
    [
      "-v",
      "error",

      "-select_streams",
      "v:0",

      "-show_entries",
      [
        "stream=width",
        "height",
        "codec_name",
        "r_frame_rate",
        "avg_frame_rate",
        "bit_rate",
        "duration",

        "format=duration",
        "bit_rate",
      ].join(","),

      "-of",
      "json",

      sourcePath,
    ],
    {
      maxBuffer:
        10 * 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
};

const extractVideoMetadata = async (
  sourcePath
) => {
  const probeResult =
    await runFfprobe(
      sourcePath
    );

  const stream =
    probeResult.streams?.[0] ||
    {};

  const format =
    probeResult.format || {};

  const width =
    Number(stream.width) ||
    null;

  const height =
    Number(stream.height) ||
    null;

  const durationSeconds =
    Number(
      stream.duration ||
      format.duration
    ) || null;

  const frameRate =
    parseFraction(
      stream.avg_frame_rate
    ) ||
    parseFraction(
      stream.r_frame_rate
    );

  const bitrate =
    Number(
      stream.bit_rate ||
      format.bit_rate
    ) || null;

  return {
    width,
    height,

    durationSeconds,

    orientation:
      getOrientation({
        width,
        height,
      }),

    codec:
      stream.codec_name ||
      null,

    frameRate:
      frameRate
        ? Number(
            frameRate.toFixed(3)
          )
        : null,

    bitrate,

    hasTransparency: null,
  };
};

const getThumbnailTimestamp = (
  durationSeconds
) => {
  if (
    !durationSeconds ||
    durationSeconds <= 0
  ) {
    return 0;
  }

  /*
   * Avoid choosing the very first frame,
   * which is often black.
   */
  return Math.min(
    Math.max(
      durationSeconds * 0.1,
      0.5
    ),
    5
  );
};

const generateThumbnail = async ({
  sourcePath,
  destinationPath,
  durationSeconds,
}) => {
  const timestamp =
    getThumbnailTimestamp(
      durationSeconds
    );

  await execFileAsync(
    FFMPEG_PATH,
    [
      "-y",

      "-ss",
      String(timestamp),

      "-i",
      sourcePath,

      "-frames:v",
      "1",

      "-vf",
"scale=400:400:force_original_aspect_ratio=decrease,pad=400:400:(400-iw)/2:(400-ih)/2:black",

      "-q:v",
      "2",

      destinationPath,
    ],
    {
      maxBuffer:
        20 * 1024 * 1024,
    }
  );
};

const generatePoster = async ({
    sourcePath,
    destinationPath,
    durationSeconds,
  }) => {
    const timestamp =
      getThumbnailTimestamp(
        durationSeconds
      );
  
    await execFileAsync(
      FFMPEG_PATH,
      [
        "-y",
  
        "-ss",
        String(timestamp),
  
        "-i",
        sourcePath,
  
        "-frames:v",
        "1",
  
        "-vf",
        `scale='min(${PREVIEW_MAX_WIDTH},iw)':-2`,
  
        "-q:v",
        "2",
  
        destinationPath,
      ],
      {
        maxBuffer:
          20 * 1024 * 1024,
      }
    );
  };

const generatePreviewVideo = async ({
  sourcePath,
  destinationPath,
}) => {
  await execFileAsync(
    FFMPEG_PATH,
    [
      "-y",

      "-i",
      sourcePath,

      "-map",
      "0:v:0",

      "-map",
      "0:a?",

      "-vf",
      `scale='min(${PREVIEW_MAX_WIDTH},iw)':-2`,

      "-c:v",
      "libx264",

      "-preset",
      PREVIEW_VIDEO_PRESET,

      "-crf",
      String(
        PREVIEW_VIDEO_CRF
      ),

      "-pix_fmt",
      "yuv420p",

      "-movflags",
      "+faststart",

      "-c:a",
      "aac",

      "-b:a",
      "128k",

      "-ac",
      "2",

      destinationPath,
    ],
    {
      maxBuffer:
        50 * 1024 * 1024,
    }
  );
};

const buildVariantRecord = async ({
  absolutePath,
  variantType,
  format,
  mimeType,
  width,
  height,
  isPublic,
}) => {
  const storagePath =
    getRelativeStoragePath(
      absolutePath
    );

  return {
    variantType,

    format,
    mimeType,

    width:
      width || null,

    height:
      height || null,

    fileSize:
      await getFileSize(
        absolutePath
      ),

    storageProvider:
      "LOCAL",

    storagePath,

    publicUrl: isPublic
      ? buildPublicUrl(
          storagePath
        )
      : null,

    checksum:
      await calculateFileChecksum(
        absolutePath
      ),

    isPrimary: false,
    isActive: true,
  };
};

const generateVideoVariants = async ({
  companyId,
  assetId,
  sourcePath,
  isPublic,
}) => {
  const metadata =
    await extractVideoMetadata(
      sourcePath
    );

  const assetDirectory =
    buildAssetDirectory({
      companyId,
      assetId,
    });

  const variantsDirectory =
    path.join(
      assetDirectory,
      "variants"
    );

  await ensureDirectory(
    variantsDirectory
  );

  const thumbnailPath =
    path.join(
      variantsDirectory,
      "thumbnail.jpg"
    );

    const posterPath =
    path.join(
      variantsDirectory,
      "preview.jpg"
    );

  const previewVideoPath =
    path.join(
      variantsDirectory,
      "preview.mp4"
    );

  await generateThumbnail({
    sourcePath,
    destinationPath:
      thumbnailPath,

    durationSeconds:
      metadata.durationSeconds,
  });

  await generatePoster({
    sourcePath,
    destinationPath:
      posterPath,

    durationSeconds:
      metadata.durationSeconds,
  });

  await generatePreviewVideo({
    sourcePath,
    destinationPath:
      previewVideoPath,
  });

  const thumbnailMetadata =
    await extractImageDimensions(
      thumbnailPath
    );

  const posterMetadata =
    await extractImageDimensions(
      posterPath
    );

  const previewMetadata =
    await extractVideoMetadata(
      previewVideoPath
    );

  const variants = [
    await buildVariantRecord({
      absolutePath:
        thumbnailPath,

      variantType:
        "THUMBNAIL",

      format: "jpg",
      mimeType:
        "image/jpeg",

      width:
        thumbnailMetadata.width,

      height:
        thumbnailMetadata.height,

      isPublic,
    }),

    await buildVariantRecord({
        absolutePath:
          posterPath,
      
        variantType:
          "PREVIEW",
      
        format: "jpg",
      
        mimeType:
          "image/jpeg",
      
        width:
          posterMetadata.width,
      
        height:
          posterMetadata.height,
      
        isPublic,
      }),

    await buildVariantRecord({
      absolutePath:
        previewVideoPath,

      variantType:
        "PREVIEW",

      format: "mp4",
      mimeType:
        "video/mp4",

      width:
        previewMetadata.width,

      height:
        previewMetadata.height,

      isPublic,
    }),
  ];

  return {
    metadata,
    variants,
  };
};

/*
 * Uses FFprobe so Sharp remains exclusively
 * inside the image-processing service.
 */
const extractImageDimensions = async (
  imagePath
) => {
  const {
    stdout,
  } = await execFileAsync(
    FFPROBE_PATH,
    [
      "-v",
      "error",

      "-select_streams",
      "v:0",

      "-show_entries",
      "stream=width,height",

      "-of",
      "json",

      imagePath,
    ]
  );

  const result =
    JSON.parse(stdout);

  const stream =
    result.streams?.[0] ||
    {};

  return {
    width:
      Number(stream.width) ||
      null,

    height:
      Number(stream.height) ||
      null,
  };
};

module.exports = {
  FFMPEG_PATH,
  FFPROBE_PATH,

  extractVideoMetadata,
  generateVideoVariants,
};