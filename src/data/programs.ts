/**
 * programs.ts — Hardcoded program catalog for Belibi Tennis Coaching.
 *
 * Programs are static content defined here rather than in the database.
 * Only purchase records live in Supabase (user_programs table).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgramVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
}

export interface ProgramSection {
  title: string;
  videos: ProgramVideo[];
}

export interface Program {
  id: string;
  name: string;
  price: number; // in GBP pence equivalents — stored as whole pounds
  priceLabel: string; // e.g. "£149" or "From £199"
  duration: string;
  category: 'Technical Development' | 'Mental Performance' | 'Physical Performance' | 'Coaching Development' | 'Custom';
  goal: string;
  sections: ProgramSection[];
}

// ---------------------------------------------------------------------------
// Placeholder YouTube ID — swap for real IDs when content is ready
// ---------------------------------------------------------------------------

const YT = 'dQw4w9WgXcQ';

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export const PROGRAMS: Program[] = [
  // ---- TECHNICAL DEVELOPMENT -----------------------------------------------

  {
    id: 'foundation',
    name: 'Foundation Program',
    price: 149,
    priceLabel: '£149',
    duration: '30 Days',
    category: 'Technical Development',
    goal: 'Build reliable baseline consistency and technical stability.',
    sections: [
      {
        title: 'Forehand Groundstroke Program',
        videos: [
          { id: 'foundation-fh-1', title: 'Grip & Ready Position', youtubeId: YT, duration: '8:30' },
          { id: 'foundation-fh-2', title: 'Swing Path & Racket Acceleration', youtubeId: YT, duration: '10:15' },
          { id: 'foundation-fh-3', title: 'Contact Point & Follow-Through', youtubeId: YT, duration: '9:45' },
        ],
      },
      {
        title: 'Backhand Groundstroke Program',
        videos: [
          { id: 'foundation-bh-1', title: 'Two-Handed Backhand Setup', youtubeId: YT, duration: '8:00' },
          { id: 'foundation-bh-2', title: 'Unit Turn & Loading', youtubeId: YT, duration: '9:20' },
          { id: 'foundation-bh-3', title: 'Drive & Topspin Variations', youtubeId: YT, duration: '11:00' },
        ],
      },
      {
        title: 'Basic Movement & Rally Structure',
        videos: [
          { id: 'foundation-mv-1', title: 'Split Step & First Move', youtubeId: YT, duration: '7:45' },
          { id: 'foundation-mv-2', title: 'Recovery Positioning', youtubeId: YT, duration: '8:30' },
          { id: 'foundation-mv-3', title: 'Cross-Court & Down-the-Line Patterns', youtubeId: YT, duration: '12:00' },
        ],
      },
      {
        title: 'Weekly Progression Focus Points',
        videos: [
          { id: 'foundation-wp-1', title: 'Week 1–2 Targets & Drills', youtubeId: YT, duration: '6:50' },
          { id: 'foundation-wp-2', title: 'Week 3–4 Targets & Match Practice', youtubeId: YT, duration: '7:30' },
        ],
      },
    ],
  },

  {
    id: 'performance-builder',
    name: 'Performance Builder',
    price: 249,
    priceLabel: '£249',
    duration: '30 Days',
    category: 'Technical Development',
    goal: 'Turn consistent players into all-court competitors.',
    sections: [
      {
        title: 'Forehand & Backhand Groundstrokes',
        videos: [
          { id: 'pb-gs-1', title: 'Heavy Topspin Mechanics', youtubeId: YT, duration: '10:20' },
          { id: 'pb-gs-2', title: 'Inside-Out & Inside-In Forehands', youtubeId: YT, duration: '9:45' },
          { id: 'pb-gs-3', title: 'Backhand Cross-Court Weapon', youtubeId: YT, duration: '11:10' },
        ],
      },
      {
        title: 'Volley Development - Forehand & Backhand',
        videos: [
          { id: 'pb-vl-1', title: 'Volley Grip & Compact Swing', youtubeId: YT, duration: '8:00' },
          { id: 'pb-vl-2', title: 'Approach & Closing Footwork', youtubeId: YT, duration: '9:15' },
          { id: 'pb-vl-3', title: 'High & Low Volley Scenarios', youtubeId: YT, duration: '10:30' },
        ],
      },
      {
        title: 'Slice Development - Forehand & Backhand',
        videos: [
          { id: 'pb-sl-1', title: 'Backhand Slice Technique', youtubeId: YT, duration: '9:00' },
          { id: 'pb-sl-2', title: 'Approach Slice Patterns', youtubeId: YT, duration: '8:40' },
          { id: 'pb-sl-3', title: 'Defensive Slice Under Pressure', youtubeId: YT, duration: '7:55' },
        ],
      },
      {
        title: 'Drop Shot Program',
        videos: [
          { id: 'pb-ds-1', title: 'Touch & Feel — Drop Shot Mechanics', youtubeId: YT, duration: '7:20' },
          { id: 'pb-ds-2', title: 'When & Where to Use the Drop Shot', youtubeId: YT, duration: '8:05' },
        ],
      },
      {
        title: 'Tactical Decision-Making',
        videos: [
          { id: 'pb-td-1', title: 'Reading Opponent Patterns', youtubeId: YT, duration: '11:30' },
          { id: 'pb-td-2', title: 'Building the Point & Going for Winners', youtubeId: YT, duration: '12:00' },
        ],
      },
    ],
  },

  {
    id: 'match-play-weapon',
    name: 'Match Play Weapon Package',
    price: 349,
    priceLabel: '£349',
    duration: '30 Days',
    category: 'Technical Development',
    goal: 'Build dominant serve and finishing game under pressure.',
    sections: [
      {
        title: 'First Serve Program',
        videos: [
          { id: 'mpw-fs-1', title: 'Toss Consistency & Stance', youtubeId: YT, duration: '9:30' },
          { id: 'mpw-fs-2', title: 'Pronation & Racket Speed', youtubeId: YT, duration: '10:45' },
          { id: 'mpw-fs-3', title: 'Placement Targets — T, Body & Wide', youtubeId: YT, duration: '11:20' },
        ],
      },
      {
        title: 'Second Serve Program',
        videos: [
          { id: 'mpw-ss-1', title: 'Kick Serve Fundamentals', youtubeId: YT, duration: '10:00' },
          { id: 'mpw-ss-2', title: 'Depth & Margin Over the Net', youtubeId: YT, duration: '8:50' },
          { id: 'mpw-ss-3', title: 'Second Serve Pressure Drills', youtubeId: YT, duration: '9:40' },
        ],
      },
      {
        title: 'Flat / Slice / Kick Serve Development',
        videos: [
          { id: 'mpw-fsk-1', title: 'Flat Serve Power Mechanics', youtubeId: YT, duration: '8:30' },
          { id: 'mpw-fsk-2', title: 'Slice Serve Wide & Body Patterns', youtubeId: YT, duration: '9:15' },
          { id: 'mpw-fsk-3', title: 'Kick Serve to Different Courts', youtubeId: YT, duration: '10:05' },
        ],
      },
      {
        title: 'Smash & Net Play System',
        videos: [
          { id: 'mpw-np-1', title: 'Overhead Smash Positioning', youtubeId: YT, duration: '7:45' },
          { id: 'mpw-np-2', title: 'Net Domination — Poaching & Finishing', youtubeId: YT, duration: '9:00' },
          { id: 'mpw-np-3', title: 'High Ball Decisions at the Net', youtubeId: YT, duration: '8:20' },
        ],
      },
      {
        title: 'Match Strategy & Point Construction',
        videos: [
          { id: 'mpw-ms-1', title: 'Serve + 1 Patterns', youtubeId: YT, duration: '11:00' },
          { id: 'mpw-ms-2', title: 'Return Game & Neutralising Big Servers', youtubeId: YT, duration: '12:30' },
        ],
      },
    ],
  },

  // ---- MENTAL PERFORMANCE --------------------------------------------------

  {
    id: 'mindset-control',
    name: 'Mindset Control Program',
    price: 199,
    priceLabel: '£199',
    duration: '30 Days',
    category: 'Mental Performance',
    goal: 'Stay calm, focused, and consistent in matches.',
    sections: [
      {
        title: 'How to Teach Patience',
        videos: [
          { id: 'mc-pat-1', title: 'Understanding Unforced Errors', youtubeId: YT, duration: '9:00' },
          { id: 'mc-pat-2', title: 'High-Percentage Ball Discipline', youtubeId: YT, duration: '8:30' },
          { id: 'mc-pat-3', title: 'Constructing the Point Without Rushing', youtubeId: YT, duration: '10:15' },
        ],
      },
      {
        title: 'Emotional Control Training',
        videos: [
          { id: 'mc-ec-1', title: 'Recognising & Managing Tilt', youtubeId: YT, duration: '9:45' },
          { id: 'mc-ec-2', title: 'Body Language & Self-Talk', youtubeId: YT, duration: '8:20' },
          { id: 'mc-ec-3', title: 'Staying Present After Mistakes', youtubeId: YT, duration: '10:00' },
        ],
      },
      {
        title: 'Pressure Decision-Making System',
        videos: [
          { id: 'mc-pd-1', title: 'Big Points — Default Tactics', youtubeId: YT, duration: '11:30' },
          { id: 'mc-pd-2', title: 'Closing Out Sets & Matches', youtubeId: YT, duration: '10:45' },
        ],
      },
      {
        title: 'Reset Routines Between Points',
        videos: [
          { id: 'mc-rr-1', title: 'Building a Pre-Point Ritual', youtubeId: YT, duration: '7:50' },
          { id: 'mc-rr-2', title: 'Changeover & Game Recovery', youtubeId: YT, duration: '8:10' },
        ],
      },
    ],
  },

  // ---- PHYSICAL PERFORMANCE ------------------------------------------------

  {
    id: 'athletic-performance',
    name: 'Athletic Performance Package',
    price: 249,
    priceLabel: '£249',
    duration: '30 Days',
    category: 'Physical Performance',
    goal: 'Move faster, recover better, and compete longer.',
    sections: [
      {
        title: 'Speed Development - Acceleration & Sprint Work',
        videos: [
          { id: 'ap-sp-1', title: 'Court-Specific Acceleration Drills', youtubeId: YT, duration: '10:00' },
          { id: 'ap-sp-2', title: 'Linear Speed & First-Step Quickness', youtubeId: YT, duration: '9:30' },
          { id: 'ap-sp-3', title: 'Deceleration & Change of Direction', youtubeId: YT, duration: '8:45' },
        ],
      },
      {
        title: 'Agility Training',
        videos: [
          { id: 'ap-ag-1', title: 'Ladder & Cone Patterns', youtubeId: YT, duration: '9:20' },
          { id: 'ap-ag-2', title: 'Multi-Directional Footwork', youtubeId: YT, duration: '10:10' },
          { id: 'ap-ag-3', title: 'Agility Under Fatigue', youtubeId: YT, duration: '8:55' },
        ],
      },
      {
        title: 'Reaction Training',
        videos: [
          { id: 'ap-rt-1', title: 'Visual Stimulus & Ball Tracking', youtubeId: YT, duration: '8:00' },
          { id: 'ap-rt-2', title: 'Partner Reaction Drills', youtubeId: YT, duration: '7:40' },
        ],
      },
      {
        title: 'Endurance Conditioning',
        videos: [
          { id: 'ap-en-1', title: 'Aerobic Base Building', youtubeId: YT, duration: '11:30' },
          { id: 'ap-en-2', title: 'Tennis-Specific Interval Training', youtubeId: YT, duration: '12:00' },
          { id: 'ap-en-3', title: 'Match Fitness & Recovery Protocol', youtubeId: YT, duration: '10:20' },
        ],
      },
    ],
  },

  // ---- COACHING DEVELOPMENT ------------------------------------------------

  {
    id: 'junior-coaching',
    name: 'Junior Coaching System',
    price: 179,
    priceLabel: '£179',
    duration: '30 Days',
    category: 'Coaching Development',
    goal: 'Deliver fun, structured, high-quality junior sessions.',
    sections: [
      {
        title: 'How to Teach Kids Program',
        videos: [
          { id: 'jc-tk-1', title: 'Child Development & Learning Stages', youtubeId: YT, duration: '10:30' },
          { id: 'jc-tk-2', title: 'Simplifying Technical Cues for Kids', youtubeId: YT, duration: '9:15' },
          { id: 'jc-tk-3', title: 'Managing Group Behaviour & Attention', youtubeId: YT, duration: '8:50' },
        ],
      },
      {
        title: 'Session Structure Templates',
        videos: [
          { id: 'jc-ss-1', title: '60-Minute Red & Orange Ball Session', youtubeId: YT, duration: '7:30' },
          { id: 'jc-ss-2', title: '90-Minute Green Ball Competitive Session', youtubeId: YT, duration: '8:20' },
        ],
      },
      {
        title: 'Fun Drill Library',
        videos: [
          { id: 'jc-fd-1', title: '10 High-Energy Warm-Up Games', youtubeId: YT, duration: '9:45' },
          { id: 'jc-fd-2', title: 'Rally & Coordination Challenges', youtubeId: YT, duration: '10:00' },
          { id: 'jc-fd-3', title: 'Mini-Tournament Formats', youtubeId: YT, duration: '8:10' },
        ],
      },
      {
        title: 'Engagement & Learning Progression',
        videos: [
          { id: 'jc-el-1', title: 'Tracking Progress & Setting Goals with Kids', youtubeId: YT, duration: '7:55' },
          { id: 'jc-el-2', title: 'Parent Communication & Expectations', youtubeId: YT, duration: '8:40' },
        ],
      },
    ],
  },

  {
    id: 'adult-coaching',
    name: 'Adult Coaching System',
    price: 179,
    priceLabel: '£179',
    duration: '30 Days',
    category: 'Coaching Development',
    goal: 'Improve coaching clarity, structure, and player development.',
    sections: [
      {
        title: 'How to Teach Adults Program',
        videos: [
          { id: 'ac-ta-1', title: 'Adult Learning Principles', youtubeId: YT, duration: '10:00' },
          { id: 'ac-ta-2', title: 'Adapting Coaching Style per Player', youtubeId: YT, duration: '9:30' },
          { id: 'ac-ta-3', title: 'Video & Mirror Feedback Techniques', youtubeId: YT, duration: '8:45' },
        ],
      },
      {
        title: 'Progression Frameworks',
        videos: [
          { id: 'ac-pf-1', title: 'Short-Term & Long-Term Goal Setting', youtubeId: YT, duration: '9:00' },
          { id: 'ac-pf-2', title: 'Skill Ladders & Measurable Benchmarks', youtubeId: YT, duration: '8:20' },
        ],
      },
      {
        title: 'Communication & Correction Methods',
        videos: [
          { id: 'ac-cc-1', title: 'The Feedback Sandwich & Positive Framing', youtubeId: YT, duration: '7:50' },
          { id: 'ac-cc-2', title: 'Demonstration vs Verbal Instruction', youtubeId: YT, duration: '8:35' },
        ],
      },
      {
        title: 'Session Planning System',
        videos: [
          { id: 'ac-sp-1', title: 'Building a 4-Week Training Block', youtubeId: YT, duration: '11:10' },
          { id: 'ac-sp-2', title: 'In-Season vs Off-Season Session Design', youtubeId: YT, duration: '10:30' },
        ],
      },
    ],
  },

  // ---- CUSTOM --------------------------------------------------------------

  {
    id: 'custom-development',
    name: 'Custom Development Program',
    price: 199, // minimum price; displayed as "From £199"
    priceLabel: 'From £199',
    duration: '30 Days',
    category: 'Custom',
    goal: 'Create the fastest and most effective route to your individual tennis goals.',
    sections: [
      {
        title: 'Initial Player Assessment',
        videos: [
          { id: 'cd-pa-1', title: 'Baseline Skill Assessment Framework', youtubeId: YT, duration: '9:00' },
          { id: 'cd-pa-2', title: 'Video Analysis Submission Guide', youtubeId: YT, duration: '7:30' },
        ],
      },
      {
        title: 'Personalised 30-Day Development Plan',
        videos: [
          { id: 'cd-dp-1', title: 'How Your Custom Plan Is Built', youtubeId: YT, duration: '8:15' },
          { id: 'cd-dp-2', title: 'Adjusting the Plan as You Progress', youtubeId: YT, duration: '7:45' },
        ],
      },
      {
        title: 'Bespoke Training Drills & Exercises',
        videos: [
          { id: 'cd-dr-1', title: 'Solo Practice Drill Bank', youtubeId: YT, duration: '10:20' },
          { id: 'cd-dr-2', title: 'Partner & Feed Drill Sequences', youtubeId: YT, duration: '11:00' },
          { id: 'cd-dr-3', title: 'Match Play Integration Drills', youtubeId: YT, duration: '9:50' },
        ],
      },
      {
        title: 'Weekly Progression Targets',
        videos: [
          { id: 'cd-pt-1', title: 'Setting Weekly Goals & Metrics', youtubeId: YT, duration: '7:20' },
          { id: 'cd-pt-2', title: 'Self-Assessment Checklist', youtubeId: YT, duration: '6:55' },
        ],
      },
      {
        title: 'Personalised Feedback & Review',
        videos: [
          { id: 'cd-fr-1', title: 'How to Submit Videos for Review', youtubeId: YT, duration: '5:30' },
          { id: 'cd-fr-2', title: 'Interpreting Your Coach Feedback', youtubeId: YT, duration: '6:40' },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Find a program by id — returns undefined if not found. */
export function findProgram(id: string): Program | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

/**
 * findVideo — returns { program, section, video, sectionIndex, videoIndex }
 * so the player screen can resolve "next video" navigation.
 */
export function findVideo(programId: string, videoId: string) {
  const program = findProgram(programId);
  if (!program) return null;

  for (let si = 0; si < program.sections.length; si++) {
    const section = program.sections[si];
    for (let vi = 0; vi < section.videos.length; vi++) {
      if (section.videos[vi].id === videoId) {
        return { program, section, video: section.videos[vi], sectionIndex: si, videoIndex: vi };
      }
    }
  }
  return null;
}

/**
 * getNextVideo — returns the next video in the same section, or null if
 * the current video is the last one in its section.
 */
export function getNextVideo(programId: string, videoId: string): ProgramVideo | null {
  const found = findVideo(programId, videoId);
  if (!found) return null;

  const { section, videoIndex } = found;
  const nextIndex = videoIndex + 1;
  return nextIndex < section.videos.length ? section.videos[nextIndex] : null;
}
