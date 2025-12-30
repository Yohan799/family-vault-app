const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'android/app/src/main/res/drawable/splash_icon_only.png');
const outputPath = path.join(__dirname, 'android/app/src/main/res/drawable/splash_icon_only_compressed.png');

async function compressPng() {
    try {
        console.log('Compressing PNG...');

        // Get original size
        const fs = require('fs');
        const originalSize = fs.statSync(inputPath).size;
        console.log('Original size:', Math.round(originalSize / 1024), 'KB');

        // Compress with maximum compression and resize to 432x432 (optimal for Android splash icons)
        await sharp(inputPath)
            .resize(432, 432, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .png({
                compressionLevel: 9,  // Max compression
                palette: true,        // Use palette for smaller size
                quality: 80,          // Quality for palette
                effort: 10            // Max compression effort
            })
            .toFile(outputPath);

        const compressedSize = fs.statSync(outputPath).size;
        console.log('Compressed size:', Math.round(compressedSize / 1024), 'KB');
        console.log('Reduction:', Math.round((1 - compressedSize / originalSize) * 100), '%');

        // Replace the original
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);

        console.log('Done! Original replaced with compressed version.');

        // Final size check
        const finalSize = fs.statSync(inputPath).size;
        console.log('Final size:', Math.round(finalSize / 1024), 'KB');

        if (finalSize > 200 * 1024) {
            console.log('WARNING: Still over 200KB. Trying JPEG fallback...');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

compressPng();
