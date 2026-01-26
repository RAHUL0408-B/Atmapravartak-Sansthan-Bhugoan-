# Supabase Database Schema for Programs

You need to create a `programs` table in your Supabase database with the following structure:

## SQL Script

```sql
-- Create programs table
CREATE TABLE programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_marathi TEXT,
    description TEXT,
    description_marathi TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    location TEXT,
    location_marathi TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create storage bucket for program images
INSERT INTO storage.buckets (id, name, public)
VALUES ('programs', 'programs', true);

-- Set up storage policies
CREATE POLICY "Program images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'programs');

CREATE POLICY "Authenticated users can upload program images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'programs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update program images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'programs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete program images"
ON storage.objects FOR DELETE
USING (bucket_id = 'programs' AND auth.role() = 'authenticated');

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- Create policies for programs table
CREATE POLICY "Programs are viewable by everyone"
ON programs FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert programs"
ON programs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update programs"
ON programs FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete programs"
ON programs FOR DELETE
USING (auth.role() = 'authenticated');
```

## Steps to Execute

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the above SQL script
4. Run the script
5. Verify that the `programs` table and storage bucket have been created

The program management system is now ready to use!
