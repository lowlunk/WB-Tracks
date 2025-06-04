
import { db } from './db';
import { componentPhotos } from './db/schema';
import fs from 'fs/promises';
import path from 'path';

async function clearPlaceholderPhotos() {
  try {
    // Delete all component photos from database
    await db.delete(componentPhotos);
    
    // Clear the uploads/components directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'components');
    
    try {
      const files = await fs.readdir(uploadsDir);
      for (const file of files) {
        await fs.unlink(path.join(uploadsDir, file));
      }
      console.log('Cleared all component photos successfully');
    } catch (error) {
      console.log('Uploads directory not found or empty');
    }
    
  } catch (error) {
    console.error('Error clearing photos:', error);
  }
}

clearPlaceholderPhotos();
