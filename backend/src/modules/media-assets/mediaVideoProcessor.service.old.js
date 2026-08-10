const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { promisify } = require("util");

const {
  buildAssetDirectory,
  getRelativeStoragePath,
  buildPublicUrl,
} = require("./mediaStorage.service");

const execFileAsync = promisify(execFile);

const FFMPEG_PATH =
  process.env.FFMPEG_PATH || "ffmpeg";

const FFPROBE_PATH =
  process.env.FFPROBE_PATH || "ffprobe";

const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_VIDEO_CRF = 28;
const PREVIEW_VIDEO_PRESET = "medium";

/**
 * Ensure that a directory exists.
 */
const ensureDirectory = async (directoryPath) => {
  await fs.mkdir(directoryPath, {
    recursive: true,
  });
};

/**
 * Return the file size in bytes.
 */
const getFileSize = async (filePath) => {
  const statistics = await fs.stat(filePath);

  return statistics.size;
};

/**
 * Calculate a SHA-256 checksum for a generated file.
 */
const calculateFileChecksum = async (filePath) => {
  const buffer = await fs.readFile(filePath);

  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");
};

/**
 * Convert an FFmpeg fraction such as 30/1 or 30000/1001
 * into a decimal number.
 */
const parseFraction = (value) => {
  if (!value) {
    return null;
  }

  const parts = String(value).split("/");

  if (parts.length !== 2) {
    const numberValue = Number(value);

    return Number.isFinite(numberValue)
      ? numberValue
      : null;
  }

  const numerator = Number(parts[0]);
  const denominator = Number(parts[1]);

  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return numerator / denominator;
};

/**
 * Determine video orientation.
 */
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

/**
 * Execute FFprobe and return parsed JSON.
 */
const runFfprobe = async (sourcePath) => {
  const { stdout } = await execFileAsync(
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
      maxBuffer: 10 * 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
};

/**
 * Execute FFmpeg.
 */
const runFfmpeg = async (argumentsList) => {
  try {
    await execFileAsync(
      FFMPEG_PATH,
      argumentsList,
      {
        maxBuffer: 50 * 1024 * 1024,
      }
    );
  } catch (error) {
    const ffmpegError =
      error.stderr ||
      error.stdout ||
      error.message;

    throw new Error(
      `FFmpeg processing failed: ${ffmpegError}`
    );
  }
};

/**
 * Read metadata from a video file.
 */
const extractVideoMetadata = async (
  sourcePath
) => {
  const probeResult =
    await runFfprobe(sourcePath);

  const stream =
    probeResult.streams?.[0] || {};

  const format =
    probeResult.format || {};

  const width =
    Number(stream.width) || null;

  const height =
    Number(stream.height) || null;

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
      stream.codec_name || null,

    frameRate:
      frameRate !== null
        ? Number(
            frameRate.toFixed(3)
          )
        : null,

    bitrate,
  };
};

/**
 * Choose a frame near the beginning of the video.
 *
 * Very first frames are often black, so this uses 10% of
 * the duration, with a minimum of 0.5 seconds and maximum
 * of 5 seconds.
 */
const getThumbnailTimestamp = (
  durationSeconds
) => {
  if (
    !durationSeconds ||
    durationSeconds <= 0
  ) {
    return 0;
  }

  return Math.min(
    Math.max(
      durationSeconds * 0.1,
      0.5
    ),
    5
  );
};

/**
 * Generate a square JPEG thumbnail.
 */
const generateThumbnail = async ({
    sourcePath,
    destinationPath,
    durationSeconds,
  }) => {
    const timestamp =
      getThumbnailTimestamp(
        durationSeconds
      );
  
    await runFfmpeg([
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
    ]);
  };

/**
 * Generate a WebP poster image.
 */
const generatePoster = async ({
  sourcePath,
  destinationPath,
  durationSeconds,
}) => {
  const timestamp =
    getThumbnailTimestamp(
      durationSeconds
    );

  await runFfmpeg([
    "-y",

    "-ss",
    String(timestamp),

    "-i",
    sourcePath,

    "-frames:v",
    "1",

    "-vf",
    `scale='min(${PREVIEW_MAX_WIDTH},iw)':-2`,

    "-c:v",
    "libwebp",

    "-quality",
    "82",

    destinationPath,
  ]);
};

/**
 * Generate an optimized MP4 preview video.
 */
const generatePreviewVideo = async ({
  sourcePath,
  destinationPath,
}) => {
  await runFfmpeg([
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
  ]);
};

/**
 * Read dimensions for generated image/video variants.
 */
const extractDimensions = async (
  mediaPath
) => {
  const result =
    await runFfprobe(mediaPath);

  const stream =
    result.streams?.[0] || {};

  return {
    width:
      Number(stream.width) ||
      null,

    height:
      Number(stream.height) ||
      null,
  };
};

/**
 * Build a record matching MediaAssetVariant fields.
 */
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

    storageProvider: "LOCAL",

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

/**
 * Generate all video variants.
 *
 * Generated files:
 *
 * variants/thumbnail.jpg
 * variants/preview.webp
 * variants/preview.mp4
 */
const generateVideoVariants = async ({
  companyId,
  assetId,
  sourcePath,
  isPublic = true,
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
      "preview.webp"
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
    await extractDimensions(
      thumbnailPath
    );

  const posterMetadata =
    await extractDimensions(
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

      format: "webp",

      mimeType:
        "image/webp",

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
    metadata: {
      width:
        metadata.width,

      height:
        metadata.height,

      durationSeconds:
        metadata.durationSeconds,

      orientation:
        metadata.orientation,

      codec:
        metadata.codec,

      frameRate:
        metadata.frameRate,

      bitrate:
        metadata.bitrate,
    },

    variants,
  };
};

module.exports = {
  FFMPEG_PATH,
  FFPROBE_PATH,
  extractVideoMetadata,
  generateVideoVariants,
};