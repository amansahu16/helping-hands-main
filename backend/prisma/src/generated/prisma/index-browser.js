
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AnimalScalarFieldEnum = {
  id: 'id',
  postedByUserId: 'postedByUserId',
  postedByNgoId: 'postedByNgoId',
  category: 'category',
  location: 'location',
  description: 'description',
  photos: 'photos',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.RescueRequestScalarFieldEnum = {
  id: 'id',
  reporterId: 'reporterId',
  nearbyCenterId: 'nearbyCenterId',
  location: 'location',
  description: 'description',
  condition: 'condition',
  photos: 'photos',
  nearbyHospital: 'nearbyHospital',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.AdoptionScalarFieldEnum = {
  id: 'id',
  animalId: 'animalId',
  adopterId: 'adopterId',
  ngoId: 'ngoId',
  status: 'status',
  adoptedAt: 'adoptedAt'
};

exports.Prisma.CampaignScalarFieldEnum = {
  id: 'id',
  organizerUserId: 'organizerUserId',
  organizerNgoId: 'organizerNgoId',
  name: 'name',
  description: 'description',
  location: 'location',
  timeFrom: 'timeFrom',
  timeTo: 'timeTo',
  maxParticipants: 'maxParticipants',
  currentParticipants: 'currentParticipants',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.CampaignParticipantScalarFieldEnum = {
  id: 'id',
  campaignId: 'campaignId',
  userId: 'userId',
  identityNumber: 'identityNumber',
  status: 'status',
  joinedAt: 'joinedAt'
};

exports.Prisma.DonationScalarFieldEnum = {
  id: 'id',
  donorId: 'donorId',
  recipientNgoId: 'recipientNgoId',
  category: 'category',
  quantity: 'quantity',
  personsServed: 'personsServed',
  location: 'location',
  pickupAddress: 'pickupAddress',
  timeFrom: 'timeFrom',
  timeTo: 'timeTo',
  photos: 'photos',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.DonationItemScalarFieldEnum = {
  id: 'id',
  donationId: 'donationId',
  itemType: 'itemType',
  description: 'description',
  quantity: 'quantity'
};

exports.Prisma.NgoPostScalarFieldEnum = {
  id: 'id',
  ngoId: 'ngoId',
  postType: 'postType',
  title: 'title',
  description: 'description',
  location: 'location',
  createdAt: 'createdAt'
};

exports.Prisma.ContributorScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  ngoId: 'ngoId',
  contributionType: 'contributionType',
  location: 'location',
  createdAt: 'createdAt'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  latitude: 'latitude',
  longitude: 'longitude',
  type: 'type'
};

exports.Prisma.FaqScalarFieldEnum = {
  id: 'id',
  category: 'category',
  question: 'question',
  answer: 'answer'
};

exports.Prisma.TestimonialScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  content: 'content',
  rating: 'rating',
  createdAt: 'createdAt'
};

exports.Prisma.NewsletterScalarFieldEnum = {
  id: 'id',
  email: 'email',
  subscribedAt: 'subscribedAt'
};

exports.Prisma.ContactMessageScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phone: 'phone',
  message: 'message',
  createdAt: 'createdAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phoneNumber: 'phoneNumber',
  dateOfBirth: 'dateOfBirth',
  location: 'location',
  occupation: 'occupation',
  photoUrl: 'photoUrl',
  passwordHash: 'passwordHash',
  otpVerified: 'otpVerified',
  createdAt: 'createdAt'
};

exports.Prisma.NgoScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  phoneNumber: 'phoneNumber',
  registrationNumber: 'registrationNumber',
  location: 'location',
  photoUrl: 'photoUrl',
  passwordHash: 'passwordHash',
  otpVerified: 'otpVerified',
  verified: 'verified',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  Animal: 'Animal',
  RescueRequest: 'RescueRequest',
  Adoption: 'Adoption',
  Campaign: 'Campaign',
  CampaignParticipant: 'CampaignParticipant',
  Donation: 'Donation',
  DonationItem: 'DonationItem',
  NgoPost: 'NgoPost',
  Contributor: 'Contributor',
  Location: 'Location',
  Faq: 'Faq',
  Testimonial: 'Testimonial',
  Newsletter: 'Newsletter',
  ContactMessage: 'ContactMessage',
  User: 'User',
  Ngo: 'Ngo'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
