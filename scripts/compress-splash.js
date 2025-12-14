import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const resDir = 'android/app/src/main/res';

// Splash screen directories with their target quality
const directories = [
    { dir: 'drawable-port-xxxhdpi', quality: 40 },
    { dir: 'drawable-land-xxxhdpi', quality: 40 },
    { dir: 'drawable-port-xxhdpi', quality: 45 },
    { dir: 'drawable-land-xxhdpi', quality: 45 },
    { dir: 'drawable-port-xhdpi', quality: 55 },
    { dir: 'drawable-land-xhdpi', quality: 55 },
    { dir: 'drawable-port-hdpi', quality: 65 },
    { dir: 'drawable-land-hdpi', quality: 65 },
];

async function compressSplash() {
    for (const { dir, quality } of directories) {
        const splashPath = path.join(resDir, dir, 'splash.png');

        if (!fs.existsSync(splashPath)) {
            console.log(`Skipping ${dir} - no splash.png found`);
            continue;
        }

        const sizeBefore = fs.statSync(splashPath).size / 1024;

        // Read, compress, and overwrite
        const buffer = await sharp(splashPath)
            .png({ quality, compressionLevel: 9 })
            .toBuffer();

        const sizeAfter = buffer.length / 1024;

        // Only write if smaller
        if (sizeAfter < sizeBefore) {
            fs.writeFileSync(splashPath, buffer);
            console.log(`${dir}: ${sizeBefore.toFixed(0)}KB -> ${sizeAfter.toFixed(0)}KB (${((1 - sizeAfter / sizeBefore) * 100).toFixed(0)}% reduction)`);
        } else {
            console.log(`${dir}: ${sizeBefore.toFixed(0)}KB - already optimal`);
        }
    }
}

compressSplash().catch(console.error);
