import os

file_path = "src/components/layout/AdminLayout.jsx"
with open(file_path, "r") as f:
    content = f.read()

# Replace hardcoded SVGs with Lucide React
import_statement = "import { LayoutDashboard, Users, BookOpen, BarChart3, CalendarDays, ClipboardList, Clock, Megaphone, Download, MessageSquare, LogOut, Search, Bell, Menu, GraduationCap, ShieldCheck } from 'lucide-react'\n"
content = content.replace("import { useState, useEffect } from 'react'", "import { useState, useEffect } from 'react'\n" + import_statement)

# Replace the ADMIN_SIDEBAR_MENU with lucide icons
replacements = {
    "IconDashboard": "LayoutDashboard",
    "IconUser": "Users",
    "IconBook": "BookOpen",
    "IconChart": "BarChart3",
    "IconCalendar": "CalendarDays",
    "IconClipboard": "ClipboardList",
    "IconClock": "Clock",
    "IconMegaphone": "Megaphone",
    "IconDownload": "Download",
    "IconMessage": "MessageSquare",
    "IconLogout": "LogOut",
    "IconSearch": "Search",
    "IconBell": "Bell",
    "IconMenu": "Menu",
    "IconGraduation": "GraduationCap",
    "IconCheckDoc": "ShieldCheck"
}

# Remove the custom Icon components
import re
content = re.sub(r'export function Icon[A-Za-z]+\(.*?\).*?return \(\s*<svg.*?</svg>\s*\)\s*}', '', content, flags=re.DOTALL)

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, "w") as f:
    f.write(content)

print("AdminLayout icons replaced.")
