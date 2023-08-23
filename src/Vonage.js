import { Vonage } from "@vonage/server-sdk";
import { Video } from "@vonage/video";
import { Auth } from '@vonage/auth';
import { AIStudio } from './AIStudio.js'
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

export const aistudio = new AIStudio(process.env.VONAGE_AI_STUDIO_KEY, process.env.VONAGE_AI_STUDIO_BOT_ID, process.env.VONAGE_AI_STUDIO_REGION);
export const video = new Video(auth, { appendUserAgent: 'video-verify-demo'})
export const vonage = new Vonage(auth, { appendUserAgent: 'video-verify-demo'});

vonage.video = video;