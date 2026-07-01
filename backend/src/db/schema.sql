-- ============================================================
-- Helping Hands Database Schema DDL Definition
-- Optimized for 3NF Normalization and Strict Attribute Count Limits (5-15 columns)
-- ============================================================

-- Enable UUID extension for UUID key generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fallback function if uuid-ossp is not installed/allowed in current environment
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Create a dedicated compatibility schema for legacy query routing
CREATE SCHEMA IF NOT EXISTS compat;

-- ============================================================
-- 1. accounts (Attributes: 10)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    role VARCHAR(20) NOT NULL CHECK (role IN ('USER', 'NGO', 'ADMIN')),
    photo_url VARCHAR(255),
    otp_verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. user_profiles (Attributes: 6)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
    date_of_birth DATE,
    occupation VARCHAR(100),
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
);

-- ============================================================
-- 3. ngo_profiles (Attributes: 8)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ngo_profiles (
    account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    certificate_url VARCHAR(255),
    area_of_work VARCHAR(100),
    verified BOOLEAN DEFAULT FALSE,
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
);

-- ============================================================
-- 4. ngo_details (Attributes: 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ngo_details (
    account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
    description TEXT,
    achievements TEXT,
    work_done TEXT,
    website_url VARCHAR(255)
);

-- ============================================================
-- 5. ngo_financials (Attributes: 7)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ngo_financials (
    account_id UUID PRIMARY KEY REFERENCES public.accounts(id) ON DELETE CASCADE,
    upi_id VARCHAR(100),
    bank_name VARCHAR(100),
    account_holder VARCHAR(150),
    account_number VARCHAR(50),
    ifsc VARCHAR(20),
    virtual_balance NUMERIC(12, 2) DEFAULT 0
);

-- ============================================================
-- 6. campaigns (Attributes: 7)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'OTHER',
    description TEXT,
    status VARCHAR(30) DEFAULT 'PLANNED',
    organizer_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. campaign_locations (Attributes: 8)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_locations (
    campaign_id UUID PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    time_from TIMESTAMP,
    time_to TIMESTAMP,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0
);

-- ============================================================
-- 8. campaign_participants (Attributes: 6)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    identity_number VARCHAR(50),
    status VARCHAR(30) DEFAULT 'PENDING',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_campaign_participant UNIQUE (campaign_id, account_id)
);

-- ============================================================
-- 9. donations (Attributes: 14)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    recipient_ngo_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    title VARCHAR(150),
    amount NUMERIC(12, 2),
    transaction_id VARCHAR(100),
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    status VARCHAR(30) DEFAULT 'PENDING',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    payment_date TIMESTAMP,
    settlement_status VARCHAR(50) DEFAULT 'SIMULATED_SUCCESS',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 10. donation_logistics (Attributes: 15)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.donation_logistics (
    donation_id UUID PRIMARY KEY REFERENCES public.donations(id) ON DELETE CASCADE,
    category VARCHAR(50),
    condition VARCHAR(50),
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
    otp VARCHAR(10),
    reached_donor BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- 11. incidents (Attributes: 14)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_type VARCHAR(20) NOT NULL CHECK (incident_type IN ('RESCUE', 'ADOPTION')),
    reporter_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    category VARCHAR(50),
    name VARCHAR(100),
    age VARCHAR(20),
    condition VARCHAR(100),
    description TEXT,
    photos TEXT[],
    location VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    status VARCHAR(30) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. incident_resolutions (Attributes: 5)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.incident_resolutions (
    incident_id UUID PRIMARY KEY REFERENCES public.incidents(id) ON DELETE CASCADE,
    nearby_hospital VARCHAR(255),
    nearby_center_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    adopter_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    adopted_at TIMESTAMP
);

-- ============================================================
-- 13. user_feedbacks (Attributes: 12)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('REVIEW', 'TESTIMONIAL', 'COMPLAINT')),
    user_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE,
    target_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    target_incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
    title VARCHAR(150),
    content TEXT,
    rating INTEGER,
    status VARCHAR(30) DEFAULT 'PENDING',
    target_type VARCHAR(50),
    target_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 14. platform_communications (Attributes: 13)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comm_type VARCHAR(20) NOT NULL CHECK (comm_type IN ('CONTACT', 'NEWSLETTER', 'POST')),
    sender_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(15),
    title VARCHAR(150),
    message TEXT,
    location VARCHAR(255),
    status VARCHAR(30) DEFAULT 'PENDING',
    post_type VARCHAR(50),
    resolved_by_admin_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 15. system_registry (Attributes: 11)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registry_type VARCHAR(20) NOT NULL CHECK (registry_type IN ('SETTING', 'FAQ', 'LOCATION')),
    group_category VARCHAR(100),
    key_name TEXT,
    text_value TEXT,
    address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    updated_by_admin_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    associated_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enforce unique index for settings keys
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_registry_settings 
ON public.system_registry (key_name) 
WHERE registry_type = 'SETTING';

-- ============================================================
-- HIGH-PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_role ON public.accounts(role);
CREATE INDEX IF NOT EXISTS idx_accounts_created_by ON public.accounts(created_by);
CREATE INDEX IF NOT EXISTS idx_ngo_profiles_verified ON public.ngo_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_campaigns_organizer ON public.campaigns(organizer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_camp_participants_camp ON public.campaign_participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_participants_account ON public.campaign_participants(account_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_recipient ON public.donations(recipient_ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_payment_status ON public.donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON public.incidents(reporter_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_inc_resolutions_center ON public.incident_resolutions(nearby_center_id);
CREATE INDEX IF NOT EXISTS idx_inc_resolutions_adopter ON public.incident_resolutions(adopter_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON public.user_feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_target_acc ON public.user_feedbacks(target_account_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_target_inc ON public.user_feedbacks(target_incident_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_type ON public.user_feedbacks(feedback_type);
CREATE INDEX IF NOT EXISTS idx_communications_sender ON public.platform_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON public.platform_communications(comm_type);
CREATE INDEX IF NOT EXISTS idx_communications_admin ON public.platform_communications(resolved_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_registry_type ON public.system_registry(registry_type);
CREATE INDEX IF NOT EXISTS idx_registry_admin ON public.system_registry(updated_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_registry_associated_acc ON public.system_registry(associated_account_id);


-- ============================================================
-- COMPATIBILITY VIEWS AND TRIGGERS (compat schema)
-- ============================================================

-- 1. users View
CREATE OR REPLACE VIEW compat.users AS
SELECT 
    a.id,
    a.name,
    a.email,
    a.password_hash,
    a.phone_number,
    up.location,
    up.latitude,
    up.longitude,
    a.photo_url,
    up.date_of_birth,
    up.occupation,
    a.otp_verified,
    a.created_at
FROM public.accounts a
LEFT JOIN public.user_profiles up ON a.id = up.account_id
WHERE a.role = 'USER';

CREATE OR REPLACE FUNCTION compat.insert_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.accounts (id, name, email, password_hash, phone_number, role, photo_url, otp_verified, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), NEW.name, NEW.email, NEW.password_hash, NEW.phone_number, 'USER', NEW.photo_url, COALESCE(NEW.otp_verified, FALSE), COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;

    INSERT INTO public.user_profiles (account_id, date_of_birth, occupation, location, latitude, longitude)
    VALUES (NEW.id, NEW.date_of_birth, NEW.occupation, NEW.location, NEW.latitude, NEW.longitude);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_user
INSTEAD OF INSERT ON compat.users
FOR EACH ROW EXECUTE FUNCTION compat.insert_user();

CREATE OR REPLACE FUNCTION compat.update_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.accounts SET
        name = NEW.name,
        email = NEW.email,
        password_hash = NEW.password_hash,
        phone_number = NEW.phone_number,
        photo_url = NEW.photo_url,
        otp_verified = NEW.otp_verified,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    INSERT INTO public.user_profiles (account_id, date_of_birth, occupation, location, latitude, longitude)
    VALUES (OLD.id, NEW.date_of_birth, NEW.occupation, NEW.location, NEW.latitude, NEW.longitude)
    ON CONFLICT (account_id) DO UPDATE SET
        date_of_birth = EXCLUDED.date_of_birth,
        occupation = EXCLUDED.occupation,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user
INSTEAD OF UPDATE ON compat.users
FOR EACH ROW EXECUTE FUNCTION compat.update_user();

CREATE OR REPLACE FUNCTION compat.delete_user()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.accounts WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_user
INSTEAD OF DELETE ON compat.users
FOR EACH ROW EXECUTE FUNCTION compat.delete_user();


-- 2. ngos View
CREATE OR REPLACE VIEW compat.ngos AS
SELECT 
    a.id,
    a.name,
    a.email,
    a.password_hash,
    a.phone_number,
    np.registration_number,
    np.location,
    np.latitude,
    np.longitude,
    a.photo_url,
    np.certificate_url,
    np.area_of_work,
    nd.description,
    nd.achievements,
    nd.work_done,
    nf.upi_id,
    nd.website_url,
    nf.bank_name,
    nf.account_holder,
    nf.account_number,
    nf.ifsc,
    nf.virtual_balance,
    a.otp_verified,
    np.verified,
    a.created_at
FROM public.accounts a
LEFT JOIN public.ngo_profiles np ON a.id = np.account_id
LEFT JOIN public.ngo_details nd ON a.id = nd.account_id
LEFT JOIN public.ngo_financials nf ON a.id = nf.account_id
WHERE a.role = 'NGO';

CREATE OR REPLACE FUNCTION compat.insert_ngo()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.accounts (id, name, email, password_hash, phone_number, role, photo_url, otp_verified, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), NEW.name, NEW.email, NEW.password_hash, NEW.phone_number, 'NGO', NEW.photo_url, COALESCE(NEW.otp_verified, FALSE), COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;

    INSERT INTO public.ngo_profiles (account_id, registration_number, certificate_url, area_of_work, verified, location, latitude, longitude)
    VALUES (NEW.id, NEW.registration_number, NEW.certificate_url, NEW.area_of_work, COALESCE(NEW.verified, FALSE), NEW.location, NEW.latitude, NEW.longitude);

    INSERT INTO public.ngo_details (account_id, description, achievements, work_done, website_url)
    VALUES (NEW.id, NEW.description, NEW.achievements, NEW.work_done, NEW.website_url);

    INSERT INTO public.ngo_financials (account_id, upi_id, bank_name, account_holder, account_number, ifsc, virtual_balance)
    VALUES (NEW.id, NEW.upi_id, NEW.bank_name, NEW.account_holder, NEW.account_number, NEW.ifsc, COALESCE(NEW.virtual_balance, 0));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_ngo
INSTEAD OF INSERT ON compat.ngos
FOR EACH ROW EXECUTE FUNCTION compat.insert_ngo();

CREATE OR REPLACE FUNCTION compat.update_ngo()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.accounts SET
        name = NEW.name,
        email = NEW.email,
        password_hash = NEW.password_hash,
        phone_number = NEW.phone_number,
        photo_url = NEW.photo_url,
        otp_verified = NEW.otp_verified,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    INSERT INTO public.ngo_profiles (account_id, registration_number, certificate_url, area_of_work, verified, location, latitude, longitude)
    VALUES (OLD.id, NEW.registration_number, NEW.certificate_url, NEW.area_of_work, COALESCE(NEW.verified, FALSE), NEW.location, NEW.latitude, NEW.longitude)
    ON CONFLICT (account_id) DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        certificate_url = EXCLUDED.certificate_url,
        area_of_work = EXCLUDED.area_of_work,
        verified = EXCLUDED.verified,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude;

    INSERT INTO public.ngo_details (account_id, description, achievements, work_done, website_url)
    VALUES (OLD.id, NEW.description, NEW.achievements, NEW.work_done, NEW.website_url)
    ON CONFLICT (account_id) DO UPDATE SET
        description = EXCLUDED.description,
        achievements = EXCLUDED.achievements,
        work_done = EXCLUDED.work_done,
        website_url = EXCLUDED.website_url;

    INSERT INTO public.ngo_financials (account_id, upi_id, bank_name, account_holder, account_number, ifsc, virtual_balance)
    VALUES (OLD.id, NEW.upi_id, NEW.bank_name, NEW.account_holder, NEW.account_number, NEW.ifsc, COALESCE(NEW.virtual_balance, 0))
    ON CONFLICT (account_id) DO UPDATE SET
        upi_id = EXCLUDED.upi_id,
        bank_name = EXCLUDED.bank_name,
        account_holder = EXCLUDED.account_holder,
        account_number = EXCLUDED.account_number,
        ifsc = EXCLUDED.ifsc,
        virtual_balance = EXCLUDED.virtual_balance;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ngo
INSTEAD OF UPDATE ON compat.ngos
FOR EACH ROW EXECUTE FUNCTION compat.update_ngo();

CREATE OR REPLACE FUNCTION compat.delete_ngo()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.accounts WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_ngo
INSTEAD OF DELETE ON compat.ngos
FOR EACH ROW EXECUTE FUNCTION compat.delete_ngo();


-- 3. admins View
CREATE OR REPLACE VIEW compat.admins AS
SELECT 
    id,
    name,
    email,
    phone_number,
    password_hash,
    created_by,
    created_at
FROM public.accounts
WHERE role = 'ADMIN';

CREATE OR REPLACE FUNCTION compat.insert_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.accounts (id, name, email, password_hash, phone_number, role, created_by, created_at, otp_verified)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), NEW.name, NEW.email, NEW.password_hash, NEW.phone_number, 'ADMIN', NEW.created_by, COALESCE(NEW.created_at, CURRENT_TIMESTAMP), TRUE)
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_admin
INSTEAD OF INSERT ON compat.admins
FOR EACH ROW EXECUTE FUNCTION compat.insert_admin();

CREATE OR REPLACE FUNCTION compat.update_admin()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.accounts SET
        name = NEW.name,
        email = NEW.email,
        password_hash = NEW.password_hash,
        phone_number = NEW.phone_number,
        created_by = NEW.created_by,
        created_at = NEW.created_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin
INSTEAD OF UPDATE ON compat.admins
FOR EACH ROW EXECUTE FUNCTION compat.update_admin();

CREATE OR REPLACE FUNCTION compat.delete_admin()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.accounts WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_admin
INSTEAD OF DELETE ON compat.admins
FOR EACH ROW EXECUTE FUNCTION compat.delete_admin();


-- 4. campaigns View
CREATE OR REPLACE VIEW compat.campaigns AS
SELECT 
    c.id,
    c.name,
    c.type,
    c.description,
    cl.location,
    cl.time_from,
    cl.time_to,
    cl.max_participants,
    cl.current_participants,
    c.status,
    c.created_at,
    cl.latitude,
    cl.longitude,
    CASE WHEN a.role = 'USER' THEN c.organizer_id ELSE NULL END AS organizer_user_id,
    CASE WHEN a.role = 'NGO' THEN c.organizer_id ELSE NULL END AS organizer_ngo_id
FROM public.campaigns c
LEFT JOIN public.campaign_locations cl ON c.id = cl.campaign_id
LEFT JOIN public.accounts a ON c.organizer_id = a.id;

CREATE OR REPLACE FUNCTION compat.insert_campaign()
RETURNS TRIGGER AS $$
DECLARE
    v_organizer_id UUID;
BEGIN
    v_organizer_id := COALESCE(NEW.organizer_user_id, NEW.organizer_ngo_id);

    INSERT INTO public.campaigns (id, name, type, description, status, organizer_id, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), NEW.name, NEW.type, NEW.description, COALESCE(NEW.status, 'PLANNED'), v_organizer_id, COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;

    INSERT INTO public.campaign_locations (campaign_id, location, latitude, longitude, time_from, time_to, max_participants, current_participants)
    VALUES (NEW.id, NEW.location, NEW.latitude, NEW.longitude, NEW.time_from, NEW.time_to, NEW.max_participants, COALESCE(NEW.current_participants, 0));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_campaign
INSTEAD OF INSERT ON compat.campaigns
FOR EACH ROW EXECUTE FUNCTION compat.insert_campaign();

CREATE OR REPLACE FUNCTION compat.update_campaign()
RETURNS TRIGGER AS $$
DECLARE
    v_organizer_id UUID;
BEGIN
    v_organizer_id := COALESCE(NEW.organizer_user_id, NEW.organizer_ngo_id);

    UPDATE public.campaigns SET
        name = NEW.name,
        type = NEW.type,
        description = NEW.description,
        status = NEW.status,
        organizer_id = v_organizer_id,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    INSERT INTO public.campaign_locations (campaign_id, location, latitude, longitude, time_from, time_to, max_participants, current_participants)
    VALUES (OLD.id, NEW.location, NEW.latitude, NEW.longitude, NEW.time_from, NEW.time_to, NEW.max_participants, NEW.current_participants)
    ON CONFLICT (campaign_id) DO UPDATE SET
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        time_from = EXCLUDED.time_from,
        time_to = EXCLUDED.time_to,
        max_participants = EXCLUDED.max_participants,
        current_participants = EXCLUDED.current_participants;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign
INSTEAD OF UPDATE ON compat.campaigns
FOR EACH ROW EXECUTE FUNCTION compat.update_campaign();

CREATE OR REPLACE FUNCTION compat.delete_campaign()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.campaigns WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_campaign
INSTEAD OF DELETE ON compat.campaigns
FOR EACH ROW EXECUTE FUNCTION compat.delete_campaign();


-- 5. campaign_participants View
CREATE OR REPLACE VIEW compat.campaign_participants AS
SELECT 
    id,
    campaign_id,
    account_id AS user_id,
    identity_number,
    status,
    joined_at
FROM public.campaign_participants;

CREATE OR REPLACE FUNCTION compat.insert_campaign_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.campaign_participants (id, campaign_id, account_id, identity_number, status, joined_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), NEW.campaign_id, NEW.user_id, NEW.identity_number, COALESCE(NEW.status, 'PENDING'), COALESCE(NEW.joined_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_campaign_participant
INSTEAD OF INSERT ON compat.campaign_participants
FOR EACH ROW EXECUTE FUNCTION compat.insert_campaign_participant();

CREATE OR REPLACE FUNCTION compat.update_campaign_participant()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.campaign_participants SET
        campaign_id = NEW.campaign_id,
        account_id = NEW.user_id,
        identity_number = NEW.identity_number,
        status = NEW.status,
        joined_at = NEW.joined_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_participant
INSTEAD OF UPDATE ON compat.campaign_participants
FOR EACH ROW EXECUTE FUNCTION compat.update_campaign_participant();

CREATE OR REPLACE FUNCTION compat.delete_campaign_participant()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.campaign_participants WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_campaign_participant
INSTEAD OF DELETE ON compat.campaign_participants
FOR EACH ROW EXECUTE FUNCTION compat.delete_campaign_participant();


-- 6. donations View
CREATE OR REPLACE VIEW compat.donations AS
SELECT 
    d.id,
    CASE WHEN a_donor.role = 'USER' THEN d.donor_id ELSE NULL END AS donor_id,
    CASE WHEN a_donor.role = 'NGO' THEN d.donor_id ELSE NULL END AS donor_ngo_id,
    d.title,
    dl.category,
    dl.condition,
    d.description,
    dl.quantity,
    dl.persons_served,
    dl.location,
    dl.latitude,
    dl.longitude,
    dl.pickup_address,
    dl.pickup_type,
    dl.time_from,
    dl.time_to,
    dl.photos,
    d.recipient_ngo_id,
    d.amount,
    d.transaction_id,
    dl.otp,
    dl.reached_donor,
    d.status,
    d.payment_status,
    d.settlement_status,
    d.razorpay_order_id,
    d.razorpay_payment_id,
    d.payment_date,
    d.created_at
FROM public.donations d
LEFT JOIN public.donation_logistics dl ON d.id = dl.donation_id
LEFT JOIN public.accounts a_donor ON d.donor_id = a_donor.id;

CREATE OR REPLACE FUNCTION compat.insert_donation()
RETURNS TRIGGER AS $$
DECLARE
    v_donor_id UUID;
BEGIN
    v_donor_id := COALESCE(NEW.donor_id, NEW.donor_ngo_id);

    INSERT INTO public.donations (
        id, donor_id, recipient_ngo_id, title, amount, transaction_id, 
        payment_status, status, razorpay_order_id, razorpay_payment_id, 
        payment_date, settlement_status, description, created_at
    )
    VALUES (
        COALESCE(NEW.id, uuid_generate_v4()), v_donor_id, NEW.recipient_ngo_id, NEW.title, NEW.amount, NEW.transaction_id, 
        COALESCE(NEW.payment_status, 'PENDING'), COALESCE(NEW.status, 'PENDING'), NEW.razorpay_order_id, NEW.razorpay_payment_id, 
        NEW.payment_date, COALESCE(NEW.settlement_status, 'SIMULATED_SUCCESS'), NEW.description, COALESCE(NEW.created_at, CURRENT_TIMESTAMP)
    )
    RETURNING id INTO NEW.id;

    INSERT INTO public.donation_logistics (
        donation_id, category, condition, quantity, persons_served, location, 
        latitude, longitude, pickup_address, pickup_type, time_from, time_to, photos, otp, reached_donor
    )
    VALUES (
        NEW.id, NEW.category, NEW.condition, NEW.quantity, NEW.persons_served, NEW.location, 
        NEW.latitude, NEW.longitude, NEW.pickup_address, NEW.pickup_type, NEW.time_from, NEW.time_to, NEW.photos, NEW.otp, COALESCE(NEW.reached_donor, FALSE)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_donation
INSTEAD OF INSERT ON compat.donations
FOR EACH ROW EXECUTE FUNCTION compat.insert_donation();

CREATE OR REPLACE FUNCTION compat.update_donation()
RETURNS TRIGGER AS $$
DECLARE
    v_donor_id UUID;
BEGIN
    v_donor_id := COALESCE(NEW.donor_id, NEW.donor_ngo_id);

    UPDATE public.donations SET
        donor_id = v_donor_id,
        recipient_ngo_id = NEW.recipient_ngo_id,
        title = NEW.title,
        amount = NEW.amount,
        transaction_id = NEW.transaction_id,
        payment_status = NEW.payment_status,
        status = NEW.status,
        razorpay_order_id = NEW.razorpay_order_id,
        razorpay_payment_id = NEW.razorpay_payment_id,
        payment_date = NEW.payment_date,
        settlement_status = NEW.settlement_status,
        description = NEW.description,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    INSERT INTO public.donation_logistics (
        donation_id, category, condition, quantity, persons_served, location, 
        latitude, longitude, pickup_address, pickup_type, time_from, time_to, photos, otp, reached_donor
    )
    VALUES (
        OLD.id, NEW.category, NEW.condition, NEW.quantity, NEW.persons_served, NEW.location, 
        NEW.latitude, NEW.longitude, NEW.pickup_address, NEW.pickup_type, NEW.time_from, NEW.time_to, NEW.photos, NEW.otp, COALESCE(NEW.reached_donor, FALSE)
    )
    ON CONFLICT (donation_id) DO UPDATE SET
        category = EXCLUDED.category,
        condition = EXCLUDED.condition,
        quantity = EXCLUDED.quantity,
        persons_served = EXCLUDED.persons_served,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        pickup_address = EXCLUDED.pickup_address,
        pickup_type = EXCLUDED.pickup_type,
        time_from = EXCLUDED.time_from,
        time_to = EXCLUDED.time_to,
        photos = EXCLUDED.photos,
        otp = EXCLUDED.otp,
        reached_donor = EXCLUDED.reached_donor;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_donation
INSTEAD OF UPDATE ON compat.donations
FOR EACH ROW EXECUTE FUNCTION compat.update_donation();

CREATE OR REPLACE FUNCTION compat.delete_donation()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.donations WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_donation
INSTEAD OF DELETE ON compat.donations
FOR EACH ROW EXECUTE FUNCTION compat.delete_donation();


-- 7. donation_items View (Maps from logistics for compat)
CREATE OR REPLACE VIEW compat.donation_items AS
SELECT 
    donation_id AS id,
    donation_id,
    COALESCE(category, 'Item') AS name,
    COALESCE(quantity, 1) AS quantity,
    category
FROM public.donation_logistics;

CREATE OR REPLACE FUNCTION compat.insert_donation_item()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.donation_logistics SET
        category = COALESCE(NEW.category, category),
        quantity = COALESCE(NEW.quantity, quantity)
    WHERE donation_id = NEW.donation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_donation_item
INSTEAD OF INSERT ON compat.donation_items
FOR EACH ROW EXECUTE FUNCTION compat.insert_donation_item();


-- 8. rescue_requests View
CREATE OR REPLACE VIEW compat.rescue_requests AS
SELECT 
    i.id,
    CASE WHEN a_rep.role = 'USER' THEN i.reporter_id ELSE NULL END AS reporter_id,
    CASE WHEN a_rep.role = 'NGO' THEN i.reporter_id ELSE NULL END AS reporter_ngo_id,
    i.location,
    i.latitude,
    i.longitude,
    i.description,
    i.condition,
    i.photos,
    ir.nearby_hospital,
    ir.nearby_center_id,
    i.status,
    i.created_at
FROM public.incidents i
LEFT JOIN public.incident_resolutions ir ON i.id = ir.incident_id
LEFT JOIN public.accounts a_rep ON i.reporter_id = a_rep.id
WHERE i.incident_type = 'RESCUE';

CREATE OR REPLACE FUNCTION compat.insert_rescue_request()
RETURNS TRIGGER AS $$
DECLARE
    v_reporter_id UUID;
BEGIN
    v_reporter_id := COALESCE(NEW.reporter_id, NEW.reporter_ngo_id);

    INSERT INTO public.incidents (id, incident_type, reporter_id, location, latitude, longitude, description, condition, photos, status, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'RESCUE', v_reporter_id, NEW.location, NEW.latitude, NEW.longitude, NEW.description, NEW.condition, NEW.photos, COALESCE(NEW.status, 'OPEN'), COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;

    INSERT INTO public.incident_resolutions (incident_id, nearby_hospital, nearby_center_id, adopter_id, adopted_at)
    VALUES (NEW.id, NEW.nearby_hospital, NEW.nearby_center_id, NULL, NULL);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_rescue_request
INSTEAD OF INSERT ON compat.rescue_requests
FOR EACH ROW EXECUTE FUNCTION compat.insert_rescue_request();

CREATE OR REPLACE FUNCTION compat.update_rescue_request()
RETURNS TRIGGER AS $$
DECLARE
    v_reporter_id UUID;
BEGIN
    v_reporter_id := COALESCE(NEW.reporter_id, NEW.reporter_ngo_id);

    UPDATE public.incidents SET
        reporter_id = v_reporter_id,
        location = NEW.location,
        latitude = NEW.latitude,
        longitude = NEW.longitude,
        description = NEW.description,
        condition = NEW.condition,
        photos = NEW.photos,
        status = NEW.status,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    INSERT INTO public.incident_resolutions (incident_id, nearby_hospital, nearby_center_id)
    VALUES (OLD.id, NEW.nearby_hospital, NEW.nearby_center_id)
    ON CONFLICT (incident_id) DO UPDATE SET
        nearby_hospital = EXCLUDED.nearby_hospital,
        nearby_center_id = EXCLUDED.nearby_center_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rescue_request
INSTEAD OF UPDATE ON compat.rescue_requests
FOR EACH ROW EXECUTE FUNCTION compat.update_rescue_request();

CREATE OR REPLACE FUNCTION compat.delete_rescue_request()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.incidents WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_rescue_request
INSTEAD OF DELETE ON compat.rescue_requests
FOR EACH ROW EXECUTE FUNCTION compat.delete_rescue_request();


-- 9. animals View
CREATE OR REPLACE VIEW compat.animals AS
SELECT 
    i.id,
    i.category,
    i.name,
    i.age,
    i.location,
    i.description,
    i.latitude,
    i.longitude,
    i.photos,
    CASE WHEN a_post.role = 'USER' THEN i.reporter_id ELSE NULL END AS posted_by_user_id,
    CASE WHEN a_post.role = 'NGO' THEN i.reporter_id ELSE NULL END AS posted_by_ngo_id,
    i.status,
    i.created_at
FROM public.incidents i
LEFT JOIN public.accounts a_post ON i.reporter_id = a_post.id
WHERE i.incident_type = 'ADOPTION';

CREATE OR REPLACE FUNCTION compat.insert_animal()
RETURNS TRIGGER AS $$
DECLARE
    v_poster_id UUID;
BEGIN
    v_poster_id := COALESCE(NEW.posted_by_user_id, NEW.posted_by_ngo_id);

    INSERT INTO public.incidents (id, incident_type, reporter_id, category, name, age, location, latitude, longitude, description, photos, status, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'ADOPTION', v_poster_id, NEW.category, NEW.name, NEW.age, NEW.location, NEW.latitude, NEW.longitude, NEW.description, NEW.photos, COALESCE(NEW.status, 'AVAILABLE'), COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_animal
INSTEAD OF INSERT ON compat.animals
FOR EACH ROW EXECUTE FUNCTION compat.insert_animal();

CREATE OR REPLACE FUNCTION compat.update_animal()
RETURNS TRIGGER AS $$
DECLARE
    v_poster_id UUID;
BEGIN
    v_poster_id := COALESCE(NEW.posted_by_user_id, NEW.posted_by_ngo_id);

    UPDATE public.incidents SET
        reporter_id = v_poster_id,
        category = NEW.category,
        name = NEW.name,
        age = NEW.age,
        location = NEW.location,
        latitude = NEW.latitude,
        longitude = NEW.longitude,
        description = NEW.description,
        photos = NEW.photos,
        status = NEW.status,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_animal
INSTEAD OF UPDATE ON compat.animals
FOR EACH ROW EXECUTE FUNCTION compat.update_animal();

CREATE OR REPLACE FUNCTION compat.delete_animal()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.incidents WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_animal
INSTEAD OF DELETE ON compat.animals
FOR EACH ROW EXECUTE FUNCTION compat.delete_animal();


-- 10. adoptions View
CREATE OR REPLACE VIEW compat.adoptions AS
SELECT 
    ir.incident_id AS id,
    ir.incident_id AS animal_id,
    ir.adopter_id,
    ir.nearby_center_id AS ngo_id,
    i.status,
    i.created_at,
    ir.adopted_at
FROM public.incident_resolutions ir
JOIN public.incidents i ON ir.incident_id = i.id
WHERE i.incident_type = 'ADOPTION';

CREATE OR REPLACE FUNCTION compat.insert_adoption()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.incident_resolutions (incident_id, nearby_center_id, adopter_id, adopted_at)
    VALUES (NEW.animal_id, NEW.ngo_id, NEW.adopter_id, COALESCE(NEW.adopted_at, NOW()))
    ON CONFLICT (incident_id) DO UPDATE SET
        nearby_center_id = EXCLUDED.nearby_center_id,
        adopter_id = EXCLUDED.adopter_id,
        adopted_at = EXCLUDED.adopted_at;

    UPDATE public.incidents
    SET status = 'ADOPTED'
    WHERE id = NEW.animal_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_adoption
INSTEAD OF INSERT ON compat.adoptions
FOR EACH ROW EXECUTE FUNCTION compat.insert_adoption();

CREATE OR REPLACE FUNCTION compat.update_adoption()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.incident_resolutions SET
        nearby_center_id = NEW.ngo_id,
        adopter_id = NEW.adopter_id,
        adopted_at = NEW.adopted_at
    WHERE incident_id = OLD.animal_id;

    UPDATE public.incidents SET
        status = NEW.status,
        created_at = NEW.created_at
    WHERE id = OLD.animal_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_adoption
INSTEAD OF UPDATE ON compat.adoptions
FOR EACH ROW EXECUTE FUNCTION compat.update_adoption();

CREATE OR REPLACE FUNCTION compat.delete_adoption()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.incident_resolutions SET
        adopter_id = NULL,
        adopted_at = NULL
    WHERE incident_id = OLD.animal_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_adoption
INSTEAD OF DELETE ON compat.adoptions
FOR EACH ROW EXECUTE FUNCTION compat.delete_adoption();


-- 11. ngo_posts View
CREATE OR REPLACE VIEW compat.ngo_posts AS
SELECT 
    id,
    sender_id AS ngo_id,
    post_type,
    title,
    message AS description,
    location,
    created_at
FROM public.platform_communications
WHERE comm_type = 'POST';

CREATE OR REPLACE FUNCTION compat.insert_ngo_post()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.platform_communications (id, comm_type, sender_id, title, message, location, post_type, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'POST', NEW.ngo_id, NEW.title, NEW.description, NEW.location, NEW.post_type, COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_ngo_post
INSTEAD OF INSERT ON compat.ngo_posts
FOR EACH ROW EXECUTE FUNCTION compat.insert_ngo_post();

CREATE OR REPLACE FUNCTION compat.update_ngo_post()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.platform_communications SET
        sender_id = NEW.ngo_id,
        title = NEW.title,
        message = NEW.description,
        location = NEW.location,
        post_type = NEW.post_type,
        created_at = NEW.created_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ngo_post
INSTEAD OF UPDATE ON compat.ngo_posts
FOR EACH ROW EXECUTE FUNCTION compat.update_ngo_post();

CREATE OR REPLACE FUNCTION compat.delete_ngo_post()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.platform_communications WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_ngo_post
INSTEAD OF DELETE ON compat.ngo_posts
FOR EACH ROW EXECUTE FUNCTION compat.delete_ngo_post();


-- 12. ngo_reviews View
CREATE OR REPLACE VIEW compat.ngo_reviews AS
SELECT 
    id,
    target_account_id AS ngo_id,
    user_id,
    content,
    rating,
    created_at
FROM public.user_feedbacks
WHERE feedback_type = 'REVIEW';

CREATE OR REPLACE FUNCTION compat.insert_ngo_review()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_feedbacks (id, feedback_type, user_id, target_account_id, content, rating, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'REVIEW', NEW.user_id, NEW.ngo_id, NEW.content, NEW.rating, COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_ngo_review
INSTEAD OF INSERT ON compat.ngo_reviews
FOR EACH ROW EXECUTE FUNCTION compat.insert_ngo_review();

CREATE OR REPLACE FUNCTION compat.update_ngo_review()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_feedbacks SET
        target_account_id = NEW.ngo_id,
        user_id = NEW.user_id,
        content = NEW.content,
        rating = NEW.rating,
        created_at = NEW.created_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ngo_review
INSTEAD OF UPDATE ON compat.ngo_reviews
FOR EACH ROW EXECUTE FUNCTION compat.update_ngo_review();

CREATE OR REPLACE FUNCTION compat.delete_ngo_review()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_feedbacks WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_ngo_review
INSTEAD OF DELETE ON compat.ngo_reviews
FOR EACH ROW EXECUTE FUNCTION compat.delete_ngo_review();


-- 13. testimonials View
CREATE OR REPLACE VIEW compat.testimonials AS
SELECT 
    id,
    user_id,
    content,
    rating,
    created_at
FROM public.user_feedbacks
WHERE feedback_type = 'TESTIMONIAL';

CREATE OR REPLACE FUNCTION compat.insert_testimonial()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_feedbacks (id, feedback_type, user_id, content, rating, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'TESTIMONIAL', NEW.user_id, NEW.content, NEW.rating, COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_testimonial
INSTEAD OF INSERT ON compat.testimonials
FOR EACH ROW EXECUTE FUNCTION compat.insert_testimonial();

CREATE OR REPLACE FUNCTION compat.update_testimonial()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_feedbacks SET
        user_id = NEW.user_id,
        content = NEW.content,
        rating = NEW.rating,
        created_at = NEW.created_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_testimonial
INSTEAD OF UPDATE ON compat.testimonials
FOR EACH ROW EXECUTE FUNCTION compat.update_testimonial();

CREATE OR REPLACE FUNCTION compat.delete_testimonial()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_feedbacks WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_testimonial
INSTEAD OF DELETE ON compat.testimonials
FOR EACH ROW EXECUTE FUNCTION compat.delete_testimonial();


-- 14. newsletters View
CREATE OR REPLACE VIEW compat.newsletters AS
SELECT 
    pc.id,
    pc.email,
    CASE WHEN a.role = 'USER' THEN pc.sender_id ELSE NULL END AS user_id,
    CASE WHEN a.role = 'NGO' THEN pc.sender_id ELSE NULL END AS ngo_id,
    pc.created_at AS subscribed_at
FROM public.platform_communications pc
LEFT JOIN public.accounts a ON pc.sender_id = a.id
WHERE pc.comm_type = 'NEWSLETTER';

CREATE OR REPLACE FUNCTION compat.insert_newsletter()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_id UUID;
BEGIN
    v_sender_id := COALESCE(NEW.user_id, NEW.ngo_id);

    INSERT INTO public.platform_communications (id, comm_type, email, sender_id, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'NEWSLETTER', NEW.email, v_sender_id, COALESCE(NEW.subscribed_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_newsletter
INSTEAD OF INSERT ON compat.newsletters
FOR EACH ROW EXECUTE FUNCTION compat.insert_newsletter();

CREATE OR REPLACE FUNCTION compat.update_newsletter()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_id UUID;
BEGIN
    v_sender_id := COALESCE(NEW.user_id, NEW.ngo_id);

    UPDATE public.platform_communications SET
        email = NEW.email,
        sender_id = v_sender_id,
        created_at = NEW.subscribed_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_newsletter
INSTEAD OF UPDATE ON compat.newsletters
FOR EACH ROW EXECUTE FUNCTION compat.update_newsletter();

CREATE OR REPLACE FUNCTION compat.delete_newsletter()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.platform_communications WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_newsletter
INSTEAD OF DELETE ON compat.newsletters
FOR EACH ROW EXECUTE FUNCTION compat.delete_newsletter();


-- 15. contact_messages View
CREATE OR REPLACE VIEW compat.contact_messages AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.message,
    CASE WHEN a.role = 'USER' THEN c.sender_id ELSE NULL END AS user_id,
    CASE WHEN a.role = 'NGO' THEN c.sender_id ELSE NULL END AS ngo_id,
    c.resolved_by_admin_id,
    c.status,
    c.created_at
FROM public.platform_communications c
LEFT JOIN public.accounts a ON c.sender_id = a.id
WHERE c.comm_type = 'CONTACT';

CREATE OR REPLACE FUNCTION compat.insert_contact_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_id UUID;
BEGIN
    v_sender_id := COALESCE(NEW.user_id, NEW.ngo_id);

    INSERT INTO public.platform_communications (id, comm_type, name, email, phone, message, sender_id, resolved_by_admin_id, status, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'CONTACT', NEW.name, NEW.email, NEW.phone, NEW.message, v_sender_id, NEW.resolved_by_admin_id, COALESCE(NEW.status, 'PENDING'), COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_contact_message
INSTEAD OF INSERT ON compat.contact_messages
FOR EACH ROW EXECUTE FUNCTION compat.insert_contact_message();

CREATE OR REPLACE FUNCTION compat.update_contact_message()
RETURNS TRIGGER AS $$
DECLARE
    v_sender_id UUID;
BEGIN
    v_sender_id := COALESCE(NEW.user_id, NEW.ngo_id);

    UPDATE public.platform_communications SET
        name = NEW.name,
        email = NEW.email,
        phone = NEW.phone,
        message = NEW.message,
        sender_id = v_sender_id,
        resolved_by_admin_id = NEW.resolved_by_admin_id,
        status = NEW.status,
        created_at = NEW.created_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_message
INSTEAD OF UPDATE ON compat.contact_messages
FOR EACH ROW EXECUTE FUNCTION compat.update_contact_message();

CREATE OR REPLACE FUNCTION compat.delete_contact_message()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.platform_communications WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_contact_message
INSTEAD OF DELETE ON compat.contact_messages
FOR EACH ROW EXECUTE FUNCTION compat.delete_contact_message();


-- 16. locations View
CREATE OR REPLACE VIEW compat.locations AS
SELECT 
    id,
    key_name AS name,
    address,
    latitude,
    longitude,
    group_category AS type,
    updated_by_admin_id AS created_by_admin_id,
    associated_account_id AS ngo_id
FROM public.system_registry
WHERE registry_type = 'LOCATION';

CREATE OR REPLACE FUNCTION compat.insert_location()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_registry (id, registry_type, group_category, key_name, address, latitude, longitude, updated_by_admin_id, associated_account_id, updated_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'LOCATION', COALESCE(NEW.type, 'GENERAL'), NEW.name, NEW.address, NEW.latitude, NEW.longitude, NEW.created_by_admin_id, NEW.ngo_id, CURRENT_TIMESTAMP)
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_location
INSTEAD OF INSERT ON compat.locations
FOR EACH ROW EXECUTE FUNCTION compat.insert_location();

CREATE OR REPLACE FUNCTION compat.update_location()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.system_registry SET
        group_category = NEW.type,
        key_name = NEW.name,
        address = NEW.address,
        latitude = NEW.latitude,
        longitude = NEW.longitude,
        updated_by_admin_id = NEW.created_by_admin_id,
        associated_account_id = NEW.ngo_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_location
INSTEAD OF UPDATE ON compat.locations
FOR EACH ROW EXECUTE FUNCTION compat.update_location();

CREATE OR REPLACE FUNCTION compat.delete_location()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.system_registry WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_location
INSTEAD OF DELETE ON compat.locations
FOR EACH ROW EXECUTE FUNCTION compat.delete_location();


-- 17. system_settings View
CREATE OR REPLACE VIEW compat.system_settings AS
SELECT 
    key_name AS key,
    text_value AS value,
    updated_by_admin_id,
    updated_at
FROM public.system_registry
WHERE registry_type = 'SETTING';

CREATE OR REPLACE FUNCTION compat.insert_system_setting()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_registry (registry_type, key_name, text_value, updated_by_admin_id, updated_at)
    VALUES ('SETTING', NEW.key, NEW.value, NEW.updated_by_admin_id, COALESCE(NEW.updated_at, CURRENT_TIMESTAMP))
    ON CONFLICT (key_name) WHERE registry_type = 'SETTING' DO UPDATE SET
        text_value = EXCLUDED.text_value,
        updated_by_admin_id = EXCLUDED.updated_by_admin_id,
        updated_at = EXCLUDED.updated_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_system_setting
INSTEAD OF INSERT ON compat.system_settings
FOR EACH ROW EXECUTE FUNCTION compat.insert_system_setting();

CREATE OR REPLACE FUNCTION compat.update_system_setting()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.system_registry SET
        text_value = NEW.value,
        updated_by_admin_id = NEW.updated_by_admin_id,
        updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
    WHERE registry_type = 'SETTING' AND key_name = OLD.key;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_setting
INSTEAD OF UPDATE ON compat.system_settings
FOR EACH ROW EXECUTE FUNCTION compat.update_system_setting();

CREATE OR REPLACE FUNCTION compat.delete_system_setting()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.system_registry WHERE registry_type = 'SETTING' AND key_name = OLD.key;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_system_setting
INSTEAD OF DELETE ON compat.system_settings
FOR EACH ROW EXECUTE FUNCTION compat.delete_system_setting();


-- 18. complaints View
CREATE OR REPLACE VIEW compat.complaints AS
SELECT 
    id,
    user_id AS reporter_id,
    title,
    content AS description,
    target_type,
    target_id,
    status,
    created_at
FROM public.user_feedbacks
WHERE feedback_type = 'COMPLAINT';

CREATE OR REPLACE FUNCTION compat.insert_complaint()
RETURNS TRIGGER AS $$
DECLARE
    v_target_account_id UUID := NULL;
    v_target_incident_id UUID := NULL;
BEGIN
    IF NEW.target_type = 'NGO' OR NEW.target_type = 'USER' OR NEW.target_type = 'ACCOUNT' THEN
        v_target_account_id := NEW.target_id;
    ELSIF NEW.target_type = 'INCIDENT' OR NEW.target_type = 'RESCUE' OR NEW.target_type = 'ADOPTION' THEN
        v_target_incident_id := NEW.target_id;
    END IF;

    INSERT INTO public.user_feedbacks (id, feedback_type, user_id, target_account_id, target_incident_id, title, content, status, target_type, target_id, created_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'COMPLAINT', NEW.reporter_id, v_target_account_id, v_target_incident_id, NEW.title, NEW.description, COALESCE(NEW.status, 'PENDING'), NEW.target_type, NEW.target_id, COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_complaint
INSTEAD OF INSERT ON compat.complaints
FOR EACH ROW EXECUTE FUNCTION compat.insert_complaint();

CREATE OR REPLACE FUNCTION compat.update_complaint()
RETURNS TRIGGER AS $$
DECLARE
    v_target_account_id UUID := NULL;
    v_target_incident_id UUID := NULL;
BEGIN
    IF NEW.target_type = 'NGO' OR NEW.target_type = 'USER' OR NEW.target_type = 'ACCOUNT' THEN
        v_target_account_id := NEW.target_id;
    ELSIF NEW.target_type = 'INCIDENT' OR NEW.target_type = 'RESCUE' OR NEW.target_type = 'ADOPTION' THEN
        v_target_incident_id := NEW.target_id;
    END IF;

    UPDATE public.user_feedbacks SET
        user_id = NEW.reporter_id,
        target_account_id = v_target_account_id,
        target_incident_id = v_target_incident_id,
        title = NEW.title,
        content = NEW.description,
        status = NEW.status,
        target_type = NEW.target_type,
        target_id = NEW.target_id,
        created_at = NEW.created_at
    WHERE id = OLD.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_complaint
INSTEAD OF UPDATE ON compat.complaints
FOR EACH ROW EXECUTE FUNCTION compat.update_complaint();

CREATE OR REPLACE FUNCTION compat.delete_complaint()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.user_feedbacks WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_complaint
INSTEAD OF DELETE ON compat.complaints
FOR EACH ROW EXECUTE FUNCTION compat.delete_complaint();


-- 19. faqs View
CREATE OR REPLACE VIEW compat.faqs AS
SELECT 
    id,
    key_name AS question,
    text_value AS answer,
    group_category AS category,
    updated_by_admin_id AS created_by_admin_id,
    updated_at AS created_at
FROM public.system_registry
WHERE registry_type = 'FAQ';

CREATE OR REPLACE FUNCTION compat.insert_faq()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.system_registry (id, registry_type, group_category, key_name, text_value, updated_by_admin_id, updated_at)
    VALUES (COALESCE(NEW.id, uuid_generate_v4()), 'FAQ', NEW.category, NEW.question, NEW.answer, NEW.created_by_admin_id, COALESCE(NEW.created_at, CURRENT_TIMESTAMP))
    RETURNING id INTO NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_insert_faq
INSTEAD OF INSERT ON compat.faqs
FOR EACH ROW EXECUTE FUNCTION compat.insert_faq();

CREATE OR REPLACE FUNCTION compat.update_faq()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.system_registry SET
        group_category = NEW.category,
        key_name = NEW.question,
        text_value = NEW.answer,
        updated_by_admin_id = NEW.created_by_admin_id,
        updated_at = NEW.created_at
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_faq
INSTEAD OF UPDATE ON compat.faqs
FOR EACH ROW EXECUTE FUNCTION compat.update_faq();

CREATE OR REPLACE FUNCTION compat.delete_faq()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.system_registry WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_faq
INSTEAD OF DELETE ON compat.faqs
FOR EACH ROW EXECUTE FUNCTION compat.delete_faq();
