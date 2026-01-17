import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    useFactory: (configService: ConfigService) => {
        const cloudName = configService.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = configService.get('CLOUDINARY_API_KEY');
        console.log('Cloudinary Config:', { cloudName, apiKey: apiKey ? '***' : 'missing' });
        return cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: configService.get('CLOUDINARY_API_SECRET'),
        });
    },
    inject: [ConfigService],
};
