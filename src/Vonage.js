import { Vonage } from "@vonage/server-sdk";
import { Video } from "@vonage/video";
import { Auth } from '@vonage/auth';
import fs from 'fs';

let privateKey;
if (process.env.PRIVATE_KEY64) {
    privateKey = Buffer.from(process.env.PRIVATE_KEY64, 'base64').toString('ascii');
} else {
    privateKey = fs.readFileSync(process.env.PRIVATE_KEY);
}

const auth = new Auth({
    apiKey: process.env.API_KEY,
    apiSecret: process.env.API_SECRET,
    applicationId: process.env.API_APPLICATION_ID,
    privateKey: privateKey
});

export const video = new Video(auth, { appendUserAgent: 'video-verify-demo'})
export const vonage = new Vonage(auth, { appendUserAgent: 'video-verify-demo'});
vonage.video = video;