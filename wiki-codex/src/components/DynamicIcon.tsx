"use client";

import React from "react";
import {
  Atom,
  Award,
  BookOpen,
  Building2,
  Castle,
  Compass,
  Cpu,
  Crown,
  Database,
  Eye,
  Feather,
  FileText,
  Flag,
  Flame,
  FolderTree,
  Gem,
  GitBranch,
  Globe,
  History,
  Hourglass,
  Key,
  Landmark,
  Languages,
  Leaf,
  Library,
  Map as MapIcon,
  MapPin,
  Moon,
  Mountain,
  Network,
  Orbit,
  Scale,
  ScrollText,
  Shield,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Trees,
  User,
  Users,
  Waves,
  Wind,
  type LucideProps
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Crown,
  Castle,
  Landmark,
  Shield,
  Flag,
  Building2,
  Users,
  User,
  Scale,
  Award,
  Sparkles,
  Moon,
  Sun,
  Star,
  Compass,
  Eye,
  Hourglass,
  Key,
  Gem,
  Flame,
  Feather,
  Orbit,
  BookOpen,
  ScrollText,
  Library,
  Languages,
  Map: MapIcon,
  Globe,
  Network,
  GitBranch,
  Atom,
  Cpu,
  Database,
  FileText,
  FolderTree,
  History,
  Mountain,
  Trees,
  Waves,
  Leaf,
  Snowflake,
  Wind,
  MapPin
};

export function DynamicIcon({
  name,
  className = "w-4 h-4",
  style
}: {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = (name && ICON_MAP[name]) || Sparkles;
  return <Icon className={className} style={style} />;
}
