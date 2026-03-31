export interface GiftCard {
  id: string;
  ownerId: string;
  name: string;
  number: string; // encrypted in Firestore
  numberLast4: string;
  expiry: string; // MM/YY
  amount: number;
  originalAmount: number;
  sharedWith: string[]; // UIDs
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCardInput {
  name: string;
  number: string; // raw, sent to server
  expiry: string;
  amount: number;
}
