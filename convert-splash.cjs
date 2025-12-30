const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'android/app/src/main/res/drawable/splash_icon_only.png');
const outputPath = path.join(__dirname, 'android/app/src/main/res/drawable/splash_icon_only_fixed.png');

async function convertToPng() {
    try {
        console.log('Converting JPEG to PNG...');

        await sharp(inputPath)
            .png()
            .toFile(outputPath);

        console.log('Conversion successful!');
        console.log('Output:', outputPath);

        // Replace the original with the fixed one
        const fs = require('fs');
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);

        console.log('Replaced original file with proper PNG');
    } catch (error) {
        console.error('Error:', error);
    }
}

convertToPng();
