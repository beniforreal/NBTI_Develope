-- Supabase Storage 정책 설정
-- NBTI 버킷에 대한 접근 권한 설정

-- 1. NBTI 버킷 생성 (이미 생성되어 있다면 스킵)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('NBTI', 'NBTI', true);

-- 2. img/profile 폴더 정책
-- 모든 사용자가 읽기 가능, 인증된 사용자만 쓰기 가능
CREATE POLICY "img_profile_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'NBTI' AND name LIKE 'img/profile/%');

CREATE POLICY "img_profile_write_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'NBTI' AND name LIKE 'img/profile/%');

CREATE POLICY "img_profile_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'NBTI' AND name LIKE 'img/profile/%');

CREATE POLICY "img_profile_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'NBTI' AND name LIKE 'img/profile/%');

-- 3. img/posting 폴더 정책
-- 모든 사용자가 읽기 가능, 인증된 사용자만 쓰기 가능
CREATE POLICY "img_posting_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'NBTI' AND name LIKE 'img/posting/%');

CREATE POLICY "img_posting_write_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'NBTI' AND name LIKE 'img/posting/%');

CREATE POLICY "img_posting_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'NBTI' AND name LIKE 'img/posting/%');

CREATE POLICY "img_posting_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'NBTI' AND name LIKE 'img/posting/%');

-- 4. 기타 파일들에 대한 정책 (필요시)
CREATE POLICY "NBTI_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'NBTI');

CREATE POLICY "NBTI_write_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'NBTI');

CREATE POLICY "NBTI_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'NBTI');

CREATE POLICY "NBTI_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'NBTI');
