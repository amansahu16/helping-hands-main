import {v2 as myCloud} from 'cloudinary';
import fs from 'fs';

myCloud.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await myCloud.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.error("Cloudinary uploadOnCloudinary error:", error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

const uploadSingleImage = async (imageInput) => {
    if (!imageInput) return null;
    if (typeof imageInput !== "string") return null;
    // If it's already an HTTP URL, just return it
    if (imageInput.startsWith("http://") || imageInput.startsWith("https://")) {
        return imageInput;
    }
    const isBase64 = imageInput.startsWith("data:");
    try {
        const response = await myCloud.uploader.upload(imageInput, {
            resource_type: "auto"
        });
        if (!isBase64) {
            try {
                if (fs.existsSync(imageInput)) fs.unlinkSync(imageInput);
            } catch {}
        }
        return response.secure_url || response.url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        if (!isBase64) {
            try {
                if (fs.existsSync(imageInput)) fs.unlinkSync(imageInput);
            } catch {}
        }
        return null;
    }
};

const uploadMultipleImages = async (imagesArray) => {
    if (!Array.isArray(imagesArray)) return [];
    const uploadPromises = imagesArray.map(img => uploadSingleImage(img));
    const results = await Promise.all(uploadPromises);
    return results.filter(Boolean);
};

export { uploadOnCloudinary, uploadSingleImage, uploadMultipleImages }