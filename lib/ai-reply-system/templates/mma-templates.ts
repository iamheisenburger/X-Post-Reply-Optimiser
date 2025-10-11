// mma-templates.ts - Content-aware MMA reply templates

import type { CreatorIntelligence } from '../types';
import type { ExtractedTopic } from '../topic-extractor';
import type { TweetContent } from '../content-analyzer';

export interface ReplyTemplate {
  hook: string;
  body: string;
  closer: string;
}

/**
 * Build QUESTION reply for MMA topics
 */
export function buildMMAQuestion(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  const questions: Record<string, string[]> = {
    'training': [
      'How do you program conditioning vs technical work throughout the week?',
      'What\'s your approach to periodization leading into a fight?',
      'How do you balance volume and intensity without overtraining?',
    ],
    'fighting': [
      'What\'s your pre-fight strategy for studying opponent tendencies?',
      'How do you adjust mid-fight when your game plan isn\'t working?',
      'What\'s the mental reset process between rounds?',
    ],
    'discipline': [
      'How did you build consistency when motivation dropped?',
      'What\'s your process for staying focused during hard training blocks?',
      'How do you recover mentally after a tough loss?',
    ],
  };
  
  const topicQuestions = questions[topic.mainTopic] || [
    'How did you develop that skill?',
    'What was the breakthrough moment?',
  ];
  
  return {
    hook: `@${username}`,
    body: topicQuestions[0],
    closer: '',
  };
}

/**
 * Build CONTRARIAN reply for MMA topics
 */
export function buildMMAContrarian(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  const contrarian: Record<string, string[]> = {
    'training': [
      'Counterpoint: more volume doesn\'t equal better results - I\'ve seen overtraining ruin more fighters than under-training.',
      'The "train every day" mentality works until your CNS shuts down and performance tanks.',
      'Recovery is training. Most fighters under-recover and wonder why they plateau.',
    ],
    'fighting': [
      'Game plans are great until you get punched in the face and need to adapt.',
      'Over-studying opponents leads to paralysis - instinct beats analysis in the cage.',
      'Fighting safe is how you lose decisions. Calculated aggression wins.',
    ],
    'discipline': [
      'Discipline without intelligence is just stubbornness.',
      'The hardest workers aren\'t always the best fighters - smart training beats hard training.',
      'Motivation is overrated. Systems and habits win.',
    ],
  };
  
  const angles = contrarian[topic.mainTopic] || [
    "I've seen the opposite approach work better in practice.",
  ];
  
  return {
    hook: `@${username}`,
    body: angles[0],
    closer: 'Thoughts?',
  };
}

/**
 * Build ADD-VALUE reply for MMA topics
 */
export function buildMMAAddValue(
  topic: ExtractedTopic,
  tweetContent: TweetContent,
  creator: CreatorIntelligence,
  tweetText: string
): ReplyTemplate {
  const username = creator.username;
  
  const additions: Record<string, string[]> = {
    'training': [
      'This is why GSP\'s training was so effective - he periodized strength/conditioning/technical work in distinct blocks.',
      'Israel Adesanya talks about this - drilling at 70% to build muscle memory without CNS fatigue.',
      'The best camps I\'ve seen follow 8-week blocks: base building → skill sharpening → fight simulation.',
    ],
    'fighting': [
      'This is the Khabib approach - impose your fight, don\'t react to theirs.',
      'DC did this perfectly against Stipe - adjusted the game plan between rounds based on what was working.',
      'The best fighters have a hierarchy: primary game plan → backup reads → pure instinct.',
    ],
    'discipline': [
      'Jocko\'s approach to this is simple: discipline equals freedom. Systems remove decisions.',
      'Cus D\'Amato built this into Tyson - the training removes thought, fight becomes automatic.',
      'Georges St-Pierre\'s routine was religious - same schedule every day removed willpower from the equation.',
    ],
  };
  
  const addition = additions[topic.mainTopic] || [
    'This is the foundation of every champion\'s mindset.',
  ];
  
  return {
    hook: `@${username}`,
    body: `100%. ${addition[0]}`,
    closer: '',
  };
}

/**
 * Select best template type based on creator profile
 */
export function selectMMATemplate(
  creator: CreatorIntelligence,
  topic: ExtractedTopic
): 'question' | 'contrarian' | 'add_value' {
  const respondsTo = creator.audience.engagementPatterns.respondsTo;
  
  if (respondsTo.includes('technical questions')) return 'question';
  if (respondsTo.includes('contrarian views') || respondsTo.includes('debate')) return 'contrarian';
  if (respondsTo.includes('specific examples') || respondsTo.includes('fighter references')) return 'add_value';
  
  return 'question';
}

