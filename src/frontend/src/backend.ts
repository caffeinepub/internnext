import { Actor, type ActorConfig, type ActorSubclass, type HttpAgentOptions } from "@icp-sdk/core/agent";
import { type HttpAgent } from "@icp-sdk/core/agent";
import { idlFactory } from "./backend.idl";

export interface Badge {
  id: string;
  name: string;
  description: string;
}

export interface ResumeSession {
  sessionId: string;
  originalResume: string;
  jobDescription: string;
  tailoredResume: string;
  skillGaps: string[];
  timestamp: bigint;
}

export interface UserProfile {
  xp: bigint;
  level: string;
  badges: Badge[];
  streak: bigint;
  lastLoginDay: string;
  completedChallenges: string[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: bigint;
}

export interface LeaderboardEntry {
  principal: string;
  xp: bigint;
  level: string;
}

export type UserRole = { admin: null } | { user: null } | { guest: null };

export interface backendInterface {
  _initializeAccessControlWithSecret(userSecret: string): Promise<void>;
  assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
  getCallerUserRole(): Promise<UserRole>;
  isCallerAdmin(): Promise<boolean>;
  getProfile(): Promise<UserProfile>;
  recordLogin(): Promise<void>;
  getResumeSessions(): Promise<ResumeSession[]>;
  tailorResume(originalResume: string, jobDescription: string): Promise<ResumeSession>;
  getChallenges(): Promise<Challenge[]>;
  completeChallenge(challengeId: string): Promise<boolean>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

export type Principal = import("@dfinity/principal").Principal;

export class ExternalBlob {
  private _bytes: Uint8Array | null = null;
  private _url: string | null = null;
  onProgress?: (progress: number) => void;

  static fromURL(url: string): ExternalBlob {
    const blob = new ExternalBlob();
    blob._url = url;
    return blob;
  }

  static fromBytes(bytes: Uint8Array): ExternalBlob {
    const blob = new ExternalBlob();
    blob._bytes = bytes;
    return blob;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const res = await fetch(this._url);
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    }
    return new Uint8Array();
  }

  getURL(): string | null {
    return this._url;
  }
}

export interface CreateActorOptions {
  agentOptions?: HttpAgentOptions;
  actorOptions?: Partial<ActorConfig>;
  agent?: HttpAgent;
  processError?: (e: unknown) => never;
}

export function createActor(
  canisterId: string,
  _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
  _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
  options?: CreateActorOptions,
): backendInterface {
  const actor = Actor.createActor<backendInterface>(idlFactory, {
    agent: options?.agent,
    canisterId,
    ...options?.actorOptions,
  });
  return actor as ActorSubclass<backendInterface>;
}
