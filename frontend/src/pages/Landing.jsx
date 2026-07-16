import { Link } from 'react-router-dom';

function Landing() {
  const features = [
    { icon: '🔐', title: 'Secure sign-in', desc: 'JWT-based auth — every action tied to a real, verified user.' },
    { icon: '🐦', title: 'Live presence', desc: 'See exactly who is looking at what, in real time.' },
    { icon: '⇄', title: 'Instant sync', desc: 'One change reaches every open screen the moment it happens.' },
    { icon: '⚠', title: 'Conflict handling', desc: 'Simultaneous edits on the same task are merged, not lost.' },
    { icon: '📜', title: 'Activity log', desc: 'A running trail of who changed what, and when.' },
    { icon: '💾', title: 'Saved, always', desc: 'Every change is persisted to the database automatically.' },
  ];

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Top nav */}
      <div className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto">
        <h2 className="font-serif text-2xl font-semibold text-ink">Flock</h2>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-ink border border-slate-200 rounded-lg hover:bg-white transition"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo rounded-lg hover:bg-indigo-dark transition"
          >
            Get started
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs uppercase tracking-wider text-indigo font-semibold mb-4">
            Real-time collaboration
          </span>
          <h1 className="font-serif text-5xl leading-tight font-semibold text-ink mb-5">
            Work that moves together, not in turns.
          </h1>
          <p className="text-slate-500 mb-8 max-w-md">
            Flock brings your team into the same task, at the same moment. Watch presence, edits, and comments land live — no refresh, no waiting your turn.
          </p>
          <div className="flex gap-3">
            <Link
              to="/signup"
              className="px-6 py-3 bg-indigo text-white rounded-lg font-medium hover:bg-indigo-dark transition"
            >
              Get started free
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-slate-200 text-ink rounded-lg font-medium hover:bg-white transition"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Mock task card visual */}
        <div className="bg-white rounded-2xl shadow-xl p-6 relative">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold text-indigo">◆ Design System</span>
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-xs text-white font-semibold">R</div>
              <div className="w-7 h-7 rounded-full bg-teal-600 border-2 border-white flex items-center justify-center text-xs text-white font-semibold">J</div>
            </div>
          </div>
          <h3 className="font-serif font-semibold text-lg text-ink mb-3">
            Build onboarding flow v2
          </h3>
          <div className="flex gap-4 text-xs text-slate-400">
            <span>📅 Aug 3</span>
            <span>💬 5 comments</span>
            <span className="text-teal-600 font-medium">🟢 2 viewing now</span>
          </div>
          <div className="absolute -bottom-3 left-6 bg-indigo text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg">
            Live update →
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <span className="inline-block text-xs uppercase tracking-wider text-indigo font-semibold mb-3">
            Features to include
          </span>
          <h2 className="font-serif text-3xl font-semibold text-ink mb-10">
            Everything a live team needs.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="border border-slate-100 rounded-xl p-5 hover:shadow-md hover:border-indigo/30 transition"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-serif font-semibold text-ink mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="max-w-6xl mx-auto px-8 py-14 text-center">
        <h3 className="font-serif text-2xl font-semibold text-ink mb-3">
          Ready to see it live?
        </h3>
        <Link
          to="/signup"
          className="inline-block px-6 py-3 bg-indigo text-white rounded-lg font-medium hover:bg-indigo-dark transition"
        >
          Create your workspace
        </Link>
      </div>
    </div>
  );
}

export default Landing;