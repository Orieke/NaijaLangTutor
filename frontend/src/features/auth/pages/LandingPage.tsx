import { Link } from 'react-router-dom';
import { Sparkles, Users, BookOpen, Volume2 } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Logo */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-ohafia-primary-500 to-ohafia-primary-700 flex items-center justify-center mb-8 shadow-ohafia-lg">
          <span className="text-white font-display text-4xl font-bold">A</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-ohafia-earth-900 mb-4">
          Asụsụ Ohafia
        </h1>
        
        <p className="text-lg text-ohafia-earth-600 mb-2 igbo-text">
          Learn Igbo · Ohafia Dialect
        </p>
        
        <p className="text-ohafia-earth-500 max-w-sm mx-auto mb-10">
          Join our community of language warriors preserving the rich heritage of Ohafia through interactive learning.
        </p>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-sm">
          <FeatureCard icon={Volume2} title="Speak" description="Practice pronunciation" />
          <FeatureCard icon={BookOpen} title="Read" description="Graded stories" />
          <FeatureCard icon={Sparkles} title="Learn" description="Daily lessons" />
          <FeatureCard icon={Users} title="Community" description="Native speakers" />
        </div>

        {/* CTA Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <Link to="/auth/sign-up" className="btn-primary w-full py-4 text-lg">
            Start Learning Free
          </Link>
          <Link to="/auth/sign-in" className="btn-outline w-full py-4">
            I already have an account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-6 text-center">
        <p className="text-sm text-ohafia-earth-400">
          Preserving the Ohafia War Dance spirit through language
        </p>
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="w-2 h-2 rounded-full bg-ohafia-primary-500"></span>
          <span className="w-2 h-2 rounded-full bg-ohafia-secondary-500"></span>
          <span className="w-2 h-2 rounded-full bg-ohafia-accent-500"></span>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="w-10 h-10 rounded-xl bg-ohafia-primary-100 flex items-center justify-center mx-auto mb-2">
        <Icon className="w-5 h-5 text-ohafia-primary-600" />
      </div>
      <h3 className="font-semibold text-ohafia-earth-800 text-sm">{title}</h3>
      <p className="text-xs text-ohafia-earth-500">{description}</p>
    </div>
  );
}
