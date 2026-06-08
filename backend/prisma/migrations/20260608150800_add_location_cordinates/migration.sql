/*
  Warnings:

  - You are about to drop the `adoptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `animals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `campaign_participants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contact_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `contributors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `donation_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `donations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `faqs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `newsletters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ngo_posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ngos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rescue_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `testimonials` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "adoptions" DROP CONSTRAINT "adoptions_adopter_id_fkey";

-- DropForeignKey
ALTER TABLE "adoptions" DROP CONSTRAINT "adoptions_animal_id_fkey";

-- DropForeignKey
ALTER TABLE "adoptions" DROP CONSTRAINT "adoptions_ngo_id_fkey";

-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_posted_by_ngo_id_fkey";

-- DropForeignKey
ALTER TABLE "animals" DROP CONSTRAINT "animals_posted_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "campaign_participants" DROP CONSTRAINT "campaign_participants_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "campaign_participants" DROP CONSTRAINT "campaign_participants_user_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_organizer_ngo_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_organizer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_ngo_id_fkey";

-- DropForeignKey
ALTER TABLE "contributors" DROP CONSTRAINT "contributors_user_id_fkey";

-- DropForeignKey
ALTER TABLE "donation_items" DROP CONSTRAINT "donation_items_donation_id_fkey";

-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_donor_id_fkey";

-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_recipient_ngo_id_fkey";

-- DropForeignKey
ALTER TABLE "ngo_posts" DROP CONSTRAINT "ngo_posts_ngo_id_fkey";

-- DropForeignKey
ALTER TABLE "rescue_requests" DROP CONSTRAINT "rescue_requests_nearby_center_id_fkey";

-- DropForeignKey
ALTER TABLE "rescue_requests" DROP CONSTRAINT "rescue_requests_reporter_id_fkey";

-- DropForeignKey
ALTER TABLE "testimonials" DROP CONSTRAINT "testimonials_user_id_fkey";

-- DropTable
DROP TABLE "adoptions";

-- DropTable
DROP TABLE "animals";

-- DropTable
DROP TABLE "campaign_participants";

-- DropTable
DROP TABLE "campaigns";

-- DropTable
DROP TABLE "contact_messages";

-- DropTable
DROP TABLE "contributors";

-- DropTable
DROP TABLE "donation_items";

-- DropTable
DROP TABLE "donations";

-- DropTable
DROP TABLE "faqs";

-- DropTable
DROP TABLE "locations";

-- DropTable
DROP TABLE "newsletters";

-- DropTable
DROP TABLE "ngo_posts";

-- DropTable
DROP TABLE "ngos";

-- DropTable
DROP TABLE "rescue_requests";

-- DropTable
DROP TABLE "testimonials";

-- DropTable
DROP TABLE "users";
