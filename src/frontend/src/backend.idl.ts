// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const idlFactory = ({ IDL }: { IDL: any }) => {
  const Badge = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    description: IDL.Text,
  });

  const ResumeSession = IDL.Record({
    sessionId: IDL.Text,
    originalResume: IDL.Text,
    jobDescription: IDL.Text,
    tailoredResume: IDL.Text,
    skillGaps: IDL.Vec(IDL.Text),
    timestamp: IDL.Int,
  });

  const UserProfile = IDL.Record({
    xp: IDL.Nat,
    level: IDL.Text,
    badges: IDL.Vec(Badge),
    streak: IDL.Nat,
    lastLoginDay: IDL.Text,
    completedChallenges: IDL.Vec(IDL.Text),
  });

  const Challenge = IDL.Record({
    id: IDL.Text,
    title: IDL.Text,
    description: IDL.Text,
    xpReward: IDL.Nat,
  });

  const LeaderboardEntry = IDL.Record({
    principal: IDL.Text,
    xp: IDL.Nat,
    level: IDL.Text,
  });

  const UserRole = IDL.Variant({
    admin: IDL.Null,
    user: IDL.Null,
    guest: IDL.Null,
  });

  const HttpHeader = IDL.Record({ name: IDL.Text, value: IDL.Text });
  const HttpRequestResult = IDL.Record({
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(HttpHeader),
    status: IDL.Nat,
  });
  const TransformationInput = IDL.Record({
    context: IDL.Vec(IDL.Nat8),
    response: HttpRequestResult,
  });
  const TransformationOutput = IDL.Record({
    body: IDL.Vec(IDL.Nat8),
    headers: IDL.Vec(HttpHeader),
    status: IDL.Nat,
  });

  return IDL.Service({
    _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
    assignCallerUserRole: IDL.Func([IDL.Principal, UserRole], [], []),
    getCallerUserRole: IDL.Func([], [UserRole], ["query"]),
    isCallerAdmin: IDL.Func([], [IDL.Bool], ["query"]),
    getProfile: IDL.Func([], [UserProfile], ["query"]),
    recordLogin: IDL.Func([], [], []),
    getResumeSessions: IDL.Func([], [IDL.Vec(ResumeSession)], ["query"]),
    tailorResume: IDL.Func([IDL.Text, IDL.Text], [ResumeSession], []),
    getChallenges: IDL.Func([], [IDL.Vec(Challenge)], ["query"]),
    completeChallenge: IDL.Func([IDL.Text], [IDL.Bool], []),
    getLeaderboard: IDL.Func([], [IDL.Vec(LeaderboardEntry)], ["query"]),
    transform: IDL.Func(
      [TransformationInput],
      [TransformationOutput],
      ["query"],
    ),
  });
};

export default idlFactory;
