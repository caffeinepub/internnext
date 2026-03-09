import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Challenge,
  LeaderboardEntry,
  ResumeSession,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor)
        return {
          xp: 0n,
          level: "Intern Rookie",
          badges: [],
          streak: 0n,
          lastLoginDay: "",
          completedChallenges: [],
        } as UserProfile;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useResumeSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<ResumeSession[]>({
    queryKey: ["resumeSessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResumeSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useChallenges() {
  const { actor, isFetching } = useActor();
  return useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChallenges();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTailorResume() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      originalResume,
      jobDescription,
    }: { originalResume: string; jobDescription: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.tailorResume(originalResume, jobDescription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumeSessions"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useCompleteChallenge() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.completeChallenge(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

export function useRecordLogin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      return actor.recordLogin();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
