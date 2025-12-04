import { User } from '@authentication/entities/user.entity';

// Represents the single Gmail account configured via settings
export interface EmailAccountContext {
  id: string; // stable identifier for the configured account
  email: string;
  refreshToken: string;
  displayName?: string;
  userId?: number;
  user?: User;
  lastPulledAt?: Date;
}
