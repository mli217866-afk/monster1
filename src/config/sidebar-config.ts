import {
  IconBell,
  IconCreditCard,
  IconFileUpload,
  IconFolder,
  IconKey,
  IconLayoutDashboard,
  IconLock,
  IconMessage2,
  IconTags,
  IconTool,
  IconSettings2,
  IconShieldCheck,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';
import { messages } from '@/messages';
import { websiteConfig } from './website';

const m = messages.dashboard.sidebar;
const am = messages.admin;

/**
 * Sidebar links
 */
export function getSidebarLinks(): MenuItemConfig[] {
  return [
    {
      title: m.dashboard,
      icon: IconLayoutDashboard,
      href: Routes.Dashboard,
      external: false,
    },
    {
      title: '我的收藏',
      icon: IconFolder,
      href: Routes.MyCollections,
      external: false,
    },
    {
      title: am.title,
      icon: IconShieldCheck,
      authorizeOnly: ['admin'],
      items: [
        {
          title: am.users.title,
          icon: IconUsers,
          href: Routes.AdminUsers,
          external: false,
        },
        {
          title: '提示词管理',
          icon: IconMessage2,
          href: Routes.AdminPrompts,
          external: false,
        },
        {
          title: '模型管理',
          icon: IconTool,
          href: Routes.AdminModels,
          external: false,
        },
        {
          title: '标签管理',
          icon: IconTags,
          href: Routes.AdminTags,
          external: false,
        },
      ],
    },
    {
      title: m.settings,
      icon: IconSettings2,
      items: [
        {
          title: m.profile,
          icon: IconUserCircle,
          href: Routes.SettingsProfile,
          external: false,
        },
        ...(websiteConfig.payment?.enable
          ? [
              {
                title: m.billing,
                icon: IconCreditCard,
                href: Routes.SettingsBilling,
                external: false,
              },
            ]
          : []),
        {
          title: m.security,
          icon: IconLock,
          href: Routes.SettingsSecurity,
          external: false,
        },
        {
          title: m.files,
          icon: IconFileUpload,
          href: Routes.SettingsFiles,
          external: false,
        },
        {
          title: m.apiKeys,
          icon: IconKey,
          href: Routes.SettingsApiKeys,
          external: false,
        },
        {
          title: m.notifications,
          icon: IconBell,
          href: Routes.SettingsNotifications,
          external: false,
        },
      ],
    },
  ];
}
