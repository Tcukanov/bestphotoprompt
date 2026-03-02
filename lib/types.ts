import { PromptPost, Vote, User, AIModel, PromptStatus } from '@prisma/client';

export type PromptPostWithVotes = PromptPost & {
  votes: Vote[];
  _count?: {
    votes: number;
  };
  userVote?: Vote | null;
  siteScore?: number;
};

export interface PromptListParams {
  page?: number;
  limit?: number;
  sort?: 'trending' | 'new' | 'top-week' | 'top-all';
  model?: AIModel;
  tag?: string;
  search?: string;
}

export interface PromptListResponse {
  prompts: PromptPostWithVotes[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VoteRequest {
  promptPostId: string;
  value: 1 | -1;
}

export interface VoteResponse {
  success: boolean;
  siteScore: number;
  userVote: number;
}

export interface ApiError {
  error: string;
  details?: string;
}
