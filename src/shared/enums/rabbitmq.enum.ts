export enum EmailRoutingKey {
  Ingested = 'email.ingested',
  NlpLabeled = 'email.nlp.labeled',
  NlpProcessed = 'email.nlp.processed',
}

export const QUEUE_PREFIX = 'queue.email.';
