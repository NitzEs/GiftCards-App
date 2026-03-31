export interface Invitation {
  id: string;
  inviterUid: string;
  inviterEmail: string;
  inviteeEmail: string;
  cardId: string; // specific cardId or "all"
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  expiresAt: Date;
}
