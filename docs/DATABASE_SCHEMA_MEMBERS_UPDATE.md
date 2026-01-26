# Supabase Database Update: Post Office Fields

Run the following SQL script in your Supabase SQL Editor to add the "Post Office" fields to your `members` table.

## SQL Script

```sql
-- Add Post Office fields to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS post_office TEXT,
ADD COLUMN IF NOT EXISTS post_office_marathi TEXT;

-- Recommended: Add joining_date if not already present
-- ALTER TABLE members ADD COLUMN IF NOT EXISTS joining_date DATE;
```

## How to Apply

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project.
3. Click on the **SQL Editor** icon in the left sidebar.
4. Click **New query**.
5. Paste the code above into the editor.
6. Click **Run**.

Once executed, your member form will be able to save and load "Post Office" information correctly.
