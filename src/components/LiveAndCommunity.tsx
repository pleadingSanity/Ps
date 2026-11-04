import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Radio, Calendar, Film, MessageSquareHeart, Send, ShieldCheck, ExternalLink, Trash2 } from 'lucide-react';
import { TWELVE_CORE_THEMES } from '../data/sanctuaryData';

interface LiveSession {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  streamUrl: string;
  status: 'live' | 'scheduled' | 'past';
  scheduledFor: string;
  isPublic: boolean;
  replayAvailable: boolean;
}

interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  themeTag: string;
  visibility: 'public' | 'friends';
  createdAt?: { seconds: number };
}

const DEFAULT_LIVES: LiveSession[] = [
  {
    id: 'seed-live-1',
    creatorId: 'shane-cooper',
    creatorName: 'Shane Cooper',
    title: 'Late Night Sanctuary Check-In — You Don’t Walk Alone',
    description: 'Open floor conversation about turning the shadow voice into discipline, letters of hope, and holding the line together.',
    streamUrl: 'https://www.youtube.com/@pleadingsanity',
    status: 'live',
    scheduledFor: 'Live Right Now · Open Sanctuary',
    isPublic: true,
    replayAvailable: true,
  },
  {
    id: 'seed-sched-1',
    creatorId: 'shane-cooper',
    creatorName: 'Shane Cooper & Founding Creators',
    title: 'New Gen Bible Reading · Book III: Discipline & The Body',
    description: 'Discussing recovery without erasure, physical grounding, and building the first 1,000 Founding Creators.',
    streamUrl: 'https://www.youtube.com/@pleadingsanity',
    status: 'scheduled',
    scheduledFor: 'Sunday · 20:00 UK Time',
    isPublic: true,
    replayAvailable: false,
  },
  {
    id: 'seed-past-1',
    creatorId: 'shane-cooper',
    creatorName: 'Shane Cooper',
    title: 'Born in a Prison Cell: The True Story of Pleading Sanity',
    description: 'How “You say I’m mad — you just don’t understand me” became a movement for 80,000 voices.',
    streamUrl: 'https://www.youtube.com/@pleadingsanity',
    status: 'past',
    scheduledFor: 'Recorded Sanctuary Replay',
    isPublic: true,
    replayAvailable: true,
  },
];

export function LiveAndCommunity({
  currentUser,
  onSignIn,
}: {
  currentUser: User | null;
  onSignIn: () => void;
}) {
  const [liveTab, setLiveTab] = useState<'live' | 'scheduled' | 'past'>('live');
  const [lives, setLives] = useState<LiveSession[]>(DEFAULT_LIVES);
  const [posts, setPosts] = useState<CommunityPost[]>([]);

  // Post form
  const [postContent, setPostContent] = useState('');
  const [postTheme, setPostTheme] = useState(TWELVE_CORE_THEMES[0].title);
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Schedule Live form
  const [liveTitle, setLiveTitle] = useState('');
  const [liveDesc, setLiveDesc] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [liveWhen, setLiveWhen] = useState('');
  const [liveStatus, setLiveStatus] = useState<'live' | 'scheduled'>('scheduled');
  const [liveSavedMsg, setLiveSavedMsg] = useState<string | null>(null);

  // Founding Creator Application form
  const [creatorWhy, setCreatorWhy] = useState('');
  const [creatorLinks, setCreatorLinks] = useState('');
  const [creatorStatusMsg, setCreatorStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const livesQuery = query(
      collection(db, 'lives'),
      where('isPublic', '==', true),
      limit(25)
    );
    const unsubLives = onSnapshot(
      livesQuery,
      (snapshot) => {
        const fetched: LiveSession[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<LiveSession, 'id'>),
        }));
        setLives([...DEFAULT_LIVES, ...fetched]);
      },
      (err) => {
        console.warn('Lives listener notice:', err);
      }
    );

    const postsQuery = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsubPosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const fetched: CommunityPost[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CommunityPost, 'id'>),
        }));
        setPosts(fetched);
      },
      (err) => {
        console.warn('Posts listener notice:', err);
      }
    );

    return () => {
      unsubLives();
      unsubPosts();
    };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onSignIn();
      return;
    }
    const clean = postContent.trim().slice(0, 2000);
    if (!clean || postSubmitting) return;
    setPostSubmitting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: currentUser.uid,
        authorName: (currentUser.displayName || 'Sanctuary Member').slice(0, 100),
        content: clean,
        themeTag: postTheme.slice(0, 80),
        visibility: 'public',
        createdAt: serverTimestamp(),
      });
      setPostContent('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleCreateLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onSignIn();
      return;
    }
    if (!liveTitle.trim() || !liveUrl.trim()) return;
    try {
      await addDoc(collection(db, 'lives'), {
        creatorId: currentUser.uid,
        creatorName: (currentUser.displayName || 'Sanctuary Creator').slice(0, 100),
        title: liveTitle.trim().slice(0, 160),
        description: (liveDesc.trim() || 'Open sanctuary broadcast').slice(0, 1000),
        streamUrl: liveUrl.trim().slice(0, 500),
        status: liveStatus,
        scheduledFor: (liveWhen.trim() || 'Tonight · 20:00 UK').slice(0, 100),
        isPublic: true,
        replayAvailable: false,
        createdAt: serverTimestamp(),
      });
      setLiveTitle('');
      setLiveDesc('');
      setLiveUrl('');
      setLiveWhen('');
      setLiveSavedMsg('Live session added to the Sanctuary schedule.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lives');
    }
  };

  const handleCreatorApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onSignIn();
      return;
    }
    if (creatorWhy.trim().length < 5) return;
    try {
      await addDoc(collection(db, 'creator_applications'), {
        userId: currentUser.uid,
        displayName: (currentUser.displayName || 'Creator Applicant').slice(0, 100),
        why: creatorWhy.trim().slice(0, 1500),
        links: (creatorLinks.trim() || 'https://pleadingsanity.co.uk').slice(0, 500),
        status: 'pending',
        submittedAt: serverTimestamp(),
      });
      setCreatorWhy('');
      setCreatorLinks('');
      setCreatorStatusMsg(
        'Your Founding Creator application has been saved to Firestore. Welcome to the First 1,000.'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'creator_applications');
    }
  };

  const filteredLives = lives.filter((l) => l.status === liveTab);
  const activeLiveStream = lives.find((l) => l.status === 'live');

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-14">
      {/* Subtle Red Live Banner when a stream is live */}
      {activeLiveStream && (
        <div className="border border-red-500/40 bg-red-950/30 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-red-100">
            <Radio className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>LIVE NOW:</strong> {activeLiveStream.title} · Hosted by {activeLiveStream.creatorName}
            </span>
          </div>
          <a
            href={activeLiveStream.streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-red-200 hover:text-white underline underline-offset-4 flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Watch External Stream
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* LIVE PLATFORM SECTION */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs text-amber-300">
              Sanctuary Broadcasts · YouTube / Twitch / Kick Embeds · Native Streaming (COMING SOON)
            </p>
            <h1 className="text-3xl sm:text-5xl font-serif-display font-semibold text-white mt-1">
              Live Sanctuary & Creator Hub
            </h1>
          </div>

          {/* 3 Tabs: Live Now · Scheduled · Past Lives */}
          <div className="flex items-center gap-1 p-1 bg-[#070b16] border border-white/10 rounded-xl self-start">
            <button
              onClick={() => setLiveTab('live')}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                liveTab === 'live'
                  ? 'bg-red-500/20 text-red-200 border border-red-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Now ({lives.filter((l) => l.status === 'live').length})
            </button>
            <button
              onClick={() => setLiveTab('scheduled')}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                liveTab === 'scheduled'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Scheduled ({lives.filter((l) => l.status === 'scheduled').length})
            </button>
            <button
              onClick={() => setLiveTab('past')}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                liveTab === 'past'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past Lives ({lives.filter((l) => l.status === 'past').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Stream Cards */}
          <div className="lg:col-span-8 space-y-4">
            {filteredLives.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-2xl bg-[#070b16] border border-white/10 space-y-3"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Host: <strong className="text-slate-200">{item.creatorName}</strong> · {item.scheduledFor}
                  </span>
                  <span>
                    {item.status === 'live'
                      ? 'LIVE NOW'
                      : item.status === 'scheduled'
                      ? 'SCHEDULED'
                      : 'REPLAY'}
                  </span>
                </div>
                <h3 className="text-xl font-serif-display font-semibold text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={item.streamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-200 hover:bg-amber-500/25 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    Open Stream Link (YouTube / Twitch / Kick)
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-xs text-slate-500">
                    Native WebRTC Video Hosting: 🔜 COMING SOON (Keeping Firebase Free Tier First)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule a Live Session Form */}
          <form
            onSubmit={handleCreateLive}
            className="lg:col-span-4 p-6 rounded-2xl bg-[#070b16] border border-white/10 space-y-4"
          >
            <h3 className="text-lg font-semibold text-white">Share or Schedule a Sanctuary Stream</h3>
            <p className="text-xs text-slate-400">
              Link your YouTube, Twitch, or Kick stream for the community.
            </p>
            <input
              type="text"
              value={liveTitle}
              onChange={(e) => setLiveTitle(e.target.value)}
              placeholder="Stream Title"
              className="w-full bg-[#0d1324] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white"
            />
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="w-full bg-[#0d1324] border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={liveStatus}
                onChange={(e) => setLiveStatus(e.target.value as 'live' | 'scheduled')}
                className="bg-[#0d1324] border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live Now</option>
              </select>
              <input
                type="text"
                value={liveWhen}
                onChange={(e) => setLiveWhen(e.target.value)}
                placeholder="Time (e.g. Fri 8pm)"
                className="bg-[#0d1324] border border-white/15 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <textarea
              rows={2}
              value={liveDesc}
              onChange={(e) => setLiveDesc(e.target.value)}
              placeholder="What will you talk about?"
              className="w-full bg-[#0d1324] border border-white/15 rounded-lg p-3 text-sm text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
            >
              {currentUser ? 'Publish Stream to Sanctuary' : 'Sign In with Google to Post Stream'}
            </button>
            {liveSavedMsg && <p className="text-xs text-emerald-300">{liveSavedMsg}</p>}
          </form>
        </div>
      </div>

      {/* COMMUNITY REFLECTION WALL (FIRESTORE POSTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-white/10">
        <div className="lg:col-span-5 space-y-4">
          <p className="text-xs text-amber-300">Real-Time Firestore Sanctuary Wall</p>
          <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-white">
            Leave People Better Than You Found Them
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Share a quiet victory, a letter of encouragement, or how you turned pain into power today. Every word is stored in our Firestore sanctuary collection with zero ad-tracking.
          </p>

          <form
            onSubmit={handleCreatePost}
            className="p-6 rounded-2xl bg-[#070b16] border border-white/10 space-y-4"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Choose a Sanctuary Theme</label>
              <select
                value={postTheme}
                onChange={(e) => setPostTheme(e.target.value)}
                className="w-full bg-[#0d1324] border border-white/15 rounded-lg px-3 py-2.5 text-xs text-white"
              >
                {TWELVE_CORE_THEMES.map((t) => (
                  <option key={t.id} value={t.title}>
                    {t.title} — {t.caption}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={4}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write in plain, honest human words..."
              className="w-full bg-[#0d1324] border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={postSubmitting}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {currentUser ? 'Post to Sanctuary Wall' : 'Sign In with Google to Share'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {posts.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#070b16] border border-white/10 space-y-3">
              <p className="text-xs text-amber-300">
                01. Cracked Heart & Flowers · Pinned Founder Note
              </p>
              <p className="text-base text-slate-200 leading-relaxed">
                “You say I’m mad — you just don’t understand me. I built this sanctuary so nobody has to sit in the dark feeling like a diagnostic label. You never have to lose yourself to belong here.”
              </p>
              <p className="text-xs text-slate-400">— Shane Cooper · Founder of Pleading Sanity</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-5 rounded-2xl bg-[#070b16] border border-white/10 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    <strong className="text-white">{post.authorName}</strong> · {post.themeTag}
                  </span>
                  {currentUser?.uid === post.authorId && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOUNDING CREATOR HUB — FIRST 1,000 OFFER */}
      <div className="border border-amber-400/30 rounded-2xl bg-[#070b16] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <p className="text-xs text-amber-300">
            Creator Hub · First 1,000 Founding Creators Only · Love Over Money
          </p>
          <h2 className="text-3xl sm:text-4xl font-serif-display font-semibold text-white">
            You Keep 90%. We Keep 10% Just to Keep the Lights On.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Most platforms take half of what creators earn while selling user attention to the highest bidder. In Pleading Sanity, sanity earns you status — not clout.
          </p>
          <ul className="space-y-2 text-sm text-slate-200">
            <li>· <strong>You keep 90%</strong> of income your content generates — locked in for as long as you stay</li>
            <li>· <strong>We keep 10%</strong> — strictly to pay for hosting and community sanctuary infrastructure</li>
            <li>· <strong>£0 earnings = £0 payout</strong> — zero fees, zero subscriptions, zero catch</li>
            <li className="text-amber-200/90 text-xs pt-1">
              Honest Infrastructure Note: Payout infrastructure launching soon — your earnings track in your dashboard. Push notifications via Cloud Messaging 🔜 COMING SOON.
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleCreatorApply}
          className="lg:col-span-5 bg-[#0d1324] border border-white/10 rounded-xl p-5 space-y-3.5"
        >
          <h3 className="text-base font-semibold text-white">
            Claim Your Spot in the First 1,000
          </h3>
          <textarea
            rows={3}
            value={creatorWhy}
            onChange={(e) => setCreatorWhy(e.target.value)}
            placeholder="Tell Shane and the family what you create and how it helps people stay sane..."
            className="w-full bg-[#070b16] border border-white/15 rounded-lg p-3 text-sm text-white"
          />
          <input
            type="text"
            value={creatorLinks}
            onChange={(e) => setCreatorLinks(e.target.value)}
            placeholder="Your YouTube, TikTok, Instagram, or Website link"
            className="w-full bg-[#070b16] border border-white/15 rounded-lg px-3 py-2 text-sm text-white"
          />
          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
          >
            {currentUser
              ? 'Submit Founding Creator Application'
              : 'Sign In with Google to Apply'}
          </button>
          {creatorStatusMsg && (
            <p className="text-xs text-emerald-300 leading-relaxed">{creatorStatusMsg}</p>
          )}
        </form>
      </div>
    </section>
  );
}
