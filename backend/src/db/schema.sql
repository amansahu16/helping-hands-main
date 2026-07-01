-- Helping Hands Database Schema Definition
-- Optimized with specific column lengths and query indexes to make access faster.

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    photo_url VARCHAR(255),
    date_of_birth DATE,
    occupation VARCHAR(100),
    otp_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. NGOs Table
CREATE TABLE IF NOT EXISTS ngos (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    photo_url VARCHAR(255),
    certificate_url VARCHAR(255),
    area_of_work VARCHAR(100),
    description TEXT,
    achievements TEXT,
    work_done TEXT,
    upi_id VARCHAR(100),
    website_url VARCHAR(255),
    bank_name VARCHAR(100),
    account_holder VARCHAR(150),
    account_number VARCHAR(50),
    ifsc VARCHAR(20),
    virtual_balance NUMERIC(12, 2) DEFAULT 0,
    otp_verified BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'OTHER',
    description TEXT,
    location VARCHAR(255),
    time_from TIMESTAMP,
    time_to TIMESTAMP,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'PLANNED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    organizer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organizer_ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL
);

-- 5. Campaign Participants Table
CREATE TABLE IF NOT EXISTS campaign_participants (
    id UUID PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    identity_number VARCHAR(50),
    status VARCHAR(30) DEFAULT 'PENDING',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_campaign_participant UNIQUE (campaign_id, user_id)
);

-- 6. Donations Table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY,
    donor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    donor_ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    title VARCHAR(150),
    category VARCHAR(50),
    condition VARCHAR(50),
    description TEXT,
    quantity INTEGER,
    persons_served INTEGER,
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    pickup_address TEXT,
    pickup_type VARCHAR(50),
    time_from TIMESTAMP,
    time_to TIMESTAMP,
    photos TEXT[],
    recipient_ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2),
    transaction_id VARCHAR(100),
    otp VARCHAR(10),
    reached_donor BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'PENDING',
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    settlement_status VARCHAR(50) DEFAULT 'SIMULATED_SUCCESS',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    payment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- 7. Donation Items Table
CREATE TABLE IF NOT EXISTS donation_items (
    id UUID PRIMARY KEY,
    donation_id UUID REFERENCES donations(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 1,
    category VARCHAR(50)
);

-- 8. Rescue Requests Table
CREATE TABLE IF NOT EXISTS rescue_requests (
    id UUID PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    description TEXT,
    condition VARCHAR(100),
    photos TEXT[],
    nearby_hospital VARCHAR(255),
    nearby_center_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Animals Table
CREATE TABLE IF NOT EXISTS animals (
    id UUID PRIMARY KEY,
    category VARCHAR(50),
    name VARCHAR(100),
    age VARCHAR(20),
    location VARCHAR(255),
    description TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    photos TEXT[],
    posted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    posted_by_ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Adoptions Table
CREATE TABLE IF NOT EXISTS adoptions (
    id UUID PRIMARY KEY,
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE NOT NULL,
    adopter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adopted_at TIMESTAMP
);

-- 11. NGO Posts Table
CREATE TABLE IF NOT EXISTS ngo_posts (
    id UUID PRIMARY KEY,
    ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE NOT NULL,
    post_type VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. NGO Reviews Table
CREATE TABLE IF NOT EXISTS ngo_reviews (
    id UUID PRIMARY KEY,
    ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    rating INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Newsletters Table
CREATE TABLE IF NOT EXISTS newsletters (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL,
    resolved_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    type VARCHAR(50) DEFAULT 'GENERAL',
    created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    ngo_id UUID REFERENCES ngos(id) ON DELETE SET NULL
);

-- 17. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    created_by_admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PERFORMANCE OPTIMIZATION INDEXES (MAKES ACCESS FASTER)
-- ============================================================

-- Campaigns Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_org_user ON campaigns(organizer_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org_ngo ON campaigns(organizer_ngo_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Campaign Participants Indexes
CREATE INDEX IF NOT EXISTS idx_camp_participants_camp ON campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_participants_user ON campaign_participants(user_id);

-- Donations Indexes
CREATE INDEX IF NOT EXISTS idx_donations_donor_user ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_ngo ON donations(donor_ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_rec_ngo ON donations(recipient_ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

-- Donation Items Index
CREATE INDEX IF NOT EXISTS idx_don_items_donation ON donation_items(donation_id);

-- Rescue Requests Indexes
CREATE INDEX IF NOT EXISTS idx_rescues_reporter_user ON rescue_requests(reporter_id);
CREATE INDEX IF NOT EXISTS idx_rescues_reporter_ngo ON rescue_requests(reporter_ngo_id);
CREATE INDEX IF NOT EXISTS idx_rescues_nearby_center ON rescue_requests(nearby_center_id);
CREATE INDEX IF NOT EXISTS idx_rescues_status ON rescue_requests(status);

-- Animals Indexes
CREATE INDEX IF NOT EXISTS idx_animals_posted_user ON animals(posted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_animals_posted_ngo ON animals(posted_by_ngo_id);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);

-- Adoptions Indexes
CREATE INDEX IF NOT EXISTS idx_adoptions_animal ON adoptions(animal_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_adopter ON adoptions(adopter_id);
CREATE INDEX IF NOT EXISTS idx_adoptions_ngo ON adoptions(ngo_id);

-- NGO Posts, Reviews, and Testimonials Indexes
CREATE INDEX IF NOT EXISTS idx_ngo_posts_ngo ON ngo_posts(ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngo_reviews_ngo ON ngo_reviews(ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngo_reviews_user ON ngo_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_user ON testimonials(user_id);

-- Complaints Index
CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON complaints(reporter_id);

-- Admins Created By Index
CREATE INDEX IF NOT EXISTS idx_admins_created_by ON admins(created_by);

-- Newsletters User & NGO Indexes
CREATE INDEX IF NOT EXISTS idx_newsletters_user ON newsletters(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletters_ngo ON newsletters(ngo_id);

-- Contact Messages User, NGO & Admin Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_user ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_ngo ON contact_messages(ngo_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_admin ON contact_messages(resolved_by_admin_id);

-- Locations Admin & NGO Indexes
CREATE INDEX IF NOT EXISTS idx_locations_admin ON locations(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_locations_ngo ON locations(ngo_id);

-- System Settings Admin Index
CREATE INDEX IF NOT EXISTS idx_system_settings_admin ON system_settings(updated_by_admin_id);

-- FAQs Admin Index
CREATE INDEX IF NOT EXISTS idx_faqs_admin ON faqs(created_by_admin_id);
