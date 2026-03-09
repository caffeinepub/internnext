import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  FileText,
  Flame,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Medal,
  Menu,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ResumeSession } from "./backend";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useChallenges,
  useCompleteChallenge,
  useLeaderboard,
  useProfile,
  useRecordLogin,
  useResumeSessions,
  useTailorResume,
} from "./hooks/useQueries";

type Page = "landing" | "dashboard" | "tailor" | "challenges" | "leaderboard";

// --- Level Utilities ---
const LEVEL_CONFIG: Record<
  string,
  {
    color: string;
    glow: string;
    icon: React.ReactNode;
    bg: string;
    border: string;
    label: string;
    maxXp: number;
  }
> = {
  "Intern Rookie": {
    color: "text-slate-400",
    glow: "",
    icon: <Shield className="w-4 h-4" />,
    bg: "bg-slate-500/20",
    border: "border-slate-500/40",
    label: "Intern Rookie",
    maxXp: 500,
  },
  "Rising Star": {
    color: "text-blue-400",
    glow: "glow-blue",
    icon: <Star className="w-4 h-4" />,
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    label: "Rising Star",
    maxXp: 1500,
  },
  "Top Candidate": {
    color: "text-purple-400",
    glow: "glow-purple",
    icon: <Medal className="w-4 h-4" />,
    bg: "bg-purple-500/20",
    border: "border-purple-500/40",
    label: "Top Candidate",
    maxXp: 3000,
  },
  "Dream Intern": {
    color: "text-amber-400",
    glow: "glow-gold",
    icon: <Crown className="w-4 h-4" />,
    bg: "bg-amber-500/20",
    border: "border-amber-500/40",
    label: "Dream Intern",
    maxXp: 5000,
  },
};

function getLevelConfig(level: string) {
  return LEVEL_CONFIG[level] ?? LEVEL_CONFIG["Intern Rookie"];
}

function truncatePrincipal(p: string) {
  if (p.length <= 14) return p;
  return `${p.slice(0, 6)}...${p.slice(-4)}`;
}

// --- XP Progress Bar ---
function XPBar({ xp, level }: { xp: number; level: string }) {
  const cfg = getLevelConfig(level);
  const pct = Math.min(100, Math.round((xp / cfg.maxXp) * 100));
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">XP Progress</span>
        <span className="font-mono font-semibold text-primary">
          {xp.toLocaleString()} / {cfg.maxXp.toLocaleString()} XP
        </span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full xp-bar-fill rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Current: {xp.toLocaleString()} XP</span>
        <span>{100 - pct}% to next level</span>
      </div>
    </div>
  );
}

// --- Level Badge ---
function LevelBadge({ level }: { level: string }) {
  const cfg = getLevelConfig(level);
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color} ${cfg.glow} font-semibold text-sm`}
    >
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

// --- Navigation ---
function Nav({
  page,
  setPage,
  isAuthenticated,
  onLogin,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = isAuthenticated
    ? [
        {
          id: "dashboard" as Page,
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "tailor" as Page,
          label: "Tailor Resume",
          icon: <FileText className="w-4 h-4" />,
        },
        {
          id: "challenges" as Page,
          label: "Challenges",
          icon: <Target className="w-4 h-4" />,
        },
        {
          id: "leaderboard" as Page,
          label: "Leaderboard",
          icon: <Trophy className="w-4 h-4" />,
        },
      ]
    : [];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          type="button"
          onClick={() => setPage(isAuthenticated ? "dashboard" : "landing")}
          className="flex items-center gap-2.5 group"
          data-ocid="nav.link"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center glow-lime-sm">
            <Rocket className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            Intern<span className="text-primary">Next</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.id}
              onClick={() => setPage(link.id)}
              data-ocid={`nav.${link.id}.link`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                page === link.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>

        {/* Auth Button */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              data-ocid="nav.logout.button"
              className="hidden md:flex gap-2 border-border hover:border-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onLogin}
              data-ocid="nav.login.button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-lime-sm"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}

          {/* Mobile menu */}
          {isAuthenticated && (
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => {
                    setPage(link.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    page === link.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// --- Landing Page ---
function LandingPage({
  onLogin,
  isLoggingIn,
}: { onLogin: () => void; isLoggingIn: boolean }) {
  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "AI Resume Tailoring",
      desc: "Claude AI analyzes job descriptions and rewrites your resume to match — highlighting exact skills employers want.",
    },
    {
      icon: <Target className="w-6 h-6 text-blue-400" />,
      title: "Skill Gap Analysis",
      desc: "Instantly see which skills you're missing for your target role and get a prioritized roadmap to fill them.",
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      title: "XP & Level System",
      desc: "Earn experience points for every action. Level up from Intern Rookie to Dream Intern as you improve.",
    },
    {
      icon: <Trophy className="w-6 h-6 text-amber-400" />,
      title: "Skill Challenges",
      desc: "Complete guided challenges to unlock badges, boost your profile, and stand out to recruiters.",
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Global Leaderboard",
      desc: "Compete with peers worldwide. Track your rank and see how you stack up against top candidates.",
    },
    {
      icon: <Flame className="w-6 h-6 text-orange-400" />,
      title: "Daily Streaks",
      desc: "Build momentum with daily login streaks. Consistency is the secret weapon of every successful intern.",
    },
  ];

  const stats = [
    { label: "Resumes Tailored", value: "12,400+" },
    { label: "Internships Secured", value: "3,200+" },
    { label: "Skill Gaps Closed", value: "89,000+" },
    { label: "Active Users", value: "8,500+" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 bg-grid"
        data-ocid="landing.section"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-bg.dim_1400x800.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl animate-pulse-glow pointer-events-none" />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 blur-3xl animate-pulse-glow pointer-events-none"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by CaffeineAI (Claude LLM)
            </div>

            <h1 className="font-display text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
              Land Your
              <br />
              <span className="text-gradient-lime">Dream Internship</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              AI-powered resume tailoring meets gamified skill development.
              Level up your career with InternNext — where getting hired is a
              game you win.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                onClick={onLogin}
                disabled={isLoggingIn}
                data-ocid="landing.login.primary_button"
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-lime text-base px-8 h-12 font-semibold"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-2" />
                )}
                {isLoggingIn ? "Connecting..." : "Start For Free"}
                {!isLoggingIn && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              <span className="text-sm text-muted-foreground">
                No credit card required · Secure with Internet Identity
              </span>
            </div>
          </motion.div>

          {/* Floating stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 flex flex-wrap justify-center gap-3"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="card-glass rounded-xl px-5 py-3 text-center"
              >
                <div className="font-display font-bold text-xl text-primary">
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Everything you need to
            <span className="text-gradient-lime"> get hired</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            From AI resume tailoring to gamified skill-building, InternNext is
            your complete career acceleration platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="card-glass h-full hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-3">
                    {f.icon}
                  </div>
                  <CardTitle className="font-display text-lg">
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center card-glass rounded-2xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="relative z-10">
            <h2 className="font-display text-4xl font-black tracking-tight mb-4">
              Ready to level up?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of students already using InternNext to land their
              dream internships.
            </p>
            <Button
              size="lg"
              onClick={onLogin}
              disabled={isLoggingIn}
              data-ocid="landing.cta.primary_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-lime text-base px-10 h-12"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isLoggingIn ? "Connecting..." : "Get Started — It's Free"}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} InternNext. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

// --- Dashboard Page ---
function DashboardPage({ setPage }: { setPage: (p: Page) => void }) {
  const { data: profile, isLoading } = useProfile();
  const { mutate: recordLogin } = useRecordLogin();

  useEffect(() => {
    recordLogin();
  }, [recordLogin]);

  const xp = profile ? Number(profile.xp) : 0;
  const streak = profile ? Number(profile.streak) : 0;
  const level = profile?.level ?? "Intern Rookie";
  const cfg = getLevelConfig(level);

  const quickLinks = [
    {
      label: "Tailor My Resume",
      page: "tailor" as Page,
      icon: <FileText className="w-5 h-5" />,
      desc: "AI-powered resume optimization",
      color: "text-primary",
    },
    {
      label: "Skill Challenges",
      page: "challenges" as Page,
      icon: <Target className="w-5 h-5" />,
      desc: "Earn XP and unlock badges",
      color: "text-blue-400",
    },
    {
      label: "Leaderboard",
      page: "leaderboard" as Page,
      icon: <Trophy className="w-5 h-5" />,
      desc: "See how you rank globally",
      color: "text-amber-400",
    },
  ];

  return (
    <div
      className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      data-ocid="dashboard.section"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="font-display text-3xl font-black tracking-tight">
          Your Dashboard
        </h1>
        <p className="text-muted-foreground">
          Track your progress and keep leveling up.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4" data-ocid="dashboard.loading_state">
          <Skeleton className="h-40 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      ) : (
        <>
          {/* Level + XP Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={`card-glass border ${cfg.border} overflow-hidden`}>
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Current Level
                    </p>
                    <LevelBadge level={level} />
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="font-display text-3xl font-black text-primary">
                        {xp.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total XP
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center font-display text-3xl font-black text-orange-400">
                        <Flame className="w-6 h-6" />
                        {streak}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Day Streak
                      </div>
                    </div>
                  </div>
                </div>
                <XPBar xp={xp} level={level} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {quickLinks.map((ql, _i) => (
              <button
                type="button"
                key={ql.page}
                onClick={() => setPage(ql.page)}
                data-ocid={`dashboard.${ql.page}.card`}
                className="text-left group"
              >
                <Card className="card-glass h-full hover:border-primary/30 transition-all hover:-translate-y-0.5 cursor-pointer">
                  <CardContent className="p-5">
                    <div className={`${ql.color} mb-3`}>{ql.icon}</div>
                    <div className="font-display font-bold text-sm mb-1">
                      {ql.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ql.desc}
                    </div>
                    <ChevronRight className="w-4 h-4 mt-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="card-glass">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Earned Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!profile?.badges || profile.badges.length === 0 ? (
                  <div
                    className="text-center py-8"
                    data-ocid="dashboard.badges.empty_state"
                  >
                    <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">
                      Complete challenges to earn your first badge!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setPage("challenges")}
                      data-ocid="dashboard.challenges.secondary_button"
                    >
                      Browse Challenges
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {profile.badges.map((badge, i) => (
                      <TooltipProvider key={badge.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              data-ocid={`dashboard.badge.item.${i + 1}`}
                              className="card-glass rounded-xl p-4 text-center cursor-default hover:border-primary/30 transition-colors glow-lime-sm"
                            >
                              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
                              <div className="font-semibold text-xs truncate">
                                {badge.name}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-48">{badge.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}

// --- Resume Tailor Page ---
function TailorPage() {
  const [resume, setResume] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [result, setResult] = useState<ResumeSession | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ResumeSession | null>(
    null,
  );

  const { mutate: tailorResume, isPending } = useTailorResume();
  const { data: sessions, isLoading: sessionsLoading } = useResumeSessions();

  const handleTailor = () => {
    if (!resume.trim() || !jobDesc.trim()) {
      toast.error("Please fill in both resume and job description.");
      return;
    }
    tailorResume(
      { originalResume: resume, jobDescription: jobDesc },
      {
        onSuccess: (session) => {
          setResult(session);
          toast.success("Resume tailored! +50 XP earned 🎉");
        },
        onError: (err) => {
          toast.error(`Failed to tailor resume: ${err.message}`);
        },
      },
    );
  };

  const handleCopy = () => {
    const text =
      selectedSession?.tailoredResume ?? result?.tailoredResume ?? "";
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const activeResult = selectedSession ?? result;

  return (
    <div
      className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      data-ocid="tailor.section"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-black tracking-tight">
          Resume Tailor
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste your resume and target job description. Claude AI will optimize
          it for you.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <Card className="card-glass">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Your Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your current resume here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                data-ocid="tailor.resume.textarea"
                className="min-h-[200px] font-mono text-xs resize-y bg-secondary/50 border-input"
              />
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description you're targeting..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                data-ocid="tailor.job.textarea"
                className="min-h-[200px] font-mono text-xs resize-y bg-secondary/50 border-input"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleTailor}
            disabled={isPending}
            data-ocid="tailor.submit.primary_button"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-lime h-12 text-base font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Tailoring with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Tailor My Resume
              </>
            )}
          </Button>

          {isPending && (
            <div className="text-center" data-ocid="tailor.loading_state">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Claude is analyzing your resume...
              </div>
            </div>
          )}
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          {activeResult ? (
            <>
              <Card className="card-glass border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Tailored Resume
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      data-ocid="tailor.copy.secondary_button"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="bg-secondary/50 rounded-lg p-4 font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto"
                    data-ocid="tailor.result.panel"
                  >
                    {activeResult.tailoredResume}
                  </div>
                </CardContent>
              </Card>

              {activeResult.skillGaps.length > 0 && (
                <Card className="card-glass">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      Skill Gaps to Close
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {activeResult.skillGaps.map((gap, i) => (
                        <Badge
                          key={gap}
                          variant="outline"
                          className="border-blue-500/40 text-blue-400 bg-blue-500/10"
                          data-ocid={`tailor.skill_gap.item.${i + 1}`}
                        >
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div
              className="h-full min-h-[300px] card-glass rounded-xl flex flex-col items-center justify-center gap-3 text-center p-8"
              data-ocid="tailor.empty_state"
            >
              <Sparkles className="w-12 h-12 text-primary/40" />
              <p className="font-display font-bold text-lg">
                Your tailored resume will appear here
              </p>
              <p className="text-muted-foreground text-sm">
                Fill in your resume and job description, then click "Tailor My
                Resume"
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Past Sessions */}
      {sessions && sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card-glass">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Past Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div
                  className="space-y-2"
                  data-ocid="tailor.sessions.loading_state"
                >
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <button
                      type="button"
                      key={s.sessionId}
                      onClick={() => setSelectedSession(s)}
                      data-ocid={`tailor.session.item.${i + 1}`}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:border-primary/30 ${
                        selectedSession?.sessionId === s.sessionId
                          ? "border-primary/40 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">
                            {s.jobDescription.slice(0, 60)}...
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(
                            Number(s.timestamp) / 1_000_000,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// --- Challenges Page ---
function ChallengesPage() {
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const { data: profile } = useProfile();
  const { mutate: completeChallenge, isPending } = useCompleteChallenge();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const completedIds = new Set(profile?.completedChallenges ?? []);

  const handleComplete = (id: string) => {
    setCompletingId(id);
    completeChallenge(id, {
      onSuccess: (success) => {
        setCompletingId(null);
        if (success) {
          toast.success("Challenge complete! XP earned 🚀");
        } else {
          toast.error("Challenge already completed or not available.");
        }
      },
      onError: (err) => {
        setCompletingId(null);
        toast.error(`Error: ${err.message}`);
      },
    });
  };

  const sampleChallenges = [
    {
      id: "c1",
      title: "Quantify Your Impact",
      description:
        "Add 3 quantified achievements to your resume (numbers, percentages, or metrics).",
      xpReward: 150n,
    },
    {
      id: "c2",
      title: "LinkedIn Optimization",
      description:
        "Complete your LinkedIn profile with a summary, 3 skills, and a professional headshot.",
      xpReward: 100n,
    },
    {
      id: "c3",
      title: "Cold Email Master",
      description:
        "Draft and send 5 cold emails to professionals in your target industry.",
      xpReward: 200n,
    },
    {
      id: "c4",
      title: "GitHub Portfolio",
      description:
        "Pin 3 relevant projects to your GitHub with detailed READMEs.",
      xpReward: 175n,
    },
    {
      id: "c5",
      title: "Mock Interview",
      description:
        "Complete a mock technical or behavioral interview and record your performance.",
      xpReward: 250n,
    },
    {
      id: "c6",
      title: "Networking Blitz",
      description:
        "Connect with 10 recruiters or professionals in your target companies on LinkedIn.",
      xpReward: 125n,
    },
  ];

  const displayChallenges =
    challenges && challenges.length > 0 ? challenges : sampleChallenges;

  return (
    <div
      className="max-w-5xl mx-auto px-4 py-8 space-y-8"
      data-ocid="challenges.section"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-black tracking-tight">
          Skill Challenges
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete challenges to earn XP, unlock badges, and build your career
          profile.
        </p>
      </motion.div>

      {challengesLoading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          data-ocid="challenges.loading_state"
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayChallenges.map((challenge, i) => {
            const isCompleted = completedIds.has(challenge.id);
            const isCompleting = completingId === challenge.id && isPending;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                data-ocid={`challenges.item.${i + 1}`}
              >
                <Card
                  className={`card-glass h-full flex flex-col transition-all ${
                    isCompleted
                      ? "border-primary/30 bg-primary/5"
                      : "hover:border-primary/20"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-base leading-tight">
                        {challenge.title}
                      </CardTitle>
                      {isCompleted && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-2">
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
                        <Zap className="w-3 h-3 mr-1" />+
                        {Number(challenge.xpReward).toLocaleString()} XP
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1 gap-4">
                    <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                      {challenge.description}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleComplete(challenge.id)}
                      disabled={isCompleted || isCompleting}
                      data-ocid={`challenges.complete.button.${i + 1}`}
                      className={
                        isCompleted
                          ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/10 cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Completing...
                        </>
                      ) : isCompleted ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Completed!
                        </>
                      ) : (
                        <>
                          <Target className="w-3.5 h-3.5 mr-1.5" />
                          Complete Challenge
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- Leaderboard Page ---
function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useLeaderboard();
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString();

  const sampleLeaderboard = [
    {
      principal: "rdmx6-jaaaa-aaaah-qcaiq-cai",
      xp: 4850n,
      level: "Dream Intern",
    },
    {
      principal: "rrkah-fqaaa-aaaaa-aaaaq-cai",
      xp: 3200n,
      level: "Top Candidate",
    },
    { principal: "aaaaa-aa", xp: 2750n, level: "Top Candidate" },
    {
      principal: "qhbym-qaaaa-aaaaa-aaafq-cai",
      xp: 1900n,
      level: "Rising Star",
    },
    {
      principal: "mxzaz-hqaaa-aaaar-qaada-cai",
      xp: 1450n,
      level: "Rising Star",
    },
    {
      principal: "e3mmv-5qaaa-aaaah-aadma-cai",
      xp: 980n,
      level: "Intern Rookie",
    },
    {
      principal: "bd3sg-teaaa-aaaaa-qaaba-cai",
      xp: 760n,
      level: "Intern Rookie",
    },
    {
      principal: "renrk-eyaaa-aaaaa-aaada-cai",
      xp: 540n,
      level: "Intern Rookie",
    },
  ];

  const entries = (
    leaderboard && leaderboard.length > 0 ? leaderboard : sampleLeaderboard
  ).slice(0, 10);

  const rankIcons = [
    <Crown className="w-5 h-5 text-amber-400" key="1" />,
    <Medal className="w-5 h-5 text-slate-300" key="2" />,
    <Award className="w-5 h-5 text-amber-700" key="3" />,
  ];

  return (
    <div
      className="max-w-3xl mx-auto px-4 py-8 space-y-8"
      data-ocid="leaderboard.section"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-black tracking-tight">
          Global Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Top candidates worldwide, ranked by total XP earned.
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="leaderboard.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="card-glass">
            <CardContent className="p-0">
              <Table data-ocid="leaderboard.table">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>Principal</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-right">XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, i) => {
                    const cfg = getLevelConfig(entry.level);
                    const isCurrentUser =
                      currentPrincipal && entry.principal === currentPrincipal;
                    return (
                      <TableRow
                        key={entry.principal}
                        data-ocid={`leaderboard.row.item.${i + 1}`}
                        className={`border-border transition-colors ${
                          isCurrentUser
                            ? "bg-primary/8 hover:bg-primary/12"
                            : "hover:bg-secondary/50"
                        }`}
                      >
                        <TableCell className="text-center font-display font-bold">
                          {i < 3 ? (
                            rankIcons[i]
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              #{i + 1}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-full ${cfg.bg} border ${cfg.border} flex items-center justify-center`}
                            >
                              <span
                                className={`text-xs font-bold ${cfg.color}`}
                              >
                                {entry.principal.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span
                              className={`font-mono text-sm ${isCurrentUser ? "text-primary font-semibold" : ""}`}
                            >
                              {truncatePrincipal(entry.principal)}
                              {isCurrentUser && (
                                <span className="ml-1.5 text-xs text-primary">
                                  (you)
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}
                          >
                            {cfg.icon}
                            {entry.level}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-mono font-semibold text-primary">
                            {Number(entry.xp).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// --- Main App ---
export default function App() {
  const { login, clear, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const [page, setPage] = useState<Page>("landing");

  const isAuthenticated = !!identity;

  // Redirect to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated && page === "landing") {
      setPage("dashboard");
    } else if (!isAuthenticated && page !== "landing") {
      setPage("landing");
    }
  }, [isAuthenticated, page]);

  if (isInitializing || actorFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto glow-lime">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-display font-bold text-lg">InternNext</p>
            <div className="flex items-center gap-2 text-muted-foreground text-sm justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Nav
          page={page}
          setPage={setPage}
          isAuthenticated={isAuthenticated}
          onLogin={login}
          onLogout={clear}
        />

        <main className={isAuthenticated ? "pt-16" : ""}>
          <AnimatePresence mode="wait">
            {!isAuthenticated && page === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LandingPage onLogin={login} isLoggingIn={isLoggingIn} />
              </motion.div>
            )}
            {isAuthenticated && page === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <DashboardPage setPage={setPage} />
              </motion.div>
            )}
            {isAuthenticated && page === "tailor" && (
              <motion.div
                key="tailor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <TailorPage />
              </motion.div>
            )}
            {isAuthenticated && page === "challenges" && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <ChallengesPage />
              </motion.div>
            )}
            {isAuthenticated && page === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <LeaderboardPage />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  );
}
