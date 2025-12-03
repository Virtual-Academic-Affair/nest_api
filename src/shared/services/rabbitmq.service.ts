import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as amqpManager from 'amqp-connection-manager';

const EXCHANGE = 'app_exchange';
const EXCHANGE_TYPE = 'direct';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqpManager.AmqpConnectionManager;
  private channel: amqpManager.ChannelWrapper;

  private subscribers = new Map<string, boolean>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('rabbitmq.url');

    this.connection = amqpManager.connect([url], {
      reconnectTimeInSeconds: 5,
    });

    this.channel = this.connection.createChannel({
      setup: async (ch: amqp.Channel) => {
        await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
        await ch.prefetch(50);

        for (const [, fn] of this.subscriberSetup.entries()) {
          await fn(ch);
        }
      },
    });

    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', (e: Error) =>
      this.logger.warn(`RabbitMQ disconnected: ${e?.message}`),
    );
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(routingKey: string, message: unknown) {
    await this.channel.waitForConnect();

    const buffer = Buffer.from(JSON.stringify(message));

    return this.channel.publish(EXCHANGE, routingKey, buffer, {
      persistent: true,
      contentType: 'application/json',
    });
  }

  private subscriberSetup = new Map<
    string,
    (ch: amqp.Channel) => Promise<void>
  >();

  async subscribe<T>(
    queue: string,
    routingKey: string,
    handler: (data: T) => Promise<void> | void,
  ) {
    const key = `${queue}|${routingKey}`;

    if (this.subscribers.has(key)) {
      return;
    }

    this.subscribers.set(key, true);

    this.subscriberSetup.set(key, async (ch: amqp.Channel) => {
      await ch.assertQueue(queue, { durable: true });
      await ch.bindQueue(queue, EXCHANGE, routingKey);

      await ch.consume(
        queue,
        async (msg) => {
          if (!msg) {
            return;
          }

          try {
            const data = JSON.parse(msg.content.toString());
            await handler(data);
            ch.ack(msg);
          } catch (err: any) {
            this.logger.error(err.message);
            ch.nack(msg, false, false);
          }
        },
        { noAck: false },
      );
    });

    await this.channel.addSetup((ch: amqp.Channel) =>
      this.subscriberSetup.get(key)?.(ch),
    );
  }
}
