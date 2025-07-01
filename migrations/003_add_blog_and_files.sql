-- ========================================
-- MIGRATION 003: Add Blog and File Management Tables
-- This migration adds blog functionality to PostgreSQL
-- eliminating the need for MongoDB/DocumentDB
-- ========================================

-- Blog categories table
CREATE TABLE blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  parent_category_id INT REFERENCES blog_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog tags table
CREATE TABLE blog_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  featured_image_url TEXT,
  category_id INT REFERENCES blog_categories(id) ON DELETE SET NULL,
  author_id INT REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  view_count INT DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog post tags (many-to-many relationship)
CREATE TABLE blog_post_tags (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id INT REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

-- File uploads table (replaces MongoDB GridFS)
CREATE TABLE file_uploads (
  id SERIAL PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'image', 'document', 'video', etc.
  uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB, -- Store additional file metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File associations (links files to other entities)
CREATE TABLE file_associations (
  id SERIAL PRIMARY KEY,
  file_id INT REFERENCES file_uploads(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'blog_post', 'user_profile', 'appointment', etc.
  entity_id INT NOT NULL,
  association_type VARCHAR(50) DEFAULT 'attachment', -- 'featured_image', 'attachment', 'gallery', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_id, entity_type, entity_id, association_type)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Blog categories indexes
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_parent ON blog_categories(parent_category_id);
CREATE INDEX idx_blog_categories_active ON blog_categories(is_active);

-- Blog tags indexes
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Blog posts indexes
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_view_count ON blog_posts(view_count);
CREATE INDEX idx_blog_posts_created_at ON blog_posts(created_at);

-- Blog post tags indexes
CREATE INDEX idx_blog_post_tags_post ON blog_post_tags(post_id);
CREATE INDEX idx_blog_post_tags_tag ON blog_post_tags(tag_id);

-- File uploads indexes
CREATE INDEX idx_file_uploads_stored_name ON file_uploads(stored_name);
CREATE INDEX idx_file_uploads_file_type ON file_uploads(file_type);
CREATE INDEX idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_is_public ON file_uploads(is_public);
CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);

-- File associations indexes
CREATE INDEX idx_file_associations_file ON file_associations(file_id);
CREATE INDEX idx_file_associations_entity ON file_associations(entity_type, entity_id);
CREATE INDEX idx_file_associations_type ON file_associations(association_type);

-- ========================================
-- SAMPLE DATA
-- ========================================

-- Insert default blog categories
INSERT INTO blog_categories (name, slug, description) VALUES
('Health Tips', 'health-tips', 'General health and wellness advice'),
('Chiropractic Care', 'chiropractic-care', 'Information about chiropractic treatments'),
('Exercise & Therapy', 'exercise-therapy', 'Physical therapy and exercise guidance'),
('Pain Management', 'pain-management', 'Techniques for managing chronic pain'),
('Clinic Updates', 'clinic-updates', 'News and updates from our clinic');

-- Insert default blog tags
INSERT INTO blog_tags (name, slug, color) VALUES
('back-pain', 'back-pain', '#EF4444'),
('neck-pain', 'neck-pain', '#F97316'),
('exercise', 'exercise', '#10B981'),
('wellness', 'wellness', '#3B82F6'),
('treatment', 'treatment', '#8B5CF6'),
('prevention', 'prevention', '#06B6D4'),
('nutrition', 'nutrition', '#84CC16'),
('posture', 'posture', '#F59E0B');

-- ========================================
-- MIGRATION TRACKING
-- ========================================
INSERT INTO pgmigrations (name, run_on) VALUES ('003_add_blog_and_files.sql', NOW()); 