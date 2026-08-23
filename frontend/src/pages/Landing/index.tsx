import React, { useState } from 'react';
import { LandingNav } from '../../components/LandingNav';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturesSection } from './FeaturesSection';
import { DashboardPreviewSection } from './DashboardPreviewSection';
import { TrustSection } from './TrustSection';
import { CTASection, Footer } from './CTAAndFooter';
import { Preloader } from '../../components/Preloader';
import { useLenis } from '../../hooks/useLenis';

export const LandingPage: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  useLenis();

  return (
    <>
      <Preloader onComplete={() => setLoaded(true)} />
      {loaded && (
        <>
          <LandingNav />
          <main>
            <HeroSection />
            <ProblemSection />
            <HowItWorksSection />
            <FeaturesSection />
            <DashboardPreviewSection />
            <TrustSection />
            <CTASection />
          </main>
          <Footer />
        </>
      )}
    </>
  );
};
