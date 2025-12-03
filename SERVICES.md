# Services Documentation

## RabbitMQ

### Publish
```typescript
constructor(private readonly rabbitmq: RabbitMQService) {}

await this.rabbitmq.publish('routing.key', { data: 'value' });
```

### Subscribe
```typescript
await this.rabbitmq.subscribe('queue_name', 'routing.key', (data: any) => {
  console.log(data);
});
```

---

## Redis

```typescript
constructor(private readonly redis: RedisService) {}

await this.redis.set('key', 'value', 3600); // TTL in seconds (optional)
const value = await this.redis.get('key');
```

> **See more:** Read source for all available methods

---

## Settings

### Get
```typescript
constructor(private readonly settings: SettingService) {}

// Get setting (returns null if not exists)
const value = await this.settings.get<string>('setting_key');

// Get with type
const config = await this.settings.get<{ host: string; port: number }>('email_config');
```

### Update or Create
```typescript
// Create/update simple value
await this.settings.updateOrCreate('max_upload', '10485760');

// Partial merge object (isPartial = true, default)
await this.settings.updateOrCreate('email_config', { host: 'smtp.gmail.com' }, true);
// Existing: { host: 'old', port: 587 }
// Result: { host: 'smtp.gmail.com', port: 587 }

// Replace entire object (isPartial = false)
await this.settings.updateOrCreate('email_config', { host: 'smtp.gmail.com' }, false);
// Result: { host: 'smtp.gmail.com' }
```

