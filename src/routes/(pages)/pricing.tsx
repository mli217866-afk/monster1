import { authClient } from '@/auth/client';
import FaqSection from '@/components/blocks/faqs';
import Container from '@/components/layout/container';
import { PricingTable } from '@/components/pricing/pricing-table';
import { websiteConfig } from '@/config/website';
import { useCurrentPlan } from '@/hooks/use-payment';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { messages } from '@/messages';
import { createFileRoute, redirect } from '@tanstack/react-router';

const m = messages.pricing;

export const Route = createFileRoute('/(pages)/pricing')({
  beforeLoad: () => {
    if (websiteConfig.payment?.enable === false) {
      throw redirect({ to: Routes.Root });
    }
  },
  head: () =>
    seo('/pricing', {
      title: `${m.title} | ${websiteConfig.metadata?.name}`,
      description: m.description,
    }),
  component: PricingPage,
});

function PricingPage() {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;
  const { data: planData } = useCurrentPlan(!!userId);
  const currentPlan = planData?.currentPlan ?? null;

  return (
    <Container className="py-16 px-4">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">{m.title}</h1>
          <p className="text-lg text-muted-foreground">{m.subtitle}</p>
        </div>
        <PricingTable
          currentPlan={currentPlan}
          metadata={userId ? { userId } : undefined}
        />
        <FaqSection />
      </div>
    </Container>
  );
}
