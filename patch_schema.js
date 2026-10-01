const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Trading
const tradeModels = `
model Trade {
  id              String         @id @default(uuid())
  senderId        String
  receiverId      String
  status          TradeStatus    @default(PENDING)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  Sender          User           @relation("SentTrades", fields: [senderId], references: [id])
  Receiver        User           @relation("ReceivedTrades", fields: [receiverId], references: [id])
  OfferedItems    TradeItem[]    @relation("OfferedItems")
  RequestedItems  TradeItem[]    @relation("RequestedItems")
}

model TradeItem {
  id              String         @id @default(uuid())
  tradeId         String
  cardInstanceId  String
  isOffered       Boolean        // true if offered by sender, false if requested from receiver

  Trade           Trade          @relation("OfferedItems", fields: [tradeId], references: [id], map: "TradeItem_offered_fkey")
  RequestedTrade  Trade?         @relation("RequestedItems", fields: [tradeId], references: [id], map: "TradeItem_requested_fkey")
  Instance        CardInstance   @relation(fields: [cardInstanceId], references: [id])
}

enum TradeStatus {
  PENDING
  ACCEPTED
  DECLINED
  CANCELLED
}

model Wishlist {
  id              String         @id @default(uuid())
  userId          String
  cardId          String
  createdAt       DateTime       @default(now())

  User            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  Card            CardReference  @relation(fields: [cardId], references: [id], onDelete: Cascade)

  @@unique([userId, cardId])
}
`;

// 2. Analytics (Portfolio Snapshot)
const analyticsModels = `
model PortfolioSnapshot {
  id              String         @id @default(uuid())
  userId          String
  totalValue      Float
  cardCount       Int
  createdAt       DateTime       @default(now())

  User            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;

// 3. Social Connectivity (Groups)
const groupModels = `
model CommunityGroup {
  id              String         @id @default(uuid())
  name            String         @unique
  description     String?
  creatorId       String
  createdAt       DateTime       @default(now())

  Creator         User           @relation("GroupCreator", fields: [creatorId], references: [id])
  Members         GroupMember[]
}

model GroupMember {
  id              String         @id @default(uuid())
  groupId         String
  userId          String
  role            GroupRole      @default(MEMBER)
  joinedAt        DateTime       @default(now())

  Group           CommunityGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  User            User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

enum GroupRole {
  MEMBER
  ADMIN
}
`;

// 6. Gamification
const gamificationModels = `
model Badge {
  id              String         @id @default(uuid())
  name            String         @unique
  description     String
  icon            String?
  createdAt       DateTime       @default(now())

  UserBadges      UserBadge[]
}

model UserBadge {
  id              String         @id @default(uuid())
  userId          String
  badgeId         String
  awardedAt       DateTime       @default(now())

  User            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  Badge           Badge          @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
}
`;

schema = schema + '\n' + tradeModels + '\n' + analyticsModels + '\n' + groupModels + '\n' + gamificationModels;

// Also add new relations to User
const userRelations = `
  SentTrades        Trade[]             @relation("SentTrades")
  ReceivedTrades    Trade[]             @relation("ReceivedTrades")
  WishlistItems     Wishlist[]
  PortfolioHistory  PortfolioSnapshot[]
  CreatedGroups     CommunityGroup[]    @relation("GroupCreator")
  GroupMemberships  GroupMember[]
  Badges            UserBadge[]
`;

schema = schema.replace(/Notifications     Notification\[\]\n\}/, `Notifications     Notification[]\n${userRelations}\}`);

// Also TradeItem needs relation in CardInstance
schema = schema.replace(/Listings     MarketListing\[\]\n\n  @@index\(\[ownerId\]\)/, `Listings     MarketListing[]\n  TradeItems   TradeItem[]\n\n  @@index([ownerId])`);


fs.writeFileSync('prisma/schema.prisma', schema);
