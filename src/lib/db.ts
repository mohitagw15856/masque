import Dexie, { type EntityTable } from 'dexie';
import type { Grade, SrsState } from './srs';

export interface Card extends SrsState {
  id?: number;
  /** Dedupe key: language::front (lowercased). */
  key: string;
  language: string;
  front: string;
  back: string;
  hint?: string;
  example?: string;
  tags: string[];
  maskId: string;
  createdAt: number;
}

export interface ReviewLog {
  id?: number;
  cardId: number;
  date: number;
  grade: Grade;
  stateBefore: SrsState['state'];
  intervalAfter: number;
}

export interface Conversation {
  id?: number;
  maskId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id?: number;
  conversationId: number;
  role: 'user' | 'assistant';
  /** Raw text as the model produced it, cards block included. */
  content: string;
  /** Number of cards saved from this message. */
  cardsAdded?: number;
  createdAt: number;
}

export class MasqueDB extends Dexie {
  cards!: EntityTable<Card, 'id'>;
  reviewLogs!: EntityTable<ReviewLog, 'id'>;
  conversations!: EntityTable<Conversation, 'id'>;
  messages!: EntityTable<Message, 'id'>;

  constructor() {
    super('masque');
    this.version(1).stores({
      cards: '++id, &key, language, state, due, maskId, createdAt',
      reviewLogs: '++id, cardId, date',
      conversations: '++id, maskId, updatedAt',
      messages: '++id, conversationId, createdAt',
    });
  }
}

export const db = new MasqueDB();
