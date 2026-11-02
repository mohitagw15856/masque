export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Mask {
  id: string;
  name: string;
  emoji: string;
  /** Target language, as a plain name the model understands. */
  language: string;
  /** BCP-47 tag for speech synthesis. */
  langCode: string;
  level: Level;
  /** One-line hook shown on the card. */
  tagline: string;
  /** Who the mask is: voice, setting, quirks. Written in the second person. */
  persona: string;
  /** How they teach: corrections, pacing, what they drill. */
  method: string;
  /** Opening line the mask sends when a chat starts. */
  greeting: string;
  /** Accent colour. */
  color: string;
  builtin?: boolean;
}
