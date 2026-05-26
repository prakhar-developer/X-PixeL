import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function sha256File(filePath: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(filePath);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex')));
  });
}

export async function GET(req: Request) {
  try {
    const projectRoot = path.resolve(process.cwd());
    const downloadsDir = path.join(projectRoot, 'apps', 'web', 'public', 'downloads');
    const apkPath = path.join(downloadsDir, 'xpixel-android.apk');
    const metaPath = path.join(downloadsDir, 'xpixel-android.json');

    // Prefer a precomputed metadata file (written by CI). Fall back to on-demand hashing.
    if (fs.existsSync(metaPath)) {
      const raw = await fs.promises.readFile(metaPath, 'utf8');
      const data = JSON.parse(raw);
      // ensure URL is absolute
      data.url = new URL('/downloads/xpixel-android.apk', req.url).toString();
      return NextResponse.json(data);
    }

    if (!fs.existsSync(apkPath)) {
      return NextResponse.json({ error: 'APK not found' }, { status: 404 });
    }

    const stat = await fs.promises.stat(apkPath);
    const sizeBytes = stat.size;
    const sizeMB = Math.round((sizeBytes / 1024 / 1024) * 100) / 100;
    const lastModified = stat.mtime.toISOString();

    // compute sha256 on-demand
    const sha256 = await sha256File(apkPath);

    const downloadUrl = new URL('/downloads/xpixel-android.apk', req.url).toString();

    return NextResponse.json({
      filename: 'xpixel-android.apk',
      sizeBytes,
      sizeMB,
      lastModified,
      sha256,
      url: downloadUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
