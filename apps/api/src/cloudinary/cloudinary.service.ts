import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    constructor(@Inject('CLOUDINARY') private cloudinary) { }

    uploadImage(file: Express.Multer.File): Promise<any> {
        return new Promise((resolve, reject) => {
            console.log('Starting Cloudinary upload for file:', file.originalname);
            const uploadStream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(error);
                    }
                    console.log('Cloudinary upload success:', result?.public_id);
                    resolve(result);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
