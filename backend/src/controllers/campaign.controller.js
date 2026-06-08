//  CAMPAIGNS — controllers/campaign.controller.js
// ============================================================
import { prisma } from "../lib/prisma.js";
 
async function listCampaigns(req, res) {
  try {
    const { status, type, location, organizerUserId, organizerNgoId, page = 1, limit = 100 } = req.query;
    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(status   && { status }),
        ...(type     && { type }),
        ...(location && { location: { contains: location, mode: "insensitive" } }),
        ...(organizerUserId && { organizerUserId }),
        ...(organizerNgoId  && { organizerNgoId }),
      },
      include: {
        organizerUser: { select: { id: true, name: true, photoUrl: true } },
        organizerNgo:  { select: { id: true, name: true, photoUrl: true } },
        _count:        { select: { participants: true } },
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { timeFrom: "asc" },
    });
    return res.json(campaigns);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getCampaignById(req, res) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        organizerUser: { select: { id: true, name: true, photoUrl: true } },
        organizerNgo:  { select: { id: true, name: true, photoUrl: true } },
        _count:        { select: { participants: true } },
      },
    });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    return res.json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function getCampaignParticipants(req, res) {
  try {
    const participants = await prisma.campaignParticipant.findMany({
      where: { campaignId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            dateOfBirth: true,
            location: true,
            photoUrl: true,
            occupation: true
          }
        }
      },
    });
    return res.json(participants);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function createCampaign(req, res) {
  try {
    const { name, type, description, location, timeFrom, timeTo, maxParticipants, latitude, longitude } = req.body;
    const { id, role } = req.user;
 
    const campaign = await prisma.campaign.create({
      data: {
        name, type: type || 'OTHER', description, location,
        timeFrom: timeFrom ? new Date(timeFrom) : null,
        timeTo:   timeTo   ? new Date(timeTo)   : null,
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
        ...(role === "user" && { organizerUserId: id }),
        ...(role === "ngo"  && { organizerNgoId:  id }),
      },
    });
    return res.status(201).json(campaign);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateCampaign(req, res) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && campaign.organizerUserId === id) ||
      (role === "ngo"  && campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    const { name, description, location, timeFrom, timeTo, maxParticipants, latitude, longitude } = req.body;
    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: { 
        name, 
        description, 
        location, 
        timeFrom: timeFrom ? new Date(timeFrom) : undefined,
        timeTo:   timeTo   ? new Date(timeTo)   : undefined,
        maxParticipants: maxParticipants !== undefined ? Number(maxParticipants) : undefined,
        latitude: latitude !== undefined ? (latitude !== null ? parseFloat(latitude) : null) : undefined,
        longitude: longitude !== undefined ? (longitude !== null ? parseFloat(longitude) : null) : undefined
      },
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function deleteCampaign(req, res) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && campaign.organizerUserId === id) ||
      (role === "ngo"  && campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    await prisma.campaign.delete({ where: { id: req.params.id } });
    return res.json({ message: "Campaign deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateStatus(req, res) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && campaign.organizerUserId === id) ||
      (role === "ngo"  && campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    const { status } = req.body;
    const updated = await prisma.campaign.update({ where: { id: req.params.id }, data: { status } });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function joinCampaign(req, res) {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status !== "PLANNED" && campaign.status !== "ONGOING") {
      return res.status(409).json({ message: "Campaign is not open for registration" });
    }
    if (campaign.maxParticipants && campaign.currentParticipants >= campaign.maxParticipants) {
      return res.status(409).json({ message: "Campaign is full" });
    }
 
    const { identityNumber } = req.body || {};
 
    const participant = await prisma.campaignParticipant.create({
      data: { campaignId: campaign.id, userId: req.user.id, identityNumber, status: "PENDING" },
    });
    return res.status(201).json(participant);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ message: "Already registered" });
    return res.status(500).json({ message: err.message });
  }
}
 
async function leaveCampaign(req, res) {
  try {
    const participant = await prisma.campaignParticipant.findFirst({
      where: { campaignId: req.params.id, userId: req.user.id },
    });
    if (!participant) return res.status(404).json({ message: "You are not registered for this campaign" });
 
    await prisma.$transaction(async (tx) => {
      await tx.campaignParticipant.delete({ where: { id: participant.id } });
      if (participant.status === "APPROVED" || participant.status === "REGISTERED") {
        await tx.campaign.update({
          where: { id: req.params.id },
          data: { currentParticipants: { decrement: 1 } },
        });
      }
    });
    return res.json({ message: "Left campaign successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
async function updateParticipantStatus(req, res) {
  try {
    const { status, code } = req.body; // APPROVED | REJECTED | ATTENDED | CANCELLED
    const participant = await prisma.campaignParticipant.findUnique({
      where: { id: req.params.participantId },
      include: { campaign: true },
    });
    if (!participant) return res.status(404).json({ message: "Participant not found" });
 
    const { id, role } = req.user;
    const isOrganizer =
      (role === "user" && participant.campaign.organizerUserId === id) ||
      (role === "ngo"  && participant.campaign.organizerNgoId  === id);
    if (!isOrganizer) return res.status(403).json({ message: "Forbidden" });
 
    const updated = await prisma.$transaction(async (tx) => {
      // If moving from PENDING to APPROVED, increment campaign's currentParticipants
      if (participant.status === "PENDING" && status === "APPROVED") {
        await tx.campaign.update({
          where: { id: participant.campaignId },
          data: { currentParticipants: { increment: 1 } },
        });
      }
      // If moving from APPROVED to CANCELLED/REJECTED, decrement campaign's currentParticipants
      if ((participant.status === "APPROVED" || participant.status === "REGISTERED") && (status === "CANCELLED" || status === "REJECTED")) {
        await tx.campaign.update({
          where: { id: participant.campaignId },
          data: { currentParticipants: { decrement: 1 } },
        });
      }
      return await tx.campaignParticipant.update({
        where: { id: req.params.participantId },
        data: { status, ...(code !== undefined && { code }) },
      });
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
 
export const campaignController = {
  listCampaigns, getCampaignById, getCampaignParticipants,
  createCampaign, updateCampaign, deleteCampaign, updateStatus,
  joinCampaign, leaveCampaign, updateParticipantStatus,
};