const supabaseConfig = {
  url: 'https://zrbcxremffbsjifjsfsm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyYmN4cmVtZmZic2ppZmpzZnNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMTM5NzksImV4cCI6MjA3Mjc4OTk3OX0.lUnvuVguaN1j_dcCDlp4l8c5z7BetziuyiHgPUTNdX0'
};

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

window.supabase = supabase;

window.supabaseStorage = {
  async uploadImage(file, path) {
    try {
      const timestamp = Date.now();
      
      let fileExtension = 'webp';
      let originalFileName = '';
      
      if (file instanceof File) {
        fileExtension = file.name.split('.').pop() || 'webp';
        originalFileName = file.name;
      } else if (file instanceof Blob) {
        fileExtension = 'webp';
        originalFileName = 'converted_image.webp';
      }
      
      const safeFileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
      const fullPath = `${path}/${safeFileName}`;

      const { data, error } = await supabase.storage
        .from('NBTI')
        .upload(fullPath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // console.error('Supabase Storage 업로드 오류:', error);
        return { success: false, error: error.message };
      }

      const { data: urlData } = supabase.storage
        .from('NBTI')
        .getPublicUrl(fullPath);

      return { 
        success: true, 
        url: urlData.publicUrl, 
        fileName: safeFileName,
        path: fullPath
      };
    } catch (error) {
      // console.error('Supabase Storage 업로드 실패:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteImage(path) {
    try {
      const { data, error } = await supabase.storage
        .from('NBTI')
        .remove([path]);

      if (error) {
        // console.error('Supabase Storage 삭제 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, deletedFiles: data };
    } catch (error) {
      // console.error('Supabase Storage 삭제 실패:', error);
      return { success: false, error: error.message };
    }
  },

  async listFiles(folderPath) {
    try {
      const { data, error } = await supabase.storage
        .from('NBTI')
        .list(folderPath, {
          limit: 100,
          offset: 0
        });

      if (error) {
        // console.error('Supabase Storage 파일 목록 조회 오류:', error);
        return { success: false, error: error.message };
      }

      return { success: true, files: data };
    } catch (error) {
      // console.error('Supabase Storage 파일 목록 조회 실패:', error);
      return { success: false, error: error.message };
    }
  },

  getPublicUrl(path) {
    const { data } = supabase.storage
      .from('NBTI')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
};
