import { Routes } from '@/lib/routes';
import { messages } from '@/messages';
import {
  IconBuilding,
  IconBulb,
  IconCookie,
  IconFileText,
  IconLanguage,
  IconListCheck,
  IconMail,
  IconMailbox,
  IconMicrophone,
  IconPhoto,
  IconPhotoEdit,
  IconPhotoScan,
  IconRoute,
  IconShieldCheck,
  IconSparkles,
  IconWand,
} from '@tabler/icons-react';
import type { MenuItemConfig } from '../types';
import { websiteConfig } from './website';

const m = messages.nav;

/**
 * Navbar links
 */
export function getNavbarLinks(): MenuItemConfig[] {
  const links: MenuItemConfig[] = [
    { title: m.features, href: Routes.Features, external: false },
  ];
  if (websiteConfig.payment?.enable) {
    links.push({ title: m.pricing, href: Routes.Pricing, external: false });
  }
  if (websiteConfig.blog?.enable) {
    links.push({ title: m.blog, href: Routes.Blog, external: false });
  }
  links.push({
    title: m.ai.title,
    items: [
      {
        title: m.ai.summarization.title,
        description: m.ai.summarization.description,
        href: Routes.AiSummarization,
        icon: IconWand,
        external: false,
      },
      {
        title: m.ai.translation.title,
        description: m.ai.translation.description,
        href: Routes.AiTranslation,
        icon: IconLanguage,
        external: false,
      },
      {
        title: m.ai.tagline.title,
        description: m.ai.tagline.description,
        href: Routes.AiTagline,
        icon: IconBulb,
        external: false,
      },
      {
        title: m.ai.tts.title,
        description: m.ai.tts.description,
        href: Routes.AiTts,
        icon: IconMicrophone,
        external: false,
      },
      {
        title: m.ai.caption.title,
        description: m.ai.caption.description,
        href: Routes.AiCaption,
        icon: IconPhotoScan,
        external: false,
      },
      {
        title: m.ai.imageCf.title,
        description: m.ai.imageCf.description,
        href: Routes.AiImageCf,
        icon: IconSparkles,
        external: false,
      },
      {
        title: m.ai.imageFal.title,
        description: m.ai.imageFal.description,
        href: Routes.AiImageFal,
        icon: IconPhoto,
        external: false,
      },
      {
        title: m.ai.imageEdit.title,
        description: m.ai.imageEdit.description,
        href: Routes.AiImageEdit,
        icon: IconPhotoEdit,
        external: false,
      },
    ],
  });
  links.push({
    title: m.pages,
    items: [
      {
        title: m.about.title,
        description: m.about.description,
        href: Routes.About,
        icon: IconBuilding,
        external: false,
      },
      {
        title: m.contact.title,
        description: m.contact.description,
        href: Routes.Contact,
        icon: IconMail,
        external: false,
      },
      {
        title: m.waitlist.title,
        description: m.waitlist.description,
        href: Routes.Waitlist,
        icon: IconMailbox,
        external: false,
      },
      {
        title: m.changelog.title,
        description: m.changelog.description,
        href: Routes.Changelog,
        icon: IconListCheck,
        external: false,
      },
      {
        title: m.roadmap.title,
        description: m.roadmap.description,
        href: Routes.Roadmap,
        icon: IconRoute,
        external: false,
      },
      {
        title: m.cookiePolicy.title,
        description: m.cookiePolicy.description,
        href: Routes.CookiePolicy,
        icon: IconCookie,
        external: false,
      },
      {
        title: m.privacyPolicy.title,
        description: m.privacyPolicy.description,
        href: Routes.PrivacyPolicy,
        icon: IconShieldCheck,
        external: false,
      },
      {
        title: m.termsOfService.title,
        description: m.termsOfService.description,
        href: Routes.TermsOfService,
        icon: IconFileText,
        external: false,
      },
    ],
  });
  return links;
}
