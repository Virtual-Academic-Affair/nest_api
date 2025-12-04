import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => {
  return {
    url: process.env.RABBITMQ_URL,
  };
});
