import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Char "mo:core/Char";
import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import Outcall "./http-outcalls/outcall";

persistent actor {
  // ---------- Types ----------
  public type Badge = { id : Text; name : Text; description : Text };

  public type ResumeSession = {
    sessionId : Text;
    originalResume : Text;
    jobDescription : Text;
    tailoredResume : Text;
    skillGaps : [Text];
    timestamp : Int;
  };

  public type UserProfile = {
    xp : Nat;
    level : Text;
    badges : [Badge];
    streak : Nat;
    lastLoginDay : Text;
    completedChallenges : [Text];
  };

  public type Challenge = {
    id : Text;
    title : Text;
    description : Text;
    xpReward : Nat;
  };

  public type LeaderboardEntry = {
    principal : Text;
    xp : Nat;
    level : Text;
  };

  // ---------- State ----------
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let xpMap = Map.empty<Principal, Nat>();
  let levelMap = Map.empty<Principal, Text>();
  let badgesMap = Map.empty<Principal, [Badge]>();
  let streakMap = Map.empty<Principal, Nat>();
  let lastLoginMap = Map.empty<Principal, Text>();
  let completedChallengesMap = Map.empty<Principal, [Text]>();
  let resumeSessionsMap = Map.empty<Principal, [ResumeSession]>();

  // ---------- Challenges ----------
  let challenges : [Challenge] = [
    { id = "c1"; title = "Quantify a Bullet Point"; description = "Add a specific number or percentage to one of your resume bullet points."; xpReward = 50 },
    { id = "c2"; title = "Write a Strong Summary"; description = "Craft a 2-3 sentence professional summary tailored to your target internship role."; xpReward = 75 },
    { id = "c3"; title = "Tailor Your Skills Section"; description = "Update your skills section to include at least 3 skills from a real job description."; xpReward = 60 },
    { id = "c4"; title = "Action Verb Makeover"; description = "Replace 5 weak verbs with strong action verbs like engineered, spearheaded, or optimized."; xpReward = 50 },
    { id = "c5"; title = "One Page Challenge"; description = "Trim your resume to fit on exactly one page without losing key information."; xpReward = 80 },
    { id = "c6"; title = "LinkedIn Sync"; description = "Make sure your LinkedIn headline and resume summary are consistent with each other."; xpReward = 40 },
  ];

  // ---------- Helpers ----------
  func computeLevel(xp : Nat) : Text {
    if (xp >= 3000) { "Dream Intern" }
    else if (xp >= 1500) { "Top Candidate" }
    else if (xp >= 500) { "Rising Star" }
    else { "Intern Rookie" }
  };

  func dayString(ts : Int) : Text {
    let secs = ts / 1_000_000_000;
    (secs / 86400).toText()
  };

  func getXP(caller : Principal) : Nat {
    switch (xpMap.get(caller)) {
      case (?v) { v };
      case (null) { 0 };
    }
  };

  func addXPInternal(caller : Principal, amount : Nat) {
    let newXP = getXP(caller) + amount;
    xpMap.add(caller, newXP);
    levelMap.add(caller, computeLevel(newXP));
  };

  func getBadges(caller : Principal) : [Badge] {
    switch (badgesMap.get(caller)) {
      case (?b) { b };
      case (null) { [] };
    }
  };

  func hasBadge(caller : Principal, badgeId : Text) : Bool {
    let bs = getBadges(caller);
    bs.any(func(b : Badge) : Bool { b.id == badgeId })
  };

  func awardBadgeInternal(caller : Principal, badge : Badge) {
    if (not hasBadge(caller, badge.id)) {
      let bs = getBadges(caller);
      badgesMap.add(caller, bs.concat([badge]));
    }
  };

  func checkBadges(caller : Principal) {
    let xp = getXP(caller);
    let sessions = switch (resumeSessionsMap.get(caller)) {
      case (?s) { s }; case (null) { [] }
    };
    let completed = switch (completedChallengesMap.get(caller)) {
      case (?c) { c }; case (null) { [] }
    };
    if (sessions.size() >= 1) {
      awardBadgeInternal(caller, { id = "first_resume"; name = "First Step"; description = "Tailored your first resume" });
    };
    if (sessions.size() >= 5) {
      awardBadgeInternal(caller, { id = "resume5"; name = "Resume Pro"; description = "Tailored 5 resumes" });
    };
    if (completed.size() >= 10) {
      awardBadgeInternal(caller, { id = "challenge10"; name = "Skill Builder"; description = "Completed 10 skill challenges" });
    };
    if (xp >= 500) {
      awardBadgeInternal(caller, { id = "xp500"; name = "Rising Star"; description = "Reached 500 XP" });
    };
    if (xp >= 1500) {
      awardBadgeInternal(caller, { id = "xp1500"; name = "Top Candidate"; description = "Reached 1500 XP" });
    };
    if (xp >= 3000) {
      awardBadgeInternal(caller, { id = "xp3000"; name = "Dream Intern"; description = "Reached 3000 XP" });
    };
  };

  func escapeJson(t : Text) : Text {
    var result = "";
    for (c in t.chars()) {
      let n = c.toNat32();
      if (n == 34) {
        result := result # "\\\"";
      } else if (n == 92) {
        result := result # "\\\\";
      } else if (n == 10) {
        result := result # "\\n";
      } else if (n == 13) {
        result := result # "\\r";
      } else if (n == 9) {
        result := result # "\\t";
      } else {
        result := result # c.toText();
      };
    };
    result
  };

  func extractJsonString(json : Text, key : Text) : Text {
    let needle = "\"" # key # "\":\"";
    var parts = json.split(#text needle);
    ignore parts.next();
    switch (parts.next()) {
      case (null) { json };
      case (?after) {
        var result = "";
        var escape = false;
        label lp for (c in after.chars()) {
          let n = c.toNat32();
          if (escape) {
            if (n == 110) { result := result # "\n"; }
            else if (n == 116) { result := result # "\t"; }
            else if (n == 114) { result := result # "\r"; }
            else { result := result # c.toText(); };
            escape := false;
          } else if (n == 92) {
            escape := true;
          } else if (n == 34) {
            break lp;
          } else {
            result := result # c.toText();
          };
        };
        result
      };
    }
  };

  // ---------- Public API ----------
  public query ({ caller }) func getProfile() : async UserProfile {
    let xp = getXP(caller);
    let level = switch (levelMap.get(caller)) {
      case (?l) { l }; case (null) { "Intern Rookie" }
    };
    let badges = getBadges(caller);
    let streak = switch (streakMap.get(caller)) {
      case (?s) { s }; case (null) { 0 }
    };
    let lastLoginDay = switch (lastLoginMap.get(caller)) {
      case (?d) { d }; case (null) { "" }
    };
    let completedChallenges = switch (completedChallengesMap.get(caller)) {
      case (?c) { c }; case (null) { [] }
    };
    { xp; level; badges; streak; lastLoginDay; completedChallenges }
  };

  public shared ({ caller }) func recordLogin() : async () {
    let today = dayString(Time.now());
    let lastDay = switch (lastLoginMap.get(caller)) {
      case (?d) { d }; case (null) { "" }
    };
    let todayNat = switch (Nat.fromText(today)) {
      case (?n) { n }; case (null) { 0 }
    };
    let lastNat = switch (Nat.fromText(lastDay)) {
      case (?n) { n }; case (null) { 0 }
    };
    lastLoginMap.add(caller, today);
    if (lastDay == "") {
      streakMap.add(caller, 1);
      addXPInternal(caller, 10);
    } else if (todayNat == lastNat + 1) {
      let s = switch (streakMap.get(caller)) {
        case (?v) { v }; case (null) { 0 }
      };
      let newStreak = s + 1;
      streakMap.add(caller, newStreak);
      addXPInternal(caller, 10);
      if (newStreak >= 7) {
        awardBadgeInternal(caller, { id = "streak7"; name = "Streak Master"; description = "7-day login streak" });
      };
    } else if (todayNat != lastNat) {
      streakMap.add(caller, 1);
      addXPInternal(caller, 10);
    };
    checkBadges(caller);
  };

  public query ({ caller }) func getResumeSessions() : async [ResumeSession] {
    switch (resumeSessionsMap.get(caller)) {
      case (?s) { s }; case (null) { [] }
    }
  };

  public shared ({ caller }) func tailorResume(originalResume : Text, jobDescription : Text) : async ResumeSession {
    let systemContent = "You are an expert resume coach. Given a resume and a job description, return a tailored resume followed by skill gaps. Format your response exactly as: TAILORED_RESUME: <rewritten resume> SKILL_GAPS: <comma separated list of 3-5 missing skills>";
    let userContent = "RESUME: " # originalResume # " JOB: " # jobDescription;
    let body = "{\"model\":\"claude-3-haiku-20240307\",\"max_tokens\":2000,\"system\":\"" # escapeJson(systemContent) # "\",\"messages\":[{\"role\":\"user\",\"content\":\"" # escapeJson(userContent) # "\"}]}";
    let response = await Outcall.httpPostRequest(
      "https://api.anthropic.com/v1/messages",
      [
        { name = "x-api-key"; value = "sk-ant-placeholder" },
        { name = "anthropic-version"; value = "2023-06-01" },
        { name = "content-type"; value = "application/json" },
      ],
      body,
      transform,
    );
    let aiText = extractJsonString(response, "text");
    let tailoredResume = parseTailoredResume(aiText);
    let skillGaps = parseSkillGaps(aiText);
    let sessionId = Time.now().toText();
    let session : ResumeSession = {
      sessionId;
      originalResume;
      jobDescription;
      tailoredResume;
      skillGaps;
      timestamp = Time.now();
    };
    let existing = switch (resumeSessionsMap.get(caller)) {
      case (?s) { s }; case (null) { [] }
    };
    resumeSessionsMap.add(caller, existing.concat([session]));
    addXPInternal(caller, 100);
    checkBadges(caller);
    session
  };

  func parseTailoredResume(text : Text) : Text {
    let startMarker = "TAILORED_RESUME:";
    let endMarker = "SKILL_GAPS:";
    var parts = text.split(#text startMarker);
    ignore parts.next();
    switch (parts.next()) {
      case (null) { text };
      case (?after) {
        var endParts = after.split(#text endMarker);
        switch (endParts.next()) {
          case (null) { after };
          case (?beforeGaps) { beforeGaps.trim(#char ' ') };
        }
      };
    }
  };

  func parseSkillGaps(text : Text) : [Text] {
    let marker = "SKILL_GAPS:";
    var parts = text.split(#text marker);
    ignore parts.next();
    switch (parts.next()) {
      case (null) { [] };
      case (?after) {
        let trimmed = after.trim(#char ' ');
        let items = trimmed.split(#char ',').toArray();
        items.map(func(s : Text) : Text { s.trim(#char ' ') })
      };
    }
  };

  public query func getChallenges() : async [Challenge] {
    challenges
  };

  public shared ({ caller }) func completeChallenge(challengeId : Text) : async Bool {
    let completed = switch (completedChallengesMap.get(caller)) {
      case (?c) { c }; case (null) { [] }
    };
    if (completed.any(func(id : Text) : Bool { id == challengeId })) {
      return false;
    };
    let challenge = challenges.find(func(c : Challenge) : Bool { c.id == challengeId });
    switch (challenge) {
      case (null) { false };
      case (?c) {
        completedChallengesMap.add(caller, completed.concat([challengeId]));
        addXPInternal(caller, c.xpReward);
        checkBadges(caller);
        true
      };
    }
  };

  public query func getLeaderboard() : async [LeaderboardEntry] {
    let entries = xpMap.toArray();
    let sorted = entries.sort(func(a : (Principal, Nat), b : (Principal, Nat)) : { #less; #equal; #greater } {
      if (a.1 > b.1) { #less } else if (a.1 < b.1) { #greater } else { #equal }
    });
    let top = if (sorted.size() > 10) { sorted.sliceToArray(0, 10) } else { sorted };
    top.map(func(e : (Principal, Nat)) : LeaderboardEntry {
      {
        principal = (e.0).toText();
        xp = e.1;
        level = computeLevel(e.1);
      }
    })
  };

  public query func transform(input : Outcall.TransformationInput) : async Outcall.TransformationOutput {
    Outcall.transform(input)
  };
};
