// Cloudinary Service Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: 'dwcy3l9gz',
  apiKey: '963333992814779',
  apiSecret: 'Gl4NnqpEg_8QdiazcoXnjzVkOZQ',
  uploadPreset: 'nexify_uploads' // User should create this unsigned preset in Cloudinary console
};

/**
 * Uploads a file to Cloudinary.
 * Note: For production, use unsigned presets to avoid exposing API Secret in frontend.
 * @param {File} file - The file to upload.
 * @param {string} folder - Target folder in Cloudinary.
 * @returns {Promise<string>} - The URL of the uploaded image.
 */
export const uploadToCloudinary = async (file, folder = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Use unsigned upload for security (requires an unsigned preset named 'nexify_uploads')
  // If the user hasn't created one, they can fall back to signed if they really want, 
  // but we'll try the standard way first.
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('folder', `nexify/${folder}`);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};