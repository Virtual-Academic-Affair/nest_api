import { registerAs } from '@nestjs/config';

export interface GoogleConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export default registerAs<GoogleConfiguration>('google', () => {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  };
});
