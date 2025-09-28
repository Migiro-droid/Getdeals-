// Image upload utilities for profile pictures
import { createClient } from '@supabase/supabase-js';

// Note: In production, you would use environment variables
// const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  /**
   * Validates an image file before upload
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size too large. Please select an image smaller than 5MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Compresses an image file to reduce size
   */
  static async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Return original if compression fails
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Uploads image to storage service
   * In production, this would upload to Supabase Storage, AWS S3, or similar
   */
  static async uploadImage(file: File, userId: string): Promise<ImageUploadResult> {
    try {
      // Validate the file
      const validation = this.validateImage(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Compress the image
      const compressedFile = await this.compressImage(file);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      // For development/demo purposes, we'll use a data URL
      // In production, you would upload to your storage service like this:
      /*
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedFile);

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
      */

      // Demo implementation using FileReader
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({ success: true, url: e.target?.result as string });
        };
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to process image' });
        };
        reader.readAsDataURL(compressedFile);
      });

    } catch (error) {
      console.error('Image upload error:', error);
      return { success: false, error: 'Upload failed. Please try again.' };
    }
  }

  /**
   * Deletes an image from storage
   * In production, this would delete from your storage service
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // In production, you would delete from your storage service like this:
      /*
      const fileName = imageUrl.split('/').pop();
      const { error } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      return !error;
      */

      // For demo, we just return true since we're using data URLs
      return true;
    } catch (error) {
      console.error('Image deletion error:', error);
      return false;
    }
  }
}

export default ImageUploadService;